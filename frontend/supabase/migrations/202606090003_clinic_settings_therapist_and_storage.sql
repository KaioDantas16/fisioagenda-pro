-- Migration: 202606090003_clinic_settings_therapist_and_storage
-- Melhora a persistência e segurança das configurações da clínica e arquivos de branding.

-- 1) Adicionar coluna therapist_id
ALTER TABLE public.clinic_settings
  ADD COLUMN IF NOT EXISTS therapist_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2) Popular therapist_id para o Lenilson caso esteja nulo
DO $$
DECLARE
  v_lenilson_id uuid;
BEGIN
  SELECT id INTO v_lenilson_id FROM auth.users WHERE email = 'jesuslenilson36@gmail.com';
  IF v_lenilson_id IS NOT NULL THEN
    UPDATE public.clinic_settings
    SET therapist_id = v_lenilson_id
    WHERE therapist_id IS NULL;
  END IF;
END $$;

-- 3) Verificar duplicados por therapist_id e abortar se houver
DO $$
DECLARE
  v_dup_count integer;
  v_null_count integer;
BEGIN
  -- Conta duplicados que possuem therapist_id
  SELECT count(*) - count(distinct therapist_id) INTO v_dup_count
  FROM public.clinic_settings
  WHERE therapist_id IS NOT NULL;
  
  -- Conta quantos registros possuem therapist_id nulo
  SELECT count(*) INTO v_null_count
  FROM public.clinic_settings
  WHERE therapist_id IS NULL;

  IF v_dup_count > 0 OR v_null_count > 1 THEN
    RAISE EXCEPTION 'Existem configuracoes duplicadas na tabela clinic_settings. Por favor, resolva manualmente no banco de dados para evitar perda de dados reais. Seeding e restricoes cancelados.';
  END IF;
END $$;

-- 4) Criar UNIQUE constraint em therapist_id de forma segura
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'clinic_settings_therapist_id_key'
  ) THEN
    ALTER TABLE public.clinic_settings
      ADD CONSTRAINT clinic_settings_therapist_id_key UNIQUE (therapist_id);
  END IF;
END $$;

-- 5) Ajustar políticas RLS para clinic_settings
DROP POLICY IF EXISTS "Authenticated read clinic_settings" ON public.clinic_settings;
DROP POLICY IF EXISTS "Super admins update clinic_settings" ON public.clinic_settings;
DROP POLICY IF EXISTS "Super admins insert clinic_settings" ON public.clinic_settings;
DROP POLICY IF EXISTS "Manage clinic_settings" ON public.clinic_settings;

CREATE POLICY "Authenticated read clinic_settings" ON public.clinic_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Manage clinic_settings" ON public.clinic_settings
  FOR ALL TO authenticated
  USING (
    therapist_id = auth.uid() 
    OR public.is_super_admin(auth.uid()) 
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role::text = 'admin'
    )
  )
  WITH CHECK (
    therapist_id = auth.uid() 
    OR public.is_super_admin(auth.uid()) 
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role::text = 'admin'
    )
  );

-- 6) Criar o bucket clinic-assets se ele ainda não existir, de forma privada (signed URLs no frontend)
INSERT INTO storage.buckets (id, name, public)
VALUES ('clinic-assets', 'clinic-assets', false)
ON CONFLICT (id) DO NOTHING;

-- 7) Ajustar políticas de Storage para o bucket clinic-assets (branding/ pasta)
DROP POLICY IF EXISTS "Authenticated read clinic-assets" ON storage.objects;
DROP POLICY IF EXISTS "Super admin upload clinic-assets" ON storage.objects;
DROP POLICY IF EXISTS "Super admin update clinic-assets" ON storage.objects;
DROP POLICY IF EXISTS "Super admin delete clinic-assets" ON storage.objects;
DROP POLICY IF EXISTS "Manage clinic assets branding" ON storage.objects;

-- Leitura de arquivos de branding por qualquer usuário autenticado
CREATE POLICY "Authenticated read clinic-assets" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'clinic-assets');

-- Controle estrito do próprio therapist_id ou admins/super_admins sobre a pasta branding/{therapist_id}
CREATE POLICY "Manage clinic assets branding" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'clinic-assets'
    AND (storage.foldername(name))[1] = 'branding'
    AND (
      (storage.foldername(name))[2] = auth.uid()::text
      OR public.is_super_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role::text = 'admin'
      )
    )
  )
  WITH CHECK (
    bucket_id = 'clinic-assets'
    AND (storage.foldername(name))[1] = 'branding'
    AND (
      (storage.foldername(name))[2] = auth.uid()::text
      OR public.is_super_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role::text = 'admin'
      )
    )
  );

NOTIFY pgrst, 'reload schema';
