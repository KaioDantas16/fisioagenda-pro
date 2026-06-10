-- ==============================================================================
-- ⚠️ ATENÇÃO EXTREMA / ALERTA DE PERIGO ⚠️
-- ==============================================================================
-- FisioAgenda Pro - Clear Demo Data Script
-- 
-- ESTE SCRIPT APAGA DADOS DA BASE DE DADOS!
-- NÃO INCLUIR EM MIGRATIONS! NÃO RODAR AUTOMATICAMENTE!
-- NÃO INCLUIR NO APPLY_ALL.sql NEM NO apply-remote.mjs!
--
-- Certifique-se de estar rodando na base correta e de ter backup.
-- Ele não usa TRUNCATE CASCADE bruto. Ele deleta por ID/nome específico de teste.
-- Preserva obrigatoriamente auth.users e profiles (admin/suporte).
-- ==============================================================================

-- INÍCIO DA LIMPEZA (Descomente o bloco abaixo e execute MANUALMENTE quando tiver certeza)

/*
BEGIN;

-- 1. Deletar agendamentos (e seus dados financeiros) dos pacientes de teste
DELETE FROM public.appointments 
WHERE patient_id IN (SELECT id FROM public.patients WHERE name ILIKE '%teste%');

-- 2. Deletar prontuários (clinical_records) dos pacientes de teste
DELETE FROM public.clinical_records 
WHERE patient_id IN (SELECT id FROM public.patients WHERE name ILIKE '%teste%');

-- 3. Deletar sessões antigas (sessions table, se houver) dos pacientes de teste
DELETE FROM public.sessions 
WHERE patient_id IN (SELECT id FROM public.patients WHERE name ILIKE '%teste%');

-- 4. Deletar os próprios pacientes de teste
DELETE FROM public.patients WHERE name ILIKE '%teste%';

COMMIT;
*/
-- ==============================================================================
-- FIM DO SCRIPT DE LIMPEZA
-- ==============================================================================
