export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      anamnese: {
        Row: {
          allergies: string | null
          chief_complaint: string | null
          created_at: string
          created_by: string | null
          family_history: string | null
          habits: string | null
          history_past: string | null
          history_present: string | null
          id: string
          medications: string | null
          notes: string | null
          occupation: string | null
          patient_id: string
          physical_activity: string | null
          sleep: string | null
          surgeries: string | null
          therapist_id: string | null
          updated_at: string
        }
        Insert: {
          allergies?: string | null
          chief_complaint?: string | null
          created_at?: string
          created_by?: string | null
          family_history?: string | null
          habits?: string | null
          history_past?: string | null
          history_present?: string | null
          id?: string
          medications?: string | null
          notes?: string | null
          occupation?: string | null
          patient_id: string
          physical_activity?: string | null
          sleep?: string | null
          surgeries?: string | null
          therapist_id?: string | null
          updated_at?: string
        }
        Update: {
          allergies?: string | null
          chief_complaint?: string | null
          created_at?: string
          created_by?: string | null
          family_history?: string | null
          habits?: string | null
          history_past?: string | null
          history_present?: string | null
          id?: string
          medications?: string | null
          notes?: string | null
          occupation?: string | null
          patient_id?: string
          physical_activity?: string | null
          sleep?: string | null
          surgeries?: string | null
          therapist_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          created_at: string
          created_by: string | null
          duration_minutes: number
          financial_notes: string | null
          id: string
          notes: string | null
          patient_id: string
          payment_date: string | null
          payment_method: string | null
          payment_status: string | null
          price: number | null
          service: string
          starts_at: string
          status: string
          therapist_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          financial_notes?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          price?: number | null
          service: string
          starts_at: string
          status?: string
          therapist_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          financial_notes?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          price?: number | null
          service?: string
          starts_at?: string
          status?: string
          therapist_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          file_name: string
          id: string
          mime_type: string | null
          patient_id: string
          size_bytes: number | null
          storage_path: string
          therapist_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_name: string
          id?: string
          mime_type?: string | null
          patient_id: string
          size_bytes?: number | null
          storage_path: string
          therapist_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_name?: string
          id?: string
          mime_type?: string | null
          patient_id?: string
          size_bytes?: number | null
          storage_path?: string
          therapist_id?: string | null
        }
        Relationships: []
      }
      clinic_settings: {
        Row: {
          address: string | null
          crefito: string
          id: string
          instagram: string | null
          logo_url: string | null
          name: string
          phone: string | null
          professional_name: string
          professional_photo_url: string | null
          specialties: Json
          theme: string
          therapist_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          crefito?: string
          id?: string
          instagram?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          professional_name?: string
          professional_photo_url?: string | null
          specialties?: Json
          theme?: string
          therapist_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          crefito?: string
          id?: string
          instagram?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          professional_name?: string
          professional_photo_url?: string | null
          specialties?: Json
          theme?: string
          therapist_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      functional_assessment: {
        Row: {
          adl: string | null
          assessment_date: string
          balance: string | null
          coordination: string | null
          created_at: string
          created_by: string | null
          functional_scale: string | null
          gait: string | null
          id: string
          notes: string | null
          patient_id: string
          posture: string | null
          strength: string | null
          therapist_id: string | null
          updated_at: string
        }
        Insert: {
          adl?: string | null
          assessment_date?: string
          balance?: string | null
          coordination?: string | null
          created_at?: string
          created_by?: string | null
          functional_scale?: string | null
          gait?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          posture?: string | null
          strength?: string | null
          therapist_id?: string | null
          updated_at?: string
        }
        Update: {
          adl?: string | null
          assessment_date?: string
          balance?: string | null
          coordination?: string | null
          created_at?: string
          created_by?: string | null
          functional_scale?: string | null
          gait?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          posture?: string | null
          strength?: string | null
          therapist_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          patient_id: string
          progress: number
          status: string
          target_date: string | null
          therapist_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          patient_id: string
          progress?: number
          status?: string
          target_date?: string | null
          therapist_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          patient_id?: string
          progress?: number
          status?: string
          target_date?: string | null
          therapist_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip_address?: string | null
          success: boolean
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      neuro_assessment: {
        Row: {
          assessed_at: string
          category: string
          created_at: string
          id: string
          item: string
          notes: string | null
          patient_id: string
          side: string | null
          therapist_id: string
          updated_at: string
          value: string | null
        }
        Insert: {
          assessed_at?: string
          category: string
          created_at?: string
          id?: string
          item: string
          notes?: string | null
          patient_id: string
          side?: string | null
          therapist_id?: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          assessed_at?: string
          category?: string
          created_at?: string
          id?: string
          item?: string
          notes?: string | null
          patient_id?: string
          side?: string | null
          therapist_id?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "neuro_assessment_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          read: boolean
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pain_map_entries: {
        Row: {
          created_at: string
          created_by: string | null
          entry_date: string
          factors_better: string | null
          factors_worse: string | null
          id: string
          intensity: number
          notes: string | null
          patient_id: string
          quality: string | null
          region: string
          side: string | null
          therapist_id: string | null
          timing: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entry_date?: string
          factors_better?: string | null
          factors_worse?: string | null
          id?: string
          intensity?: number
          notes?: string | null
          patient_id: string
          quality?: string | null
          region: string
          side?: string | null
          therapist_id?: string | null
          timing?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entry_date?: string
          factors_better?: string | null
          factors_worse?: string | null
          id?: string
          intensity?: number
          notes?: string | null
          patient_id?: string
          quality?: string | null
          region?: string
          side?: string | null
          therapist_id?: string | null
          timing?: string | null
        }
        Relationships: []
      }
      patients: {
        Row: {
          active: boolean
          address: string | null
          birth_date: string | null
          cep: string | null
          classification: string
          cpf: string | null
          created_at: string
          created_by: string | null
          discharge_date: string | null
          discharge_notes: string | null
          doctor_name: string | null
          email: string | null
          escolaridade: string | null
          estado_civil: string | null
          full_name: string
          gender: string | null
          id: string
          insurance: string | null
          insurance_plan: string | null
          notes: string | null
          patient_user_id: string | null
          phone: string | null
          profissao: string | null
          rg: string | null
          sessions_authorized: number | null
          therapist_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          birth_date?: string | null
          cep?: string | null
          classification?: string
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          discharge_date?: string | null
          discharge_notes?: string | null
          doctor_name?: string | null
          email?: string | null
          escolaridade?: string | null
          estado_civil?: string | null
          full_name: string
          gender?: string | null
          id?: string
          insurance?: string | null
          insurance_plan?: string | null
          notes?: string | null
          patient_user_id?: string | null
          phone?: string | null
          profissao?: string | null
          rg?: string | null
          sessions_authorized?: number | null
          therapist_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          birth_date?: string | null
          cep?: string | null
          classification?: string
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          discharge_date?: string | null
          discharge_notes?: string | null
          doctor_name?: string | null
          email?: string | null
          escolaridade?: string | null
          estado_civil?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          insurance?: string | null
          insurance_plan?: string | null
          notes?: string | null
          patient_user_id?: string | null
          phone?: string | null
          profissao?: string | null
          rg?: string | null
          sessions_authorized?: number | null
          therapist_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      perimetry: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          measured_at: string
          measurement_cm: number
          notes: string | null
          patient_id: string
          segment: string
          side: string | null
          therapist_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          measured_at?: string
          measurement_cm: number
          notes?: string | null
          patient_id: string
          segment: string
          side?: string | null
          therapist_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          measured_at?: string
          measurement_cm?: number
          notes?: string | null
          patient_id?: string
          segment?: string
          side?: string | null
          therapist_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          must_change_password: boolean
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          must_change_password?: boolean
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          must_change_password?: boolean
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      records: {
        Row: {
          assessment: string | null
          body_regions: string[] | null
          cid10: string | null
          created_at: string
          created_by: string | null
          evolution_score: number | null
          id: string
          objective: string | null
          pain_location_text: string | null
          pain_scale: number | null
          patient_id: string
          plan: string | null
          record_date: string
          session_id: string | null
          subjective: string | null
          therapist_id: string | null
          updated_at: string
        }
        Insert: {
          assessment?: string | null
          body_regions?: string[] | null
          cid10?: string | null
          created_at?: string
          created_by?: string | null
          evolution_score?: number | null
          id?: string
          objective?: string | null
          pain_location_text?: string | null
          pain_scale?: number | null
          patient_id: string
          plan?: string | null
          record_date?: string
          session_id?: string | null
          subjective?: string | null
          therapist_id?: string | null
          updated_at?: string
        }
        Update: {
          assessment?: string | null
          body_regions?: string[] | null
          cid10?: string | null
          created_at?: string
          created_by?: string | null
          evolution_score?: number | null
          id?: string
          objective?: string | null
          pain_location_text?: string | null
          pain_scale?: number | null
          patient_id?: string
          plan?: string | null
          record_date?: string
          session_id?: string | null
          subjective?: string | null
          therapist_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      rom_measurements: {
        Row: {
          active_degrees: number | null
          created_at: string
          created_by: string | null
          id: string
          joint: string
          measured_at: string
          movement: string
          notes: string | null
          passive_degrees: number | null
          patient_id: string
          side: string | null
          therapist_id: string | null
        }
        Insert: {
          active_degrees?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          joint: string
          measured_at?: string
          movement: string
          notes?: string | null
          passive_degrees?: number | null
          patient_id: string
          side?: string | null
          therapist_id?: string | null
        }
        Update: {
          active_degrees?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          joint?: string
          measured_at?: string
          movement?: string
          notes?: string | null
          passive_degrees?: number | null
          patient_id?: string
          side?: string | null
          therapist_id?: string | null
        }
        Relationships: []
      }
      session_parameters: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          params: Json
          patient_id: string
          session_id: string
          technique: string
          therapist_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          params?: Json
          patient_id: string
          session_id: string
          technique: string
          therapist_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          params?: Json
          patient_id?: string
          session_id?: string
          technique?: string
          therapist_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_parameters_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_parameters_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          attended: boolean | null
          created_at: string
          created_by: string | null
          duration_minutes: number
          financial_notes: string | null
          id: string
          notes: string | null
          patient_id: string
          payment_date: string | null
          payment_method: string | null
          payment_status: string | null
          price: number | null
          procedure: string | null
          starts_at: string
          status: string
          therapist_id: string | null
          updated_at: string
        }
        Insert: {
          attended?: boolean | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          financial_notes?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          price?: number | null
          procedure?: string | null
          starts_at: string
          status?: string
          therapist_id?: string | null
          updated_at?: string
        }
        Update: {
          attended?: boolean | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          financial_notes?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          price?: number | null
          procedure?: string | null
          starts_at?: string
          status?: string
          therapist_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      special_tests: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          patient_id: string
          performed_at: string
          region: string | null
          result: string
          test_name: string
          therapist_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          performed_at?: string
          region?: string | null
          result?: string
          test_name: string
          therapist_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          performed_at?: string
          region?: string | null
          result?: string
          test_name?: string
          therapist_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vital_signs: {
        Row: {
          bmi: number | null
          created_at: string
          created_by: string | null
          diastolic: number | null
          heart_rate: number | null
          height: number | null
          id: string
          measured_at: string
          notes: string | null
          patient_id: string
          respiratory_rate: number | null
          spo2: number | null
          systolic: number | null
          temperature: number | null
          therapist_id: string | null
          weight: number | null
        }
        Insert: {
          bmi?: number | null
          created_at?: string
          created_by?: string | null
          diastolic?: number | null
          heart_rate?: number | null
          height?: number | null
          id?: string
          measured_at?: string
          notes?: string | null
          patient_id: string
          respiratory_rate?: number | null
          spo2?: number | null
          systolic?: number | null
          temperature?: number | null
          therapist_id?: string | null
          weight?: number | null
        }
        Update: {
          bmi?: number | null
          created_at?: string
          created_by?: string | null
          diastolic?: number | null
          heart_rate?: number | null
          height?: number | null
          id?: string
          measured_at?: string
          notes?: string | null
          patient_id?: string
          respiratory_rate?: number | null
          spo2?: number | null
          systolic?: number | null
          temperature?: number | null
          therapist_id?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vital_signs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_patient_id: { Args: never; Returns: string }
      delete_patient_cascade: {
        Args: { _patient_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "fisio" | "staff" | "paciente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "admin", "fisio", "staff", "paciente"],
    },
  },
} as const
