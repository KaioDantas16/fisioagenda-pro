-- Migration: 202606080001_session_packages
-- Cria a tabela de pacotes de sessões com RLS e triggers padrão.

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

-- Trigger genérico de updated_at (assume função tg_set_updated_at existe).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'tg_set_updated_at'
  ) THEN
    EXECUTE 'DROP TRIGGER IF EXISTS pkg_updated ON public.session_packages';
    EXECUTE 'CREATE TRIGGER pkg_updated BEFORE UPDATE ON public.session_packages
             FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at()';
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_session_packages_patient ON public.session_packages(patient_id);
CREATE INDEX IF NOT EXISTS idx_session_packages_therapist ON public.session_packages(therapist_id);
