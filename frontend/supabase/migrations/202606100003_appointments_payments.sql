-- Migration: 202606100003_appointments_payments
-- Adiciona colunas financeiras na tabela appointments

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_date DATE,
  ADD COLUMN IF NOT EXISTS financial_notes TEXT;
