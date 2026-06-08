
-- 1. Roles: Lenilson vira admin (estava como super_admin por engano)
DELETE FROM public.user_roles WHERE user_id = 'd518f8a3-be41-43dc-8d80-4f208b34ce71';
INSERT INTO public.user_roles(user_id, role) VALUES ('d518f8a3-be41-43dc-8d80-4f208b34ce71', 'admin');

-- Política para super admin gerenciar papéis
CREATE POLICY "Super admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- 2. Adiciona therapist_id em todas as tabelas clínicas
ALTER TABLE public.patients      ADD COLUMN IF NOT EXISTS therapist_id uuid;
ALTER TABLE public.patients      ADD COLUMN IF NOT EXISTS patient_user_id uuid UNIQUE;
ALTER TABLE public.sessions      ADD COLUMN IF NOT EXISTS therapist_id uuid;
ALTER TABLE public.records       ADD COLUMN IF NOT EXISTS therapist_id uuid;
ALTER TABLE public.vital_signs   ADD COLUMN IF NOT EXISTS therapist_id uuid;
ALTER TABLE public.goals         ADD COLUMN IF NOT EXISTS therapist_id uuid;
ALTER TABLE public.appointments  ADD COLUMN IF NOT EXISTS therapist_id uuid;

-- Backfill p/ Lenilson
UPDATE public.patients     SET therapist_id = 'd518f8a3-be41-43dc-8d80-4f208b34ce71' WHERE therapist_id IS NULL;
UPDATE public.sessions     SET therapist_id = 'd518f8a3-be41-43dc-8d80-4f208b34ce71' WHERE therapist_id IS NULL;
UPDATE public.records      SET therapist_id = 'd518f8a3-be41-43dc-8d80-4f208b34ce71' WHERE therapist_id IS NULL;
UPDATE public.vital_signs  SET therapist_id = 'd518f8a3-be41-43dc-8d80-4f208b34ce71' WHERE therapist_id IS NULL;
UPDATE public.goals        SET therapist_id = 'd518f8a3-be41-43dc-8d80-4f208b34ce71' WHERE therapist_id IS NULL;
UPDATE public.appointments SET therapist_id = 'd518f8a3-be41-43dc-8d80-4f208b34ce71' WHERE therapist_id IS NULL;

-- 3. Trigger que auto-preenche therapist_id com auth.uid() em inserts
CREATE OR REPLACE FUNCTION public.set_therapist_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.therapist_id IS NULL THEN
    NEW.therapist_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_patients_set_therapist     BEFORE INSERT ON public.patients     FOR EACH ROW EXECUTE FUNCTION public.set_therapist_id();
CREATE TRIGGER trg_sessions_set_therapist     BEFORE INSERT ON public.sessions     FOR EACH ROW EXECUTE FUNCTION public.set_therapist_id();
CREATE TRIGGER trg_records_set_therapist      BEFORE INSERT ON public.records      FOR EACH ROW EXECUTE FUNCTION public.set_therapist_id();
CREATE TRIGGER trg_vital_signs_set_therapist  BEFORE INSERT ON public.vital_signs  FOR EACH ROW EXECUTE FUNCTION public.set_therapist_id();
CREATE TRIGGER trg_goals_set_therapist        BEFORE INSERT ON public.goals        FOR EACH ROW EXECUTE FUNCTION public.set_therapist_id();
CREATE TRIGGER trg_appointments_set_therapist BEFORE INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.set_therapist_id();

-- 4. Helper p/ paciente identificar o próprio cadastro
CREATE OR REPLACE FUNCTION public.current_patient_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.patients WHERE patient_user_id = auth.uid() LIMIT 1;
$$;

-- 5. Substitui RLS permissiva por políticas escopadas
DROP POLICY IF EXISTS "Authenticated manage patients"     ON public.patients;
DROP POLICY IF EXISTS "Authenticated manage sessions"     ON public.sessions;
DROP POLICY IF EXISTS "Authenticated manage records"      ON public.records;
DROP POLICY IF EXISTS "Authenticated manage vital_signs"  ON public.vital_signs;
DROP POLICY IF EXISTS "Authenticated manage goals"        ON public.goals;
DROP POLICY IF EXISTS "Authenticated manage appointments" ON public.appointments;

-- patients
CREATE POLICY "Therapist or super manages patients" ON public.patients FOR ALL TO authenticated
  USING (therapist_id = auth.uid() OR public.is_super_admin(auth.uid()))
  WITH CHECK (therapist_id = auth.uid() OR public.is_super_admin(auth.uid()));
CREATE POLICY "Patient reads own record" ON public.patients FOR SELECT TO authenticated
  USING (patient_user_id = auth.uid());

-- sessions
CREATE POLICY "Therapist or super manages sessions" ON public.sessions FOR ALL TO authenticated
  USING (therapist_id = auth.uid() OR public.is_super_admin(auth.uid()))
  WITH CHECK (therapist_id = auth.uid() OR public.is_super_admin(auth.uid()));
CREATE POLICY "Patient reads own sessions" ON public.sessions FOR SELECT TO authenticated
  USING (patient_id = public.current_patient_id());

-- records
CREATE POLICY "Therapist or super manages records" ON public.records FOR ALL TO authenticated
  USING (therapist_id = auth.uid() OR public.is_super_admin(auth.uid()))
  WITH CHECK (therapist_id = auth.uid() OR public.is_super_admin(auth.uid()));
CREATE POLICY "Patient reads own records" ON public.records FOR SELECT TO authenticated
  USING (patient_id = public.current_patient_id());

-- vital_signs
CREATE POLICY "Therapist or super manages vital_signs" ON public.vital_signs FOR ALL TO authenticated
  USING (therapist_id = auth.uid() OR public.is_super_admin(auth.uid()))
  WITH CHECK (therapist_id = auth.uid() OR public.is_super_admin(auth.uid()));
CREATE POLICY "Patient reads own vital_signs" ON public.vital_signs FOR SELECT TO authenticated
  USING (patient_id = public.current_patient_id());

-- goals
CREATE POLICY "Therapist or super manages goals" ON public.goals FOR ALL TO authenticated
  USING (therapist_id = auth.uid() OR public.is_super_admin(auth.uid()))
  WITH CHECK (therapist_id = auth.uid() OR public.is_super_admin(auth.uid()));
CREATE POLICY "Patient reads own goals" ON public.goals FOR SELECT TO authenticated
  USING (patient_id = public.current_patient_id());

-- appointments
CREATE POLICY "Therapist or super manages appointments" ON public.appointments FOR ALL TO authenticated
  USING (therapist_id = auth.uid() OR public.is_super_admin(auth.uid()))
  WITH CHECK (therapist_id = auth.uid() OR public.is_super_admin(auth.uid()));
CREATE POLICY "Patient reads own appointments" ON public.appointments FOR SELECT TO authenticated
  USING (patient_id = public.current_patient_id());

-- 6. profile flag p/ troca de senha
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;
