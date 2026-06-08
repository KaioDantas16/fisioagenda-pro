
-- Helper trigger reuse
-- (set_therapist_id and tg_set_updated_at already exist)

-- 1) ANAMNESE
CREATE TABLE public.anamnese (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  therapist_id uuid,
  chief_complaint text,
  history_present text,
  history_past text,
  surgeries text,
  medications text,
  allergies text,
  habits text,
  family_history text,
  occupation text,
  physical_activity text,
  sleep text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (patient_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anamnese TO authenticated;
GRANT ALL ON public.anamnese TO service_role;
ALTER TABLE public.anamnese ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Therapist or super manages anamnese" ON public.anamnese
  FOR ALL TO authenticated
  USING (therapist_id = auth.uid() OR is_super_admin(auth.uid()))
  WITH CHECK (therapist_id = auth.uid() OR is_super_admin(auth.uid()));
CREATE POLICY "Patient reads own anamnese" ON public.anamnese
  FOR SELECT TO authenticated
  USING (patient_id = current_patient_id());
CREATE TRIGGER set_therapist_anamnese BEFORE INSERT ON public.anamnese
  FOR EACH ROW EXECUTE FUNCTION public.set_therapist_id();
CREATE TRIGGER set_updated_anamnese BEFORE UPDATE ON public.anamnese
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 2) FUNCTIONAL ASSESSMENT
CREATE TABLE public.functional_assessment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  therapist_id uuid,
  assessment_date date NOT NULL DEFAULT CURRENT_DATE,
  posture text,
  gait text,
  balance text,
  strength text,
  coordination text,
  adl text,
  functional_scale text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.functional_assessment TO authenticated;
GRANT ALL ON public.functional_assessment TO service_role;
ALTER TABLE public.functional_assessment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Therapist or super manages functional" ON public.functional_assessment
  FOR ALL TO authenticated
  USING (therapist_id = auth.uid() OR is_super_admin(auth.uid()))
  WITH CHECK (therapist_id = auth.uid() OR is_super_admin(auth.uid()));
CREATE POLICY "Patient reads own functional" ON public.functional_assessment
  FOR SELECT TO authenticated
  USING (patient_id = current_patient_id());
CREATE TRIGGER set_therapist_functional BEFORE INSERT ON public.functional_assessment
  FOR EACH ROW EXECUTE FUNCTION public.set_therapist_id();
CREATE TRIGGER set_updated_functional BEFORE UPDATE ON public.functional_assessment
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 3) PAIN MAP ENTRIES
CREATE TABLE public.pain_map_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  therapist_id uuid,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  region text NOT NULL,
  side text,
  intensity integer NOT NULL DEFAULT 0 CHECK (intensity >= 0 AND intensity <= 10),
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pain_map_entries TO authenticated;
GRANT ALL ON public.pain_map_entries TO service_role;
ALTER TABLE public.pain_map_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Therapist or super manages pain_map" ON public.pain_map_entries
  FOR ALL TO authenticated
  USING (therapist_id = auth.uid() OR is_super_admin(auth.uid()))
  WITH CHECK (therapist_id = auth.uid() OR is_super_admin(auth.uid()));
CREATE POLICY "Patient reads own pain_map" ON public.pain_map_entries
  FOR SELECT TO authenticated
  USING (patient_id = current_patient_id());
CREATE TRIGGER set_therapist_painmap BEFORE INSERT ON public.pain_map_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_therapist_id();

-- 4) ROM MEASUREMENTS
CREATE TABLE public.rom_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  therapist_id uuid,
  measured_at date NOT NULL DEFAULT CURRENT_DATE,
  joint text NOT NULL,
  movement text NOT NULL,
  side text,
  active_degrees numeric,
  passive_degrees numeric,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rom_measurements TO authenticated;
GRANT ALL ON public.rom_measurements TO service_role;
ALTER TABLE public.rom_measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Therapist or super manages rom" ON public.rom_measurements
  FOR ALL TO authenticated
  USING (therapist_id = auth.uid() OR is_super_admin(auth.uid()))
  WITH CHECK (therapist_id = auth.uid() OR is_super_admin(auth.uid()));
CREATE POLICY "Patient reads own rom" ON public.rom_measurements
  FOR SELECT TO authenticated
  USING (patient_id = current_patient_id());
CREATE TRIGGER set_therapist_rom BEFORE INSERT ON public.rom_measurements
  FOR EACH ROW EXECUTE FUNCTION public.set_therapist_id();

-- 5) SPECIAL TESTS
CREATE TABLE public.special_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  therapist_id uuid,
  performed_at date NOT NULL DEFAULT CURRENT_DATE,
  test_name text NOT NULL,
  region text,
  result text NOT NULL DEFAULT 'inconclusivo',
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.special_tests TO authenticated;
GRANT ALL ON public.special_tests TO service_role;
ALTER TABLE public.special_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Therapist or super manages tests" ON public.special_tests
  FOR ALL TO authenticated
  USING (therapist_id = auth.uid() OR is_super_admin(auth.uid()))
  WITH CHECK (therapist_id = auth.uid() OR is_super_admin(auth.uid()));
CREATE POLICY "Patient reads own tests" ON public.special_tests
  FOR SELECT TO authenticated
  USING (patient_id = current_patient_id());
CREATE TRIGGER set_therapist_tests BEFORE INSERT ON public.special_tests
  FOR EACH ROW EXECUTE FUNCTION public.set_therapist_id();

-- 6) PERIMETRY
CREATE TABLE public.perimetry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  therapist_id uuid,
  measured_at date NOT NULL DEFAULT CURRENT_DATE,
  segment text NOT NULL,
  side text,
  measurement_cm numeric NOT NULL,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.perimetry TO authenticated;
GRANT ALL ON public.perimetry TO service_role;
ALTER TABLE public.perimetry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Therapist or super manages perimetry" ON public.perimetry
  FOR ALL TO authenticated
  USING (therapist_id = auth.uid() OR is_super_admin(auth.uid()))
  WITH CHECK (therapist_id = auth.uid() OR is_super_admin(auth.uid()));
CREATE POLICY "Patient reads own perimetry" ON public.perimetry
  FOR SELECT TO authenticated
  USING (patient_id = current_patient_id());
CREATE TRIGGER set_therapist_perimetry BEFORE INSERT ON public.perimetry
  FOR EACH ROW EXECUTE FUNCTION public.set_therapist_id();

-- 7) ATTACHMENTS
CREATE TABLE public.attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  therapist_id uuid,
  file_name text NOT NULL,
  mime_type text,
  size_bytes integer,
  storage_path text NOT NULL,
  description text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attachments TO authenticated;
GRANT ALL ON public.attachments TO service_role;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Therapist or super manages attachments" ON public.attachments
  FOR ALL TO authenticated
  USING (therapist_id = auth.uid() OR is_super_admin(auth.uid()))
  WITH CHECK (therapist_id = auth.uid() OR is_super_admin(auth.uid()));
CREATE POLICY "Patient reads own attachments" ON public.attachments
  FOR SELECT TO authenticated
  USING (patient_id = current_patient_id());
CREATE TRIGGER set_therapist_attachments BEFORE INSERT ON public.attachments
  FOR EACH ROW EXECUTE FUNCTION public.set_therapist_id();

-- 8) Expand records
ALTER TABLE public.records
  ADD COLUMN IF NOT EXISTS cid10 text,
  ADD COLUMN IF NOT EXISTS evolution_score integer,
  ADD COLUMN IF NOT EXISTS pain_location_text text;

-- 9) Storage policies for clinic-assets bucket (patients/{id}/ folder)
CREATE POLICY "Therapist manages patient attachments folder"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'clinic-assets'
  AND (storage.foldername(name))[1] = 'patients'
  AND (
    is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id::text = (storage.foldername(name))[2]
        AND (p.therapist_id = auth.uid() OR p.patient_user_id = auth.uid())
    )
  )
)
WITH CHECK (
  bucket_id = 'clinic-assets'
  AND (storage.foldername(name))[1] = 'patients'
  AND (
    is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id::text = (storage.foldername(name))[2]
        AND p.therapist_id = auth.uid()
    )
  )
);
