export interface MedicalIntakeForm {
  id: string;
  clinic_id?: string;
  title: string;
  description?: string;
  token_hash: string;
  starts_at: string;
  expires_at?: string;
  max_responses?: number;
  response_count: number;
  active: boolean;
}

export interface MedicalIntakeSubmission {
  id: string;
  form_id: string;
  patient_id?: string;
  full_name_normalized: string;
  birth_date: string;
  cpf_hash?: string;
  cpf_last4?: string;
  guardian_name_normalized?: string;
  guardian_cpf_hash?: string;
  guardian_cpf_last4?: string;
  is_minor: boolean;
  has_heart_condition: boolean;
  has_diabetes: boolean;
  has_kidney_condition: boolean;
  has_psychological_condition: boolean;
  has_medication_allergy: boolean;
  has_food_allergy: boolean;
  has_recent_injury: boolean;
  has_recent_fracture: boolean;
  has_recent_surgery: boolean;
  has_recent_hospitalization: boolean;
  has_disability_or_specific_condition: boolean;
  consent_accepted: boolean;
  duplicate_status?: string;
  review_status: string;
  risk_level: string;
  raw_data: Record<string, any>;
}
