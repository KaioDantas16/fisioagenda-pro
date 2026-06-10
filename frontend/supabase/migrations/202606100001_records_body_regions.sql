-- Migration: 202606100001_records_body_regions
-- Adiciona a coluna body_regions para salvar as regiões anatômicas marcadas no prontuário SOAP

ALTER TABLE public.records
  ADD COLUMN IF NOT EXISTS body_regions TEXT[] DEFAULT '{}';
