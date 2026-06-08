
-- Restringir execução das funções SECURITY DEFINER (apenas authenticated)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.current_patient_id() FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.set_therapist_id() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM public, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_patient_id() TO authenticated;

-- Restringir a política de INSERT de notifications (era WITH CHECK true)
DROP POLICY IF EXISTS "Authenticated insert notifications" ON public.notifications;
CREATE POLICY "Users insert own notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_super_admin(auth.uid()));

-- Função de exclusão em cascata segura de um paciente
CREATE OR REPLACE FUNCTION public.delete_patient_cascade(_patient_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT therapist_id INTO v_owner FROM public.patients WHERE id = _patient_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Paciente não encontrado';
  END IF;
  IF v_owner <> auth.uid() AND NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Sem permissão para excluir este paciente';
  END IF;
  DELETE FROM public.attachments WHERE patient_id = _patient_id;
  DELETE FROM public.perimetry WHERE patient_id = _patient_id;
  DELETE FROM public.special_tests WHERE patient_id = _patient_id;
  DELETE FROM public.rom_measurements WHERE patient_id = _patient_id;
  DELETE FROM public.pain_map_entries WHERE patient_id = _patient_id;
  DELETE FROM public.functional_assessment WHERE patient_id = _patient_id;
  DELETE FROM public.anamnese WHERE patient_id = _patient_id;
  DELETE FROM public.vital_signs WHERE patient_id = _patient_id;
  DELETE FROM public.goals WHERE patient_id = _patient_id;
  DELETE FROM public.records WHERE patient_id = _patient_id;
  DELETE FROM public.sessions WHERE patient_id = _patient_id;
  DELETE FROM public.appointments WHERE patient_id = _patient_id;
  DELETE FROM public.patients WHERE id = _patient_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_patient_cascade(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.delete_patient_cascade(uuid) TO authenticated;
