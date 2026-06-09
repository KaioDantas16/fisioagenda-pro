import { supabase } from "@/integrations/supabase/client";

/**
 * Cria acesso de portal para um paciente chamando a Edge Function Supabase
 * `create-patient-portal` (requer SUPABASE_SERVICE_ROLE_KEY no ambiente da function).
 *
 * Deploy da function: supabase functions deploy create-patient-portal
 * Código em /app/frontend/supabase/functions/create-patient-portal/index.ts
 */
function genTempPassword() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const syms = "!@#$%&*";
  const rand = (s: string) => s[Math.floor(Math.random() * s.length)];
  let out = "";
  for (let i = 0; i < 4; i++) out += rand(letters);
  for (let i = 0; i < 4; i++) out += rand(digits);
  out += rand(syms);
  out += rand(letters).toLowerCase();
  return out;
}

export async function createPatientPortalAccess({
  data,
}: {
  data: { patientId: string; email: string };
}): Promise<{ tempPassword: string; email: string }> {
  if (!data?.patientId) throw new Error("patientId obrigatório");
  if (!data?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    throw new Error("E-mail inválido");
  }

  const tempPassword = genTempPassword();

  const { data: fnData, error } = await supabase.functions.invoke(
    "create-patient-portal",
    {
      body: {
        patient_id: data.patientId,
        email: data.email,
        password: tempPassword,
      },
    },
  );

  if (error) {
    throw new Error(
      `Edge Function 'create-patient-portal' indisponível: ${error.message}. ` +
      `Deploy: supabase functions deploy create-patient-portal`,
    );
  }
  if (fnData?.error) throw new Error(fnData.error);
  if (!fnData?.success) throw new Error("Resposta inválida da Edge Function");

  return { tempPassword: fnData.tempPassword ?? tempPassword, email: data.email };
}
