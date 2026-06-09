// Supabase Edge Function: create-pix
// Cria cobrança Pix dinâmica via Mercado Pago.
// Deploy: supabase functions deploy create-pix
// Secrets: MERCADOPAGO_ACCESS_TOKEN (production access token do MP)
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

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
    const { amount, description, patient_name, package_id, payer_email } =
      await req.json();

    if (!amount || !package_id) {
      return new Response(
        JSON.stringify({ error: "amount e package_id são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const MP_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MP_TOKEN) {
      return new Response(
        JSON.stringify({ error: "MERCADOPAGO_ACCESS_TOKEN não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = {
      transaction_amount: Number(amount),
      description: description ?? "Pacote de sessões — FisioAgenda Pro",
      payment_method_id: "pix",
      payer: { email: payer_email ?? "pagamento@fisioagendapro.com.br" },
      metadata: { package_id, patient_name },
      date_of_expiration: new Date(Date.now() + 30 * 60_000).toISOString(),
    };

    const response = await fetch(
      "https://api.mercadopago.com/v1/payments",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MP_TOKEN}`,
          "X-Idempotency-Key": package_id,
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data?.message ?? "Erro Mercado Pago", details: data }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        pix_code: data?.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: data?.point_of_interaction?.transaction_data?.qr_code_base64,
        payment_id: String(data?.id ?? ""),
        status: data?.status,
        expires_at: payload.date_of_expiration,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
