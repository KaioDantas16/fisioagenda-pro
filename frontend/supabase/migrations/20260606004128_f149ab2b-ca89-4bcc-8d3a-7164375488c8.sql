
-- 1) Roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'fisio', 'staff', 'paciente');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin')
$$;

CREATE POLICY "Authenticated view roles" ON public.user_roles FOR SELECT TO authenticated USING (true);

-- 2) Extend patients
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS classification text NOT NULL DEFAULT 'estavel',
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS insurance text,
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- 3) Sessions
CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  duration_minutes int NOT NULL DEFAULT 60,
  procedure text,
  status text NOT NULL DEFAULT 'agendado',
  attended boolean,
  price numeric(10,2),
  payment_method text,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO authenticated;
GRANT ALL ON public.sessions TO service_role;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage sessions" ON public.sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER tg_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_sessions_starts_at ON public.sessions(starts_at);
CREATE INDEX idx_sessions_patient ON public.sessions(patient_id);

-- 4) Records (SOAP)
CREATE TABLE public.records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  record_date date NOT NULL DEFAULT current_date,
  subjective text,
  objective text,
  assessment text,
  plan text,
  pain_scale int CHECK (pain_scale BETWEEN 0 AND 10),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.records TO authenticated;
GRANT ALL ON public.records TO service_role;
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage records" ON public.records FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER tg_records_updated_at BEFORE UPDATE ON public.records FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_records_patient ON public.records(patient_id);

-- 5) Vital Signs
CREATE TABLE public.vital_signs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  measured_at timestamptz NOT NULL DEFAULT now(),
  systolic int,
  diastolic int,
  heart_rate int,
  respiratory_rate int,
  temperature numeric(4,1),
  spo2 int,
  weight numeric(5,2),
  height numeric(4,2),
  bmi numeric(5,2) GENERATED ALWAYS AS (
    CASE WHEN height IS NOT NULL AND height > 0 AND weight IS NOT NULL
         THEN ROUND((weight / (height * height))::numeric, 2)
         ELSE NULL END
  ) STORED,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vital_signs TO authenticated;
GRANT ALL ON public.vital_signs TO service_role;
ALTER TABLE public.vital_signs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage vital_signs" ON public.vital_signs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_vitals_patient ON public.vital_signs(patient_id);

-- 6) Goals
CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  target_date date,
  status text NOT NULL DEFAULT 'em_andamento',
  progress int NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage goals" ON public.goals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER tg_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 7) Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Authenticated insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- 8) Login attempts (audit)
CREATE TABLE public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text,
  user_agent text,
  success boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.login_attempts TO authenticated;
GRANT ALL ON public.login_attempts TO service_role;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins read login_attempts" ON public.login_attempts FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));
CREATE INDEX idx_login_attempts_created ON public.login_attempts(created_at DESC);

-- 9) Clinic settings (single row)
CREATE TABLE public.clinic_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Centro Especializado Equilíbrio e Movimento',
  address text,
  phone text,
  instagram text,
  professional_name text NOT NULL DEFAULT 'Lenilson Gouveia de Jesus',
  crefito text NOT NULL DEFAULT 'CREFITO-9',
  professional_photo_url text,
  specialties jsonb NOT NULL DEFAULT '[]'::jsonb,
  theme text NOT NULL DEFAULT 'default',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.clinic_settings TO authenticated;
GRANT ALL ON public.clinic_settings TO service_role;
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read clinic_settings" ON public.clinic_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins update clinic_settings" ON public.clinic_settings FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "Super admins insert clinic_settings" ON public.clinic_settings FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER tg_clinic_settings_updated_at BEFORE UPDATE ON public.clinic_settings FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.clinic_settings (address, phone, specialties) VALUES (
  'Caldas Novas, GO', '(64) 9 0000-0000',
  '["Fisioterapia ortopédica","Fisioterapia neurológica","RPG","Pilates clínico"]'::jsonb
);

-- 10) Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.patients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vital_signs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.goals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 11) Promote super admins
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::app_role FROM auth.users
WHERE email IN ('jesuslenilson36@gmail.com', 'kaiohhenrique21@gmail.com')
ON CONFLICT DO NOTHING;
