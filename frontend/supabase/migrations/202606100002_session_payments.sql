-- Migration: 202606100002_session_payments
-- Adiciona colunas financeiras na tabela sessions

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS payment_date DATE,
  ADD COLUMN IF NOT EXISTS financial_notes TEXT;
