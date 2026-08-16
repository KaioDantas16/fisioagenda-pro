CREATE TABLE IF NOT EXISTS public.appointment_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  therapist_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id uuid NULL REFERENCES public.appointments(id) ON DELETE SET NULL,
  patient_id uuid NULL REFERENCES public.patients(id) ON DELETE CASCADE,

  recipient_type text NOT NULL
    CHECK (recipient_type IN ('patient', 'professional')),

  channel text NOT NULL DEFAULT 'whatsapp'
    CHECK (channel IN ('whatsapp', 'email', 'in_app')),

  reminder_offset_minutes integer NOT NULL
    CHECK (reminder_offset_minutes IN (1440, 10)),

  scheduled_for timestamptz NOT NULL,

  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'ready', 'sent', 'failed', 'cancelled', 'skipped')),

  idempotency_key text NOT NULL,

  message_preview text NULL
    CHECK (message_preview IS NULL OR char_length(message_preview) <= 1000),

  last_error text NULL
    CHECK (last_error IS NULL OR char_length(last_error) <= 1000),

  sent_at timestamptz NULL,

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  CONSTRAINT appointment_reminders_has_target_chk
    CHECK (appointment_id IS NOT NULL OR patient_id IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS appointment_reminders_idempotency_key_idx
ON public.appointment_reminders(idempotency_key);

CREATE INDEX IF NOT EXISTS appointment_reminders_therapist_scheduled_idx
ON public.appointment_reminders(therapist_id, scheduled_for DESC);

CREATE INDEX IF NOT EXISTS appointment_reminders_patient_idx
ON public.appointment_reminders(patient_id);

ALTER TABLE public.appointment_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Therapists read own reminders or super admin"
ON public.appointment_reminders;

CREATE POLICY "Therapists read own reminders or super admin"
ON public.appointment_reminders
FOR SELECT
TO authenticated
USING (
  therapist_id = auth.uid()
  OR is_super_admin(auth.uid())
);

DROP POLICY IF EXISTS "Therapists create own reminders or super admin"
ON public.appointment_reminders;

DROP POLICY IF EXISTS "Therapists update own reminders or super admin"
ON public.appointment_reminders;

-- Onda 2A: tabela ainda nao e usada pelo frontend.
-- Deny-by-default para escrita autenticada. INSERT/UPDATE ficam para worker
-- privilegiado em onda futura, nao para qualquer conta authenticated.

CREATE OR REPLACE FUNCTION public.tg_appointment_reminders_integrity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  appt_therapist uuid;
  appt_patient uuid;
  patient_therapist uuid;
BEGIN
  IF NEW.appointment_id IS NULL AND NEW.patient_id IS NULL THEN
    RAISE EXCEPTION 'Lembrete exige agendamento ou paciente';
  END IF;

  IF NEW.appointment_id IS NOT NULL THEN
    SELECT therapist_id, patient_id
      INTO appt_therapist, appt_patient
    FROM public.appointments
    WHERE id = NEW.appointment_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Agendamento inexistente para o lembrete';
    END IF;

    IF appt_therapist IS DISTINCT FROM NEW.therapist_id THEN
      RAISE EXCEPTION 'Lembrete deve pertencer ao mesmo terapeuta do agendamento';
    END IF;

    IF NEW.patient_id IS NULL THEN
      NEW.patient_id := appt_patient;
    ELSIF NEW.patient_id IS DISTINCT FROM appt_patient THEN
      RAISE EXCEPTION 'Paciente do lembrete nao corresponde ao agendamento';
    END IF;
  ELSIF NEW.patient_id IS NOT NULL THEN
    SELECT therapist_id INTO patient_therapist
    FROM public.patients
    WHERE id = NEW.patient_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Paciente inexistente para o lembrete';
    END IF;

    IF patient_therapist IS DISTINCT FROM NEW.therapist_id THEN
      RAISE EXCEPTION 'Lembrete deve pertencer ao mesmo terapeuta do paciente';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_appointment_reminders_integrity
ON public.appointment_reminders;

CREATE TRIGGER trg_appointment_reminders_integrity
BEFORE INSERT OR UPDATE ON public.appointment_reminders
FOR EACH ROW
EXECUTE FUNCTION public.tg_appointment_reminders_integrity();

DROP TRIGGER IF EXISTS trg_appointment_reminders_updated_at
ON public.appointment_reminders;

CREATE TRIGGER trg_appointment_reminders_updated_at
BEFORE UPDATE ON public.appointment_reminders
FOR EACH ROW
EXECUTE FUNCTION public.tg_set_updated_at();

REVOKE ALL ON public.appointment_reminders FROM PUBLIC;
REVOKE ALL ON public.appointment_reminders FROM anon;
REVOKE ALL ON public.appointment_reminders FROM authenticated;
GRANT SELECT ON public.appointment_reminders TO authenticated;

REVOKE ALL ON FUNCTION public.tg_appointment_reminders_integrity() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.tg_appointment_reminders_integrity() FROM anon;
REVOKE ALL ON FUNCTION public.tg_appointment_reminders_integrity() FROM authenticated;
