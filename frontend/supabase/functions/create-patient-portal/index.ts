// Supabase Edge Function: create-patient-portal
// Deploy: supabase functions deploy create-patient-portal
//
// Cria um usuário Supabase auth para o paciente, vincula em patients.patient_user_id
// e adiciona role 'paciente' em user_roles. Requer JWT de usuário interno,
// SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY.
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Secrets Supabase incompletos" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const admin = createClient(
      supabaseUrl,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData?.user) {
      return new Response(
        JSON.stringify({ error: "Sessão inválida" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: roles, error: roleLookupError } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", authData.user.id);
    if (roleLookupError) {
      return new Response(
        JSON.stringify({ error: `Falha ao validar permissões: ${roleLookupError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allowedRoles = new Set(["super_admin", "admin", "fisio", "staff"]);
    const isAllowed = (roles ?? []).some((r) => allowedRoles.has(r.role));
    if (!isAllowed) {
      return new Response(
        JSON.stringify({ error: "Usuário sem permissão para criar portal de paciente" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const caller = createClient(
      supabaseUrl,
      anonKey,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );
    const { data: accessiblePatient, error: patientAccessError } = await caller
      .from("patients")
      .select("id")
      .eq("id", patient_id)
      .maybeSingle();
    if (patientAccessError || !accessiblePatient) {
      return new Response(
        JSON.stringify({ error: "Paciente não encontrado ou sem permissão de acesso" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1) Criar usuário auth
    const { data: created, error: createAuthError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createAuthError || !created?.user) {
      return new Response(
        JSON.stringify({ error: createAuthError?.message ?? "Falha ao criar usuário" }),
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
