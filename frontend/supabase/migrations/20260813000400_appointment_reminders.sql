CREATE TABLE IF NOT EXISTS public.appointment_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  therapist_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id uuid NULL,
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

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
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

CREATE POLICY "Therapists create own reminders or super admin"
ON public.appointment_reminders
FOR INSERT
TO authenticated
WITH CHECK (
  therapist_id = auth.uid()
  OR is_super_admin(auth.uid())
);

DROP POLICY IF EXISTS "Therapists update own reminders or super admin"
ON public.appointment_reminders;

CREATE POLICY "Therapists update own reminders or super admin"
ON public.appointment_reminders
FOR UPDATE
TO authenticated
USING (
  therapist_id = auth.uid()
  OR is_super_admin(auth.uid())
)
WITH CHECK (
  therapist_id = auth.uid()
  OR is_super_admin(auth.uid())
);

DROP TRIGGER IF EXISTS trg_appointment_reminders_updated_at
ON public.appointment_reminders;

CREATE TRIGGER trg_appointment_reminders_updated_at
BEFORE UPDATE ON public.appointment_reminders
FOR EACH ROW
EXECUTE FUNCTION public.tg_set_updated_at();

REVOKE ALL ON public.appointment_reminders FROM PUBLIC;
REVOKE ALL ON public.appointment_reminders FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.appointment_reminders TO authenticated;
