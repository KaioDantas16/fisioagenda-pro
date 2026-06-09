-- Migration: 202606080002_clinic_settings_logo_url
-- Adiciona coluna logo_url para armazenar URL do logo da clínica (Supabase Storage).

ALTER TABLE public.clinic_settings
  ADD COLUMN IF NOT EXISTS logo_url TEXT;
