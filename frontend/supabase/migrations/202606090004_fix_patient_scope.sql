-- Migration: 202606090004_fix_patient_scope
-- Corrige a inconsistência de escopo de pacientes e outros registros clínicos.
-- Todos os dados clínicos da clínica única devem pertencer ao terapeuta Lenilson.

-- 1) Atualiza a função set_therapist_id para herdar o therapist_id do paciente se disponível, evitando registros órfãos por suporte técnico
CREATE OR REPLACE FUNCTION public.set_therapist_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_therapist uuid;
BEGIN
  -- Se o therapist_id for explicitamente informado, mantém
  IF NEW.therapist_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Se a tabela tiver patient_id, tenta herdar o therapist_id do paciente associado
  IF TG_TABLE_NAME != 'patients' AND TG_TABLE_NAME != 'clinic_settings' THEN
    BEGIN
      -- Tenta buscar o therapist_id na tabela patients
      SELECT therapist_id INTO v_patient_therapist
      FROM public.patients
      WHERE id = NEW.patient_id;
      
      IF v_patient_therapist IS NOT NULL THEN
        NEW.therapist_id := v_patient_therapist;
        RETURN NEW;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Se a tabela não possuir patient_id ou der erro de coluna, ignora
    END;
  END IF;

  -- Fallback para auth.uid()
  NEW.therapist_id := auth.uid();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  v_therapist_id uuid;
BEGIN
  -- Buscar o ID do Lenilson diretamente pelo seu e-mail de acesso
  SELECT id INTO v_therapist_id
  FROM auth.users
  WHERE email = 'jesuslenilson36@gmail.com';

  -- Se encontrar o profissional Lenilson, prossegue com o alinhamento de escopo
  IF v_therapist_id IS NOT NULL THEN
    -- 1) Atualiza clinic_settings
    UPDATE public.clinic_settings
    SET therapist_id = v_therapist_id
    WHERE therapist_id IS NULL OR therapist_id != v_therapist_id;

    -- 2) Atualiza patients (corrige Lucas Oliveira Santos (Teste) e outros)
    UPDATE public.patients
    SET therapist_id = v_therapist_id
    WHERE therapist_id IS NULL OR therapist_id != v_therapist_id;

    -- 3) Atualiza appointments
    UPDATE public.appointments
    SET therapist_id = v_therapist_id
    WHERE therapist_id IS NULL OR therapist_id != v_therapist_id;

    -- 4) Atualiza sessions
    UPDATE public.sessions
    SET therapist_id = v_therapist_id
    WHERE therapist_id IS NULL OR therapist_id != v_therapist_id;

    -- 5) Atualiza records
    UPDATE public.records
    SET therapist_id = v_therapist_id
    WHERE therapist_id IS NULL OR therapist_id != v_therapist_id;

    -- 6) Atualiza vital_signs
    UPDATE public.vital_signs
    SET therapist_id = v_therapist_id
    WHERE therapist_id IS NULL OR therapist_id != v_therapist_id;

    -- 7) Atualiza goals
    UPDATE public.goals
    SET therapist_id = v_therapist_id
    WHERE therapist_id IS NULL OR therapist_id != v_therapist_id;

    -- 8) Atualiza anamnese
    UPDATE public.anamnese
    SET therapist_id = v_therapist_id
    WHERE therapist_id IS NULL OR therapist_id != v_therapist_id;

    -- 9) Atualiza functional_assessment
    UPDATE public.functional_assessment
    SET therapist_id = v_therapist_id
    WHERE therapist_id IS NULL OR therapist_id != v_therapist_id;

    -- 10) Atualiza pain_map_entries
    UPDATE public.pain_map_entries
    SET therapist_id = v_therapist_id
    WHERE therapist_id IS NULL OR therapist_id != v_therapist_id;

    -- 11) Atualiza rom_measurements
    UPDATE public.rom_measurements
    SET therapist_id = v_therapist_id
    WHERE therapist_id IS NULL OR therapist_id != v_therapist_id;

    -- 12) Atualiza special_tests
    UPDATE public.special_tests
    SET therapist_id = v_therapist_id
    WHERE therapist_id IS NULL OR therapist_id != v_therapist_id;

    -- 13) Atualiza session_packages
    UPDATE public.session_packages
    SET therapist_id = v_therapist_id
    WHERE therapist_id IS NULL OR therapist_id != v_therapist_id;

    RAISE NOTICE 'Escopo de dados clínicos unificado sob o therapist_id do Lenilson.';
  ELSE
    RAISE WARNING 'Profissional Lenilson (jesuslenilson36@gmail.com) nao encontrado no banco de dados. Correcao de escopo ignorada.';
  END IF;
END $$;
