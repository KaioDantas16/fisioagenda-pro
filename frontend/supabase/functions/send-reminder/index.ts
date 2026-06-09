// Supabase Edge Function: send-reminder
// Envia lembretes WhatsApp 1 dia antes da sessão via Evolution API.
// Deploy: supabase functions deploy send-reminder
// Cron: configurar pg_cron para chamar diariamente às 18h.
// Secrets: EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CLINIC = {
  owner: "Lenilson",
  address: "Av. Flores da Cunha, 3211 — Centro, Caldas Novas",
  name: "Centro Especializado Equilíbrio e Movimento",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const testPhone: string | undefined = body?.test_phone; // se passado, envia 1 mensagem de teste

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const EVOLUTION_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_KEY = Deno.env.get("EVOLUTION_API_KEY");
    const INSTANCE = Deno.env.get("EVOLUTION_INSTANCE");
    if (!EVOLUTION_URL || !EVOLUTION_KEY || !INSTANCE) {
      return new Response(
        JSON.stringify({ error: "Evolution API não configurada nos Secrets" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    async function sendOne(phoneDigits: string, message: string) {
      return fetch(`${EVOLUTION_URL}/message/sendText/${INSTANCE}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: EVOLUTION_KEY },
        body: JSON.stringify({ number: `55${phoneDigits}`, text: message }),
      });
    }

    // Modo teste — apenas dispara 1 mensagem para o número informado.
    if (testPhone) {
      const phone = testPhone.replace(/\D/g, "");
      const msg =
        `🔔 *Teste — FisioAgenda Pro*\n\n` +
        `Lembretes automáticos configurados com sucesso. ` +
        `Quando ativados, os pacientes receberão lembretes 1 dia antes ` +
        `da sessão. 💚`;
      const r = await sendOne(phone, msg);
      return new Response(JSON.stringify({ test: true, ok: r.ok }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Modo produção — busca agendamentos de amanhã ainda sem lembrete.
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    const { data: appointments } = await admin
      .from("appointments")
      .select("id, starts_at, status, reminder_sent, patients(full_name, phone)")
      .gte("starts_at", `${tomorrowStr}T00:00:00`)
      .lte("starts_at", `${tomorrowStr}T23:59:59`)
      .in("status", ["agendado", "confirmado"])
      .eq("reminder_sent", false);

    const results: any[] = [];
    for (const appt of (appointments ?? []) as any[]) {
      const patient = appt.patients;
      if (!patient?.phone) continue;
      const phone = String(patient.phone).replace(/\D/g, "");
      if (!phone) continue;
      const firstName = String(patient.full_name).split(" ")[0];
      const time = new Date(appt.starts_at).toLocaleTimeString("pt-BR", {
        hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
      });
      const message =
        `Olá ${firstName}! 👋\n\n` +
        `Lembrando que você tem sessão de fisioterapia *amanhã* às *${time}* ` +
        `com o ${CLINIC.owner} no ${CLINIC.name}.\n\n` +
        `📍 ${CLINIC.address}\n\n` +
        `Qualquer dúvida, responda esta mensagem. Até amanhã! 💚`;

      const r = await sendOne(phone, message);
      if (r.ok) {
        await admin.from("appointments").update({ reminder_sent: true }).eq("id", appt.id);
        results.push({ patient: patient.full_name, phone, sent: true });
      } else {
        results.push({ patient: patient.full_name, phone, sent: false, status: r.status });
      }
    }

    return new Response(
      JSON.stringify({ sent: results.filter((x) => x.sent).length, total: results.length, details: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
