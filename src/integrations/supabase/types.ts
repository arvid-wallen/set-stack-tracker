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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      cardio_logs: {
        Row: {
          calories: number | null
          cardio_type: Database["public"]["Enums"]["cardio_type"]
          created_at: string
          distance_km: number | null
          duration_seconds: number | null
          id: string
          notes: string | null
          workout_exercise_id: string
        }
        Insert: {
          calories?: number | null
          cardio_type?: Database["public"]["Enums"]["cardio_type"]
          created_at?: string
          distance_km?: number | null
          duration_seconds?: number | null
          id?: string
          notes?: string | null
          workout_exercise_id: string
        }
        Update: {
          calories?: number | null
          cardio_type?: Database["public"]["Enums"]["cardio_type"]
          created_at?: string
          distance_km?: number | null
          duration_seconds?: number | null
          id?: string
          notes?: string | null
          workout_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cardio_logs_workout_exercise_id_fkey"
            columns: ["workout_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_goals: {
        Row: {
          achieved: boolean
          achieved_at: string | null
          created_at: string
          exercise_id: string
          id: string
          notes: string | null
          target_date: string | null
          target_reps: number | null
          target_weight_kg: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          achieved?: boolean
          achieved_at?: string | null
          created_at?: string
          exercise_id: string
          id?: string
          notes?: string | null
          target_date?: string | null
          target_reps?: number | null
          target_weight_kg?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          achieved?: boolean
          achieved_at?: string | null
          created_at?: string
          exercise_id?: string
          id?: string
          notes?: string | null
          target_date?: string | null
          target_reps?: number | null
          target_weight_kg?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_goals_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_sets: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          is_bodyweight: boolean
          is_warmup: boolean
          notes: string | null
          reps: number | null
          rir: number | null
          rpe: number | null
          set_number: number
          weight_kg: number | null
          workout_exercise_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          is_bodyweight?: boolean
          is_warmup?: boolean
          notes?: string | null
          reps?: number | null
          rir?: number | null
          rpe?: number | null
          set_number: number
          weight_kg?: number | null
          workout_exercise_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          is_bodyweight?: boolean
          is_warmup?: boolean
          notes?: string | null
          reps?: number | null
          rir?: number | null
          rpe?: number | null
          set_number?: number
          weight_kg?: number | null
          workout_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_sets_workout_exercise_id_fkey"
            columns: ["workout_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          description: string | null
          equipment_type: Database["public"]["Enums"]["equipment_type"]
          id: string
          is_cardio: boolean
          is_custom: boolean
          muscle_groups: Database["public"]["Enums"]["muscle_group"][]
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          equipment_type?: Database["public"]["Enums"]["equipment_type"]
          id?: string
          is_cardio?: boolean
          is_custom?: boolean
          muscle_groups?: Database["public"]["Enums"]["muscle_group"][]
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          equipment_type?: Database["public"]["Enums"]["equipment_type"]
          id?: string
          is_cardio?: boolean
          is_custom?: boolean
          muscle_groups?: Database["public"]["Enums"]["muscle_group"][]
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_name: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      routine_exercises: {
        Row: {
          created_at: string
          default_reps: number | null
          default_sets: number | null
          default_weight_kg: number | null
          exercise_id: string
          id: string
          notes: string | null
          order_index: number
          routine_id: string
          superset_group: number | null
        }
        Insert: {
          created_at?: string
          default_reps?: number | null
          default_sets?: number | null
          default_weight_kg?: number | null
          exercise_id: string
          id?: string
          notes?: string | null
          order_index?: number
          routine_id: string
          superset_group?: number | null
        }
        Update: {
          created_at?: string
          default_reps?: number | null
          default_sets?: number | null
          default_weight_kg?: number | null
          exercise_id?: string
          id?: string
          notes?: string | null
          order_index?: number
          routine_id?: string
          superset_group?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_exercises_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      routines: {
        Row: {
          created_at: string
          description: string | null
          folder: string | null
          id: string
          is_favorite: boolean
          last_used_at: string | null
          name: string
          updated_at: string
          user_id: string
          workout_type: Database["public"]["Enums"]["workout_type"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          folder?: string | null
          id?: string
          is_favorite?: boolean
          last_used_at?: string | null
          name: string
          updated_at?: string
          user_id: string
          workout_type?: Database["public"]["Enums"]["workout_type"]
        }
        Update: {
          created_at?: string
          description?: string | null
          folder?: string | null
          id?: string
          is_favorite?: boolean
          last_used_at?: string | null
          name?: string
          updated_at?: string
          user_id?: string
          workout_type?: Database["public"]["Enums"]["workout_type"]
        }
        Relationships: []
      }
      workout_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          is_completed: boolean
          notes: string | null
          order_index: number
          superset_group: number | null
          workout_session_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          is_completed?: boolean
          notes?: string | null
          order_index?: number
          superset_group?: number | null
          workout_session_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          is_completed?: boolean
          notes?: string | null
          order_index?: number
          superset_group?: number | null
          workout_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_session_id_fkey"
            columns: ["workout_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          created_at: string
          custom_type_name: string | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          is_active: boolean
          notes: string | null
          rating: number | null
          started_at: string
          updated_at: string
          user_id: string
          workout_type: Database["public"]["Enums"]["workout_type"]
        }
        Insert: {
          created_at?: string
          custom_type_name?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          rating?: number | null
          started_at?: string
          updated_at?: string
          user_id: string
          workout_type?: Database["public"]["Enums"]["workout_type"]
        }
        Update: {
          created_at?: string
          custom_type_name?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          rating?: number | null
          started_at?: string
          updated_at?: string
          user_id?: string
          workout_type?: Database["public"]["Enums"]["workout_type"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      cardio_type:
        | "running"
        | "cycling"
        | "rowing"
        | "swimming"
        | "elliptical"
        | "walking"
        | "stair_climber"
        | "jump_rope"
        | "other"
      equipment_type:
        | "barbell"
        | "dumbbell"
        | "machine"
        | "cable"
        | "bodyweight"
        | "kettlebell"
        | "bands"
        | "cardio_machine"
        | "other"
      muscle_group:
        | "chest"
        | "back"
        | "shoulders"
        | "biceps"
        | "triceps"
        | "forearms"
        | "quads"
        | "hamstrings"
        | "glutes"
        | "calves"
        | "core"
        | "full_body"
      workout_type:
        | "push"
        | "pull"
        | "legs"
        | "full_body"
        | "cardio"
        | "upper"
        | "lower"
        | "custom"
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
      cardio_type: [
        "running",
        "cycling",
        "rowing",
        "swimming",
        "elliptical",
        "walking",
        "stair_climber",
        "jump_rope",
        "other",
      ],
      equipment_type: [
        "barbell",
        "dumbbell",
        "machine",
        "cable",
        "bodyweight",
        "kettlebell",
        "bands",
        "cardio_machine",
        "other",
      ],
      muscle_group: [
        "chest",
        "back",
        "shoulders",
        "biceps",
        "triceps",
        "forearms",
        "quads",
        "hamstrings",
        "glutes",
        "calves",
        "core",
        "full_body",
      ],
      workout_type: [
        "push",
        "pull",
        "legs",
        "full_body",
        "cardio",
        "upper",
        "lower",
        "custom",
      ],
    },
  },
} as const
