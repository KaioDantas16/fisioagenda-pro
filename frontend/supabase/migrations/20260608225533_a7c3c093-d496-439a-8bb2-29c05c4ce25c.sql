-- 1. Expand patients
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS rg text,
  ADD COLUMN IF NOT EXISTS profissao text,
  ADD COLUMN IF NOT EXISTS escolaridade text,
  ADD COLUMN IF NOT EXISTS estado_civil text,
  ADD COLUMN IF NOT EXISTS cep text,
  ADD COLUMN IF NOT EXISTS doctor_name text,
  ADD COLUMN IF NOT EXISTS insurance_plan text,
  ADD COLUMN IF NOT EXISTS sessions_authorized integer,
  ADD COLUMN IF NOT EXISTS discharge_date date,
  ADD COLUMN IF NOT EXISTS discharge_notes text;

-- 2. Expand pain_map_entries
ALTER TABLE public.pain_map_entries
  ADD COLUMN IF NOT EXISTS quality text,
  ADD COLUMN IF NOT EXISTS factors_better text,
  ADD COLUMN IF NOT EXISTS factors_worse text,
  ADD COLUMN IF NOT EXISTS timing text;

-- 3. neuro_assessment
CREATE TABLE IF NOT EXISTS public.neuro_assessment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  therapist_id uuid NOT NULL DEFAULT auth.uid(),
  assessed_at date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL,
  item text NOT NULL,
  side text,
  value text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.neuro_assessment TO authenticated;
GRANT ALL ON public.neuro_assessment TO service_role;
ALTER TABLE public.neuro_assessment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "neuro_owner_all" ON public.neuro_assessment FOR ALL TO authenticated
  USING (therapist_id = auth.uid() OR is_super_admin(auth.uid()))
  WITH CHECK (therapist_id = auth.uid() OR is_super_admin(auth.uid()));
CREATE POLICY "neuro_patient_read" ON public.neuro_assessment FOR SELECT TO authenticated
  USING (patient_id = current_patient_id());
CREATE TRIGGER neuro_set_therapist BEFORE INSERT ON public.neuro_assessment
  FOR EACH ROW EXECUTE FUNCTION public.set_therapist_id();
CREATE TRIGGER neuro_updated BEFORE UPDATE ON public.neuro_assessment
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 4. session_parameters (per-session technique params)
CREATE TABLE IF NOT EXISTS public.session_parameters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  therapist_id uuid NOT NULL DEFAULT auth.uid(),
  technique text NOT NULL,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_parameters TO authenticated;
GRANT ALL ON public.session_parameters TO service_role;
ALTER TABLE public.session_parameters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sp_owner_all" ON public.session_parameters FOR ALL TO authenticated
  USING (therapist_id = auth.uid() OR is_super_admin(auth.uid()))
  WITH CHECK (therapist_id = auth.uid() OR is_super_admin(auth.uid()));
CREATE POLICY "sp_patient_read" ON public.session_parameters FOR SELECT TO authenticated
  USING (patient_id = current_patient_id());
CREATE TRIGGER sp_set_therapist BEFORE INSERT ON public.session_parameters
  FOR EACH ROW EXECUTE FUNCTION public.set_therapist_id();
CREATE TRIGGER sp_updated BEFORE UPDATE ON public.session_parameters
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 5. Update delete_patient_cascade
CREATE OR REPLACE FUNCTION public.delete_patient_cascade(_patient_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_owner uuid;
BEGIN
  SELECT therapist_id INTO v_owner FROM public.patients WHERE id = _patient_id;
  IF v_owner IS NULL THEN RAISE EXCEPTION 'Paciente não encontrado'; END IF;
  IF v_owner <> auth.uid() AND NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;
  DELETE FROM public.session_parameters WHERE patient_id = _patient_id;
  DELETE FROM public.neuro_assessment WHERE patient_id = _patient_id;
  DELETE FROM public.attachments WHERE patient_id = _patient_id;
  DELETE FROM public.perimetry WHERE patient_id = _patient_id;
  DELETE FROM public.special_tests WHERE patient_id = _patient_id;
  DELETE FROM public.rom_measurements WHERE patient_id = _patient_id;
  DELETE FROM public.pain_map_entries WHERE patient_id = _patient_id;
  DELETE FROM public.functional_assessment WHERE patient_id = _patient_id;
  DELETE FROM public.anamnese WHERE patient_id = _patient_id;
  DELETE FROM public.vital_signs WHERE patient_id = _patient_id;
  DELETE FROM public.goals WHERE patient_id = _patient_id;
  DELETE FROM public.records WHERE patient_id = _patient_id;
  DELETE FROM public.sessions WHERE patient_id = _patient_id;
  DELETE FROM public.appointments WHERE patient_id = _patient_id;
  DELETE FROM public.patients WHERE id = _patient_id;
END;
$function$;