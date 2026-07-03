CREATE OR REPLACE FUNCTION public.get_patient_export_data(_patient_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  res json;
BEGIN
  SELECT json_build_object(
    'anamnese', (
      SELECT json_build_object(
        'id', id,
        'patient_id', patient_id,
        'created_at', created_at,
        'updated_at', updated_at,
        'chief_complaint', chief_complaint,
        'history_present', history_present,
        'history_past', history_past,
        'family_history', family_history,
        'medications', medications,
        'habits', habits
      ) FROM public.anamnese WHERE patient_id = _patient_id LIMIT 1
    ),
    'functional', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', id,
          'assessment_date', assessment_date,
          'posture', posture,
          'gait', gait,
          'balance', balance,
          'strength', strength,
          'coordination', coordination,
          'adl', adl,
          'functional_scale', functional_scale,
          'notes', notes
        )
      ) FROM public.functional_assessment WHERE patient_id = _patient_id
    ), '[]'::json),
    'pain_map', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', id,
          'entry_date', entry_date,
          'region', region,
          'side', side,
          'intensity', intensity,
          'quality', quality,
          'factors_better', factors_better,
          'factors_worse', factors_worse,
          'timing', timing,
          'notes', notes
        )
      ) FROM public.pain_map_entries WHERE patient_id = _patient_id
    ), '[]'::json),
    'rom', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', id,
          'measured_at', measured_at,
          'joint', joint,
          'movement', movement,
          'side', side,
          'active_degrees', active_degrees,
          'passive_degrees', passive_degrees,
          'notes', notes
        )
      ) FROM public.rom_measurements WHERE patient_id = _patient_id
    ), '[]'::json),
    'tests', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', id,
          'performed_at', performed_at,
          'test_name', test_name,
          'region', region,
          'result', result,
          'notes', notes
        )
      ) FROM public.special_tests WHERE patient_id = _patient_id
    ), '[]'::json),
    'perimetry', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', id,
          'measured_at', measured_at,
          'segment', segment,
          'side', side,
          'measurement_cm', measurement_cm,
          'notes', notes
        )
      ) FROM public.perimetry WHERE patient_id = _patient_id
    ), '[]'::json)
  ) INTO res;
  RETURN res;
END;
$$;

REVOKE ALL ON FUNCTION public.get_patient_export_data(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_patient_export_data(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_patient_export_data(uuid) TO authenticated;
