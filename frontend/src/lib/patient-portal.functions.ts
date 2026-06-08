import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function genTempPassword() {
  // 10 chars: letras + dígitos + 1 símbolo, fácil de ditar mas seguro
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

export const createPatientPortalAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { patientId: string; email: string }) => {
      if (!input?.patientId) throw new Error("patientId obrigatório");
      if (!input?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
        throw new Error("E-mail inválido");
      }
      return input;
    },
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Caller precisa ser admin ou super_admin
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roleList = (roles ?? []).map((r: any) => r.role);
    if (!roleList.includes("admin") && !roleList.includes("super_admin")) {
      throw new Error("Sem permissão para criar acessos de paciente");
    }

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    // Confere o paciente e se ainda não tem acesso
    const { data: patient, error: pErr } = await supabaseAdmin
      .from("patients")
      .select("id, full_name, patient_user_id")
      .eq("id", data.patientId)
      .single();
    if (pErr || !patient) throw new Error("Paciente não encontrado");
    if (patient.patient_user_id) {
      throw new Error("Este paciente já possui acesso ao portal");
    }

    const tempPassword = genTempPassword();

    // Cria o usuário no auth
    const { data: created, error: createErr } =
      await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: patient.full_name,
          role: "paciente",
        },
      });
    if (createErr || !created.user) {
      throw new Error(createErr?.message ?? "Falha ao criar usuário");
    }

    const newUserId = created.user.id;

    // Vincula no paciente
    const { error: linkErr } = await supabaseAdmin
      .from("patients")
      .update({ patient_user_id: newUserId })
      .eq("id", data.patientId);
    if (linkErr) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw new Error("Falha ao vincular paciente ao usuário");
    }

    // Marca para troca obrigatória de senha
    await supabaseAdmin
      .from("profiles")
      .upsert(
        { id: newUserId, full_name: patient.full_name, must_change_password: true },
        { onConflict: "id" },
      );

    // Atribui o papel "paciente"
    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUserId, role: "paciente" });

    return { tempPassword, email: data.email };
  });
