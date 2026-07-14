-- 20260714000000_medical_intake.sql

-- 1) Medical Intake Forms (Eventos)
CREATE TABLE public.medical_intake_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid, -- For possible multi-tenant isolation
  title text NOT NULL,
  description text,
  token_hash text UNIQUE NOT NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  max_responses int,
  response_count int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.medical_intake_forms TO authenticated;
GRANT ALL ON public.medical_intake_forms TO service_role;
ALTER TABLE public.medical_intake_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage forms" ON public.medical_intake_forms FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER tg_medical_intake_forms_updated_at BEFORE UPDATE ON public.medical_intake_forms FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 2) Medical Intake Submissions
CREATE TABLE public.medical_intake_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.medical_intake_forms(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  clinic_id uuid,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  full_name_normalized text NOT NULL,
  birth_date date NOT NULL,
  cpf_hash text,
  cpf_last4 text,
  guardian_name_normalized text,
  guardian_cpf_hash text,
  guardian_cpf_last4 text,
  is_minor boolean NOT NULL DEFAULT false,
  has_heart_condition boolean NOT NULL DEFAULT false,
  has_diabetes boolean NOT NULL DEFAULT false,
  has_kidney_condition boolean NOT NULL DEFAULT false,
  has_psychological_condition boolean NOT NULL DEFAULT false,
  has_medication_allergy boolean NOT NULL DEFAULT false,
  has_food_allergy boolean NOT NULL DEFAULT false,
  has_recent_injury boolean NOT NULL DEFAULT false,
  has_recent_fracture boolean NOT NULL DEFAULT false,
  has_recent_surgery boolean NOT NULL DEFAULT false,
  has_recent_hospitalization boolean NOT NULL DEFAULT false,
  has_disability_or_specific_condition boolean NOT NULL DEFAULT false,
  consent_accepted boolean NOT NULL DEFAULT false,
  duplicate_status text,
  review_status text NOT NULL DEFAULT 'pendente',
  risk_level text NOT NULL DEFAULT 'nenhum',
  raw_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.medical_intake_submissions TO authenticated;
GRANT ALL ON public.medical_intake_submissions TO service_role;
ALTER TABLE public.medical_intake_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage submissions" ON public.medical_intake_submissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Note: Public inserts will be done via an edge function / server action using Service Role, not anonymous RLS.

-- 3) Medical Intake Consents (Optional depending on model, but requested)
CREATE TABLE public.medical_intake_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.medical_intake_submissions(id) ON DELETE CASCADE,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  consent_version text NOT NULL DEFAULT 'v1',
  guardian_name text,
  guardian_cpf_hash text,
  guardian_cpf_last4 text,
  ip_hash text,
  user_agent_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.medical_intake_consents TO authenticated;
GRANT ALL ON public.medical_intake_consents TO service_role;
ALTER TABLE public.medical_intake_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage consents" ON public.medical_intake_consents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4) Add columns to patients
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS blood_type text,
  ADD COLUMN IF NOT EXISTS rh_factor text,
  ADD COLUMN IF NOT EXISTS origin text DEFAULT 'Sistema',
  ADD COLUMN IF NOT EXISTS source_event_name text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'ativo',
  ADD COLUMN IF NOT EXISTS needs_review boolean DEFAULT false;
