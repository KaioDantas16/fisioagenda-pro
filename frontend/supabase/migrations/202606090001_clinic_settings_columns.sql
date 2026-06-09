-- Migration: 202606090001_clinic_settings_columns
-- Garante que todas as colunas de clinic_settings usadas pelo frontend existam no schema.

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

NOTIFY pgrst, 'reload schema';
