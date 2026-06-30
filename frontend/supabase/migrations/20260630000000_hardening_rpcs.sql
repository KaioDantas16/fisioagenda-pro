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
        'main_complaint', main_complaint,
        'current_illness_history', current_illness_history,
        'past_medical_history', past_medical_history,
        'family_history', family_history,
        'medications', medications,
        'habits', habits,
        'vital_signs', vital_signs
      ) FROM public.anamnese WHERE patient_id = _patient_id LIMIT 1
    ),
    'functional', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', id,
          'date', date,
          'daily_activities', daily_activities,
          'work_activities', work_activities,
          'sports_activities', sports_activities,
          'limitations', limitations,
          'assistive_devices', assistive_devices
        )
      ) FROM public.functional_assessment WHERE patient_id = _patient_id
    ), '[]'::json),
    'pain_map', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', id,
          'created_at', created_at,
          'point_x', point_x,
          'point_y', point_y,
          'intensity', intensity,
          'body_part', body_part,
          'description', description
        )
      ) FROM public.pain_map_entries WHERE patient_id = _patient_id
    ), '[]'::json),
    'rom', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', id,
          'date', date,
          'joint', joint,
          'movement', movement,
          'active_degree', active_degree,
          'passive_degree', passive_degree,
          'pain_level', pain_level,
          'observations', observations
        )
      ) FROM public.rom_measurements WHERE patient_id = _patient_id
    ), '[]'::json),
    'tests', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', id,
          'date', date,
          'test_name', test_name,
          'result', result,
          'details', details,
          'positive', positive
        )
      ) FROM public.special_tests WHERE patient_id = _patient_id
    ), '[]'::json),
    'perimetry', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', id,
          'date', date,
          'segment', segment,
          'reference_point', reference_point,
          'right_measure', right_measure,
          'left_measure', left_measure,
          'difference', difference
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
