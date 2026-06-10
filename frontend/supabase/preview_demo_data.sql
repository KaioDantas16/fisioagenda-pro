-- ==============================================================================
-- FisioAgenda Pro - Preview Demo Data Script
-- ==============================================================================
-- Este script APENAS CONTA e LISTA os dados de teste na base, sem deletar nada.
-- Use isso antes de rodar o clear_demo_data.sql para ter certeza do que será apagado.

-- 1. Contagem de Pacientes de Teste (Exemplo: pacientes que começam com "Teste")
SELECT count(*) AS test_patients_count FROM public.patients WHERE name ILIKE '%teste%';

-- 2. Contagem de Prontuários de Teste (vinculados aos pacientes de teste)
SELECT count(*) AS test_records_count 
FROM public.clinical_records 
WHERE patient_id IN (SELECT id FROM public.patients WHERE name ILIKE '%teste%');

-- 3. Contagem de Agendamentos de Teste (que também contêm dados financeiros/pagamentos)
SELECT count(*) AS test_appointments_count 
FROM public.appointments 
WHERE patient_id IN (SELECT id FROM public.patients WHERE name ILIKE '%teste%');

-- 4. Listar os nomes dos pacientes de teste encontrados:
SELECT id, name, created_at FROM public.patients WHERE name ILIKE '%teste%';
