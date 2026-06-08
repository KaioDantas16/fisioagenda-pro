import { supabase } from "@/integrations/supabase/client";

// Client-side stub: creating Supabase auth users requires the service_role key
// which must never be exposed to the browser. To enable patient portal access
// in a Supabase-only architecture, this should be backed by a Supabase Edge
// Function (Deno) calling `auth.admin.createUser`. For now this returns a
// clear error so the UI can surface the limitation.
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

  // Try calling the Supabase Edge Function if it exists in the project.
  try {
    const { data: fnData, error } = await supabase.functions.invoke(
      "create-patient-portal",
      { body: { patientId: data.patientId, email: data.email } },
    );
    if (error) throw error;
    if (fnData?.tempPassword) {
      return { tempPassword: fnData.tempPassword, email: data.email };
    }
  } catch (e: any) {
    // Fall through to the explicit error below.
    console.warn("[patient-portal] edge function unavailable:", e?.message ?? e);
  }

  // Fallback: signUp from the current session (will email a confirmation link).
  const tempPassword = genTempPassword();
  const { error: signUpErr } = await supabase.auth.signUp({
    email: data.email,
    password: tempPassword,
    options: { data: { role: "paciente" } },
  });
  if (signUpErr) throw new Error(signUpErr.message);

  // Note: the patients.patient_user_id linking and user_roles insertion must
  // be done server-side once the user confirms their email. Without a service
  // role key we cannot complete the link here; we surface the temp password so
  // staff can communicate it to the patient.
  return { tempPassword, email: data.email };
}
