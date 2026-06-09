/**
 * Extensão local de tipos do Supabase enquanto não regeneramos via
 * `supabase gen types typescript`. Quando rodar o gen, este arquivo
 * pode ser apagado.
 */
export type SessionPackageRow = {
  id: string;
  therapist_id: string;
  patient_id: string;
  package_name: string;
  total_sessions: number;
  used_sessions: number;
  price_total: number;
  discount_pct: number | null;
  payment_method: string | null;
  payment_status: "pendente" | "pago" | null;
  valid_until: string | null;
  notes: string | null;
  mp_payment_id: string | null;
  created_at: string;
  updated_at: string;
};

export type IntegrationSettingsRow = {
  id: string;
  whatsapp_reminders_enabled: boolean;
  whatsapp_test_phone: string | null;
  pix_enabled: boolean;
  updated_at: string;
};
