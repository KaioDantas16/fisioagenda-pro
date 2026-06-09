// Supabase Edge Function: check-pix-status
// Consulta status do pagamento Pix e atualiza session_packages.payment_status.
// Deploy: supabase functions deploy check-pix-status
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { payment_id, package_id } = await req.json();
    const MP_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MP_TOKEN) {
      return new Response(JSON.stringify({ error: "MERCADOPAGO_ACCESS_TOKEN não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const r = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      headers: { Authorization: `Bearer ${MP_TOKEN}` },
    });
    const data = await r.json();
    const status = data?.status;

    if (status === "approved" && package_id) {
      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await admin.from("session_packages")
        .update({ payment_status: "pago", mp_payment_id: String(payment_id) })
        .eq("id", package_id);
    }

    return new Response(JSON.stringify({ status, paid: status === "approved" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
