-- ═══════════════════════════════════════════════════════════════════════════
-- FisioAgenda Pro — Migrations consolidadas (iteração 4)
-- ═══════════════════════════════════════════════════════════════════════════
-- Como aplicar:
--   1) Acesse https://app.supabase.com/project/hfagboocaevlngylsesp
--   2) SQL Editor → New query
--   3) Cole TODO este arquivo e execute
--   4) Verifique: cada bloco usa IF NOT EXISTS, é seguro rodar múltiplas vezes
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 1) Tabela de pacotes de sessões
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.session_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL DEFAULT auth.uid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  package_name TEXT NOT NULL,
  total_sessions INTEGER NOT NULL,
  used_sessions INTEGER NOT NULL DEFAULT 0,
  price_total NUMERIC(10,2) NOT NULL,
  discount_pct NUMERIC(5,2) DEFAULT 0,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pendente',
  valid_until DATE,
  notes TEXT,
  mp_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.session_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pkg_owner" ON public.session_packages;
CREATE POLICY "pkg_owner" ON public.session_packages
  FOR ALL TO authenticated
  USING (therapist_id = auth.uid() OR public.is_super_admin(auth.uid()))
  WITH CHECK (therapist_id = auth.uid() OR public.is_super_admin(auth.uid()));

DROP TRIGGER IF EXISTS pkg_set_therapist ON public.session_packages;
CREATE TRIGGER pkg_set_therapist BEFORE INSERT ON public.session_packages
  FOR EACH ROW EXECUTE FUNCTION public.set_therapist_id();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'tg_set_updated_at') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS pkg_updated ON public.session_packages';
    EXECUTE 'CREATE TRIGGER pkg_updated BEFORE UPDATE ON public.session_packages
             FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at()';
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_session_packages_patient ON public.session_packages(patient_id);
CREATE INDEX IF NOT EXISTS idx_session_packages_therapist ON public.session_packages(therapist_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 2) clinic_settings columns
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.clinic_settings
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS instagram TEXT,
  ADD COLUMN IF NOT EXISTS professional_name TEXT,
  ADD COLUMN IF NOT EXISTS crefito TEXT,
  ADD COLUMN IF NOT EXISTS professional_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS specialties JSONB,
  ADD COLUMN IF NOT EXISTS theme TEXT;


-- ───────────────────────────────────────────────────────────────────────────
-- 3) appointments.reminder_sent — para lembretes WhatsApp (iter 4)
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_appts_reminder
  ON public.appointments(starts_at) WHERE reminder_sent = false;

-- ───────────────────────────────────────────────────────────────────────────
-- 4) integration_settings — toggle/configs do lembrete WhatsApp
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.integration_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp_reminders_enabled BOOLEAN DEFAULT false,
  whatsapp_test_phone TEXT,
  pix_enabled BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "integ_admin" ON public.integration_settings;
CREATE POLICY "integ_admin" ON public.integration_settings
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR auth.uid() IS NOT NULL)
  WITH CHECK (public.is_super_admin(auth.uid()));

-- Linha singleton de configuração
INSERT INTO public.integration_settings (whatsapp_reminders_enabled, pix_enabled)
SELECT false, false
WHERE NOT EXISTS (SELECT 1 FROM public.integration_settings);

-- ═══════════════════════════════════════════════════════════════════════════
-- Pós-migrations: rodar este SELECT para verificar
-- SELECT 'session_packages' AS t, count(*) FROM public.session_packages
-- UNION ALL SELECT 'integration_settings', count(*) FROM public.integration_settings;
-- ═══════════════════════════════════════════════════════════════════════════
