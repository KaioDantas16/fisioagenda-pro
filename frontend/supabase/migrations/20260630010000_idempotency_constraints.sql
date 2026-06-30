-- Idempotency Constraints for Logic and Reliability Hardening
-- This migration adds natural unique keys to prevent duplicate creation of sessions and appointments.
-- It ensures that even if frontend double-submit protection fails, the database will reject the duplicate.

-- Sessions: A patient cannot have two sessions starting at the exact same time.
CREATE UNIQUE INDEX idx_sessions_patient_time ON public.sessions (patient_id, starts_at);

-- Appointments: A patient cannot have two appointments starting at the exact same time.
CREATE UNIQUE INDEX idx_appointments_patient_time ON public.appointments (patient_id, starts_at);
