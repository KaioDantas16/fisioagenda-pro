// Supabase Edge Function: create-patient-portal
// Deploy: supabase functions deploy create-patient-portal
//
// Cria um usuário Supabase auth para o paciente, vincula em patients.patient_user_id
// e adiciona role 'paciente' em user_roles. Requer SUPABASE_SERVICE_ROLE_KEY.
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { patient_id, email, password } = await req.json();

    if (!patient_id || !email || !password) {
      return new Response(
        JSON.stringify({ error: "patient_id, email e password são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1) Criar usuário auth
    const { data: created, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authError || !created?.user) {
      return new Response(
        JSON.stringify({ error: authError?.message ?? "Falha ao criar usuário" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const userId = created.user.id;

    // 2) Vincular ao paciente
    const { error: linkError } = await admin
      .from("patients")
      .update({ patient_user_id: userId })
      .eq("id", patient_id);
    if (linkError) {
      // rollback do usuário criado se falhar
      await admin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: `Falha ao vincular paciente: ${linkError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3) Adicionar role 'paciente' em user_roles
    const { error: roleError } = await admin
      .from("user_roles")
      .insert({ user_id: userId, role: "paciente" });
    if (roleError) {
      console.warn("[create-patient-portal] user_roles insert warning:", roleError.message);
    }

    return new Response(
      JSON.stringify({ success: true, user_id: userId, email, tempPassword: password }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
