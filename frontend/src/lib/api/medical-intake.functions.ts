import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { MedicalIntakeForm, MedicalIntakeSubmission } from "../medical-intake/types";
import { calculateRiskLevel, getCpfLast4, isMinor, mockHash, normalizeCpfForValidation } from "../medical-intake/utils";

// Local in-memory mock database
const MOCK_DB = {
  submissions: [] as any[],
  consents: [] as any[],
  patients: [] as any[],
};

// Mode: MOCK_LOCAL or SUPABASE_LOCAL_READY
const MODE = import.meta.env.VITE_MEDICAL_INTAKE_MODE || 'MOCK_LOCAL';

// Zod schema for input validation
const submissionSchema = z.object({
  token: z.string().min(1),
  idempotencyKey: z.string().min(1),
  formId: z.string().optional(),
  honeypot: z.string().optional(),
  formData: z.record(z.any()),
});

export const submitMedicalIntake = createServerFn({ method: "POST" })
  .inputValidator(submissionSchema)
  .handler(async ({ data }) => {
    // 1. Validate honeypot
    if (data.honeypot) {
      throw new Error("Validation failed"); // Generic error for bots
    }

    // 2. Validate token/form existence
    if (data.token !== "demo-token") {
      throw new Error("Formulário inválido ou expirado.");
    }

    const { formData } = data;

    // 3. Validate required fields
    if (!formData.full_name || !formData.birth_date) {
      throw new Error("Nome e data de nascimento são obrigatórios.");
    }

    // 4. Validate minors
    if (isMinor(formData.birth_date)) {
      if (!formData.guardian_name || !formData.guardian_cpf) {
        throw new Error("Responsável legal é obrigatório para menores de 18 anos.");
      }
      if (!formData.consent_accepted) {
        throw new Error("O consentimento do responsável é obrigatório.");
      }
    }

    // 5. Block long fields to prevent abuse
    if (formData.full_name.length > 200 || (formData.general_observation && formData.general_observation.length > 1000)) {
      throw new Error("Tamanho máximo excedido para os campos.");
    }

    // 6. Idempotency Check
    const existingSubmission = MOCK_DB.submissions.find(s => s.idempotency_key === data.idempotencyKey);
    if (existingSubmission) {
      return { success: true, message: "Já recebido anteriormente", submissionId: existingSubmission.id };
    }

    // 7. Duplicate detection
    const normalizedName = formData.full_name.trim().toLowerCase();
    const normalizedCpf = normalizeCpfForValidation(formData.cpf);
    const cpfHash = normalizedCpf ? await mockHash(normalizedCpf) : undefined;
    
    let isDuplicate = false;
    for (const patient of MOCK_DB.patients) {
      if (cpfHash && patient.cpf_hash === cpfHash) {
        isDuplicate = true;
        break;
      }
      if (patient.normalized_name === normalizedName && patient.birth_date === formData.birth_date) {
        isDuplicate = true;
        break;
      }
    }

    const riskLevel = calculateRiskLevel(formData);

    // 8. Create local patient mock
    const newPatient = {
      id: crypto.randomUUID(),
      normalized_name: normalizedName,
      birth_date: formData.birth_date,
      cpf_hash: cpfHash,
      cpf_last4: getCpfLast4(formData.cpf),
      needs_review: true,
      duplicate_status: isDuplicate ? "possible" : "none",
      risk_level: riskLevel,
      origin: "Ficha Médica Digital",
      event: "Jogos Estudantis 2026",
      status: "Aguardando conferência",
      created_at: new Date().toISOString()
    };
    
    MOCK_DB.patients.push(newPatient);

    // 9. Save submission
    const submissionId = crypto.randomUUID();
    const submission = {
      id: submissionId,
      idempotency_key: data.idempotencyKey,
      patient_id: newPatient.id,
      form_id: '1',
      form_data: formData,
      status: "Aguardando conferência",
      created_at: new Date().toISOString()
    };

    MOCK_DB.submissions.push(submission);

    // 10. Save consent if present
    if (formData.consent_accepted && formData.guardian_name) {
      MOCK_DB.consents.push({
        id: crypto.randomUUID(),
        submission_id: submissionId,
        guardian_name: formData.guardian_name,
        guardian_cpf_last4: getCpfLast4(formData.guardian_cpf),
        accepted_at: new Date().toISOString()
      });
    }

    // Do not log CPF or sensitive medical info in clear text
    console.log(`[Medical Intake] Nova submissão salva localmente (MOCK_LOCAL). Paciente ID: ${newPatient.id}, Risco: ${riskLevel}`);

    return { 
      success: true, 
      message: "Ficha recebida com sucesso.", 
      submissionId, 
      patientId: newPatient.id,
      riskLevel,
      isDuplicate
    };
  });

export const getMockPatients = createServerFn({ method: "GET" })
  .handler(async () => {
    return MOCK_DB.patients;
  });

export const getMockSubmissions = createServerFn({ method: "GET" })
  .handler(async () => {
    return MOCK_DB.submissions;
  });
