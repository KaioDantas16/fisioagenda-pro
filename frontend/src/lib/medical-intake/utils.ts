import { differenceInYears, parseISO } from "date-fns";

export function normalizeName(name?: string): string {
  if (!name) return "";
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizeCpfForValidation(cpf?: string): string {
  if (!cpf) return "";
  return cpf.replace(/\D/g, "");
}

export function getCpfLast4(cpf?: string): string {
  const digits = normalizeCpfForValidation(cpf);
  if (digits.length < 4) return "";
  return digits.slice(-4);
}

// TODO: Replace with secure crypto hash in production. This is a local mock.
export async function mockHash(value?: string): Promise<string> {
  if (!value) return "";
  const msgUint8 = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function isMinor(birthDateStr?: string): boolean {
  if (!birthDateStr) return false;
  try {
    const age = differenceInYears(new Date(), parseISO(birthDateStr));
    return age < 18;
  } catch {
    return false;
  }
}

export function calculateRiskLevel(data: any): "nenhum" | "atenção" | "revisão obrigatória" {
  const isMinorPatient = isMinor(data.birth_date);
  const missingGuardian = isMinorPatient && !data.guardian_name;
  const missingConsent = isMinorPatient && !data.consent_accepted;
  const possibleDuplicate = data.duplicate_status === 'Possível duplicidade';

  if (
    data.has_heart_condition ||
    data.has_allergy_medication ||
    data.has_allergy ||
    data.has_diabetes ||
    data.has_recent_fracture ||
    data.has_recent_injury ||
    data.has_surgery_history ||
    data.has_recent_hospitalization ||
    data.has_disability_or_specific_condition ||
    missingGuardian ||
    missingConsent ||
    possibleDuplicate
  ) {
    return "revisão obrigatória";
  }
  
  if (
    data.has_current_medication ||
    data.has_psychological_condition ||
    data.has_kidney_condition ||
    (data.general_observation && data.general_observation.trim().length > 0) ||
    (data.past_diseases && (data.past_diseases.toLowerCase().includes('rinite') || data.past_diseases.toLowerCase().includes('bronquite')))
  ) {
    return "atenção";
  }

  return "nenhum";
}

export function buildAlertSummary(data: any): string[] {
  const alerts: string[] = [];
  if (data.has_heart_condition) alerts.push("Problema Cardíaco");
  if (data.has_diabetes) alerts.push("Diabetes");
  if (data.has_medication_allergy) alerts.push("Alergia a Medicamento");
  if (data.has_recent_surgery) alerts.push("Cirurgia Recente");
  return alerts;
}

export function validateBasicForm(data: any) {
  const errors: Record<string, string> = {};
  if (!data.full_name) errors.full_name = "Nome é obrigatório";
  if (!data.birth_date) errors.birth_date = "Data de nascimento é obrigatória";
  
  if (isMinor(data.birth_date)) {
    if (!data.guardian_name) errors.guardian_name = "Nome do responsável é obrigatório para menores";
    if (!data.consent_accepted) errors.consent_accepted = "Aceite do responsável é obrigatório";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
