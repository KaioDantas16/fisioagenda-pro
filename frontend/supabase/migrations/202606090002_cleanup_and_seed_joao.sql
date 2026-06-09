-- Seed and Cleanup: 202606090002_cleanup_and_seed_joao
-- Executa a limpeza de dados de teste ofensivos e insere o paciente João Marcelo Ferreira (Teste) com dados realistas.

-- 1) Limpeza de dados de teste ofensivos/brincadeiras
UPDATE public.patients
SET full_name = 'Lucas Oliveira Santos (Teste)'
WHERE full_name = 'Teste de Gay';

UPDATE public.patients
SET full_name = 'Ana Clara Gouveia (Teste)'
WHERE full_name = 'Ana Clara linda';

-- 2) Criação do paciente fictício profissional João Marcelo Ferreira (Teste)
DO $$
DECLARE
  v_therapist_id uuid;
  v_patient_id uuid;
  v_session_1 uuid;
  v_session_2 uuid;
  v_session_3 uuid;
BEGIN
  -- Obter o ID do primeiro profissional disponível
  SELECT user_id INTO v_therapist_id
  FROM public.user_roles
  WHERE role IN ('super_admin', 'admin', 'fisio')
  ORDER BY role = 'super_admin' DESC
  LIMIT 1;

  IF v_therapist_id IS NULL THEN
    SELECT id INTO v_therapist_id FROM public.profiles LIMIT 1;
  END IF;

  IF v_therapist_id IS NOT NULL THEN
    SELECT id INTO v_patient_id FROM public.patients WHERE full_name = 'João Marcelo Ferreira (Teste)';
    
    IF v_patient_id IS NULL THEN
      v_patient_id := gen_random_uuid();
      
      -- Inserir paciente
      INSERT INTO public.patients (
        id, therapist_id, full_name, phone, birth_date, classification, 
        active, notes, profissao, insurance_plan, sessions_authorized,
        address, created_by
      ) VALUES (
        v_patient_id, v_therapist_id, 'João Marcelo Ferreira (Teste)', '(64) 99999-0000', '1987-03-14', 'atencao',
        true, 'Paciente fictício para testes do sistema. Encaminhado com diagnóstico de lombalgia mecânica.', 'Engenheiro Civil', 'Particular', 10,
        'Rua das Palmeiras, 150 - Setor Sul, Caldas Novas - GO', v_therapist_id
      );

      -- Inserir Anamnese
      INSERT INTO public.anamnese (
        id, patient_id, therapist_id, chief_complaint, history_present, history_past,
        medications, habits, physical_activity, sleep,
        surgeries, family_history, allergies, notes, occupation, created_by
      ) VALUES (
        gen_random_uuid(), v_patient_id, v_therapist_id,
        'Dor lombar crônica com irradiação leve para membro inferior direito.',
        'Paciente relata dor lombar de intensidade 6/10 há cerca de 6 meses, que piora ao permanecer sentado por mais de 2 horas e melhora ao deitar. Irradiação ocasional até o terço médio da coxa direita.',
        'Nega traumas anteriores na coluna.',
        'Uso eventual de anti-inflamatórios (ibuprofeno).',
        'Ingestão moderada de café, nega tabagismo.',
        'Sedentário.',
        'Sono não reparador devido à dificuldade de encontrar posição confortável.',
        'Nenhuma cirurgia prévia.',
        'Pai com histórico de hérnia de disco lombar.',
        'Nenhuma alergia conhecida.',
        'Dor à palpação da musculatura paravertebral lombar bilateral, espasmo protetor em quadrado lombar, amplitude de flexão lombar limitada por dor.',
        'Engenheiro Civil',
        v_therapist_id
      );

      -- Inserir Sinais Vitais
      INSERT INTO public.vital_signs (
        id, patient_id, therapist_id, measured_at, systolic, diastolic, heart_rate, respiratory_rate, temperature, spo2, weight, height, created_by
      ) VALUES (
        gen_random_uuid(), v_patient_id, v_therapist_id, now() - interval '2 days', 120, 80, 72, 16, 36.5, 98, 82.5, 1.78, v_therapist_id
      );

      -- Inserir Mapa de Dor
      INSERT INTO public.pain_map_entries (
        id, patient_id, therapist_id, entry_date, region, side, intensity, quality, factors_better, factors_worse, timing, notes, created_by
      ) VALUES (
        gen_random_uuid(), v_patient_id, v_therapist_id, current_date, 'lumbar', 'right', 6, 'queimação/peso', 'repouso deitado', 'permanecer sentado', 'final do dia', 'Irradiação leve para glúteo e coxa posterior.', v_therapist_id
      );

      -- Inserir ADM
      INSERT INTO public.rom_measurements (
        id, patient_id, therapist_id, measured_at, joint, movement, active_degrees, passive_degrees, side, notes, created_by
      ) VALUES (
        gen_random_uuid(), v_patient_id, v_therapist_id, current_date, 'Coluna Lombar', 'Flexão', 60, 65, 'bilateral', 'Dor no final da amplitude.', v_therapist_id
      );

      -- Inserir Testes Especiais
      INSERT INTO public.special_tests (
        id, patient_id, therapist_id, performed_at, test_name, result, side, notes, created_by
      ) VALUES (
        gen_random_uuid(), v_patient_id, v_therapist_id, current_date, 'Lasègue', 'negativo', 'right', 'Lasègue negativo bilateralmente, sem sinais de radiculopatia franca.', v_therapist_id
      );

      -- Inserir Metas
      INSERT INTO public.goals (
        id, patient_id, therapist_id, title, description, target_date, status, progress, created_by
      ) VALUES (
        gen_random_uuid(), v_patient_id, v_therapist_id, 'Redução da Dor Lombar', 'Reduzir dor na escala visual analógica (EVA) de 6 para 2 em 4 semanas.', current_date + interval '30 days', 'em_andamento', 30, v_therapist_id
      );

      -- Inserir Pacote
      INSERT INTO public.session_packages (
        id, therapist_id, patient_id, package_name, total_sessions, used_sessions, price_total, discount_pct, payment_method, payment_status, notes
      ) VALUES (
        gen_random_uuid(), v_therapist_id, v_patient_id, 'Pacote Fisioterapia 10 Sessões', 10, 2, 1080.00, 10.00, 'Pix', 'pago', 'Pacote promocional com 10% de desconto.'
      );

      -- Inserir Sessões
      v_session_1 := gen_random_uuid();
      INSERT INTO public.sessions (
        id, patient_id, therapist_id, starts_at, duration_minutes, procedure, status, attended, price, payment_method, notes, created_by
      ) VALUES (
        v_session_1, v_patient_id, v_therapist_id, now() - interval '5 days', 60, 'Fisioterapia Analítica', 'realizado', true, 120.00, 'Pix', 'Primeira sessão realizada. Foco em controle de dor e analgesia.', v_therapist_id
      );

      -- Prontuário SOAP 1
      INSERT INTO public.records (
        id, patient_id, session_id, record_date, subjective, objective, assessment, plan, pain_scale, created_by, therapist_id
      ) VALUES (
        gen_random_uuid(), v_patient_id, v_session_1, (now() - interval '5 days')::date,
        'Queixa de dor lombar difusa.',
        'Espasmo protetor paravertebral, limitação de flexão lombar.',
        'Lombalgia crônica agudizada.',
        'Eletroterapia TENS + Liberação miofascial + Cinesioterapia leve.',
        6, v_therapist_id, v_therapist_id
      );

      v_session_2 := gen_random_uuid();
      INSERT INTO public.sessions (
        id, patient_id, therapist_id, starts_at, duration_minutes, procedure, status, attended, price, payment_method, notes, created_by
      ) VALUES (
        v_session_2, v_patient_id, v_therapist_id, now() - interval '2 days', 60, 'Cinesioterapia', 'realizado', true, 120.00, 'Pix', 'Segunda sessão. Introdução a exercícios de mobilidade e estabilização segmentar.', v_therapist_id
      );

      -- Prontuário SOAP 2
      INSERT INTO public.records (
        id, patient_id, session_id, record_date, subjective, objective, assessment, plan, pain_scale, created_by, therapist_id
      ) VALUES (
        gen_random_uuid(), v_patient_id, v_session_2, (now() - interval '2 days')::date,
        'Relata melhora após primeira sessão (EVA 4/10).',
        'Melhora na flexibilidade lombar, redução de espasmo.',
        'Boa resposta à conduta de analgesia e mobilidade.',
        'Cinesioterapia (mobilidade de quadril/coluna) + Fortalecimento leve do core.',
        4, v_therapist_id, v_therapist_id
      );

      -- Sessão agendada
      v_session_3 := gen_random_uuid();
      INSERT INTO public.sessions (
        id, patient_id, therapist_id, starts_at, duration_minutes, procedure, status, price, payment_method, notes, created_by
      ) VALUES (
        v_session_3, v_patient_id, v_therapist_id, now() + interval '2 days', 60, 'Fortalecimento de Core', 'agendado', 120.00, 'Pix', 'Terceira sessão agendada.', v_therapist_id
      );

      -- Avaliação Funcional
      INSERT INTO public.functional_assessment (
        id, patient_id, therapist_id, assessment_date, posture, gait, balance, strength, coordination, adl, functional_scale, notes, created_by
      ) VALUES (
        gen_random_uuid(), v_patient_id, v_therapist_id, (now() - interval '5 days')::date,
        'Hiperlordose lombar compensatória, rotação anterior de quadril.',
        'Marcha sem claudicação, porém com passadas encurtadas.',
        'Equilíbrio estático preservado, unipodal estável.',
        'Grau 4 para flexores de quadril e extensores de joelho bilateralmente.',
        'Index-nariz e calcanhar-joelho normais.',
        'Dificuldade para calçar sapatos e permanecer sentado por muito tempo.',
        'Oswestry: 24% (incapacidade moderada)',
        'Avaliação inicial para traçar plano de tratamento.',
        v_therapist_id
      );

    END IF;
  END IF;
END $$;
