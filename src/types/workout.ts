export type WorkoutType = 'push' | 'pull' | 'legs' | 'full_body' | 'cardio' | 'upper' | 'lower' | 'custom';
export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'forearms' | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'core' | 'full_body';
export type EquipmentType = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'kettlebell' | 'bands' | 'cardio_machine' | 'other';
export type CardioType = 'running' | 'cycling' | 'rowing' | 'swimming' | 'elliptical' | 'walking' | 'stair_climber' | 'jump_rope' | 'other';

export interface Exercise {
  id: string;
  name: string;
  description: string | null;
  muscle_groups: MuscleGroup[];
  equipment_type: EquipmentType;
  is_custom: boolean;
  is_cardio: boolean;
  user_id: string | null;
}

export interface ExerciseSet {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
  is_warmup: boolean;
  is_bodyweight: boolean;
  rpe: number | null;
  rir: number | null;
  notes: string | null;
  completed_at: string;
}

export interface WorkoutExercise {
  id: string;
  workout_session_id: string;
  exercise_id: string;
  order_index: number;
  superset_group: number | null;
  is_completed: boolean;
  notes: string | null;
  exercise?: Exercise;
  sets?: ExerciseSet[];
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  workout_type: WorkoutType;
  custom_type_name: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  rating: number | null;
  notes: string | null;
  is_active: boolean;
  exercises?: WorkoutExercise[];
}

export interface CardioLog {
  id: string;
  workout_exercise_id: string;
  cardio_type: CardioType;
  duration_seconds: number | null;
  distance_km: number | null;
  calories: number | null;
  notes: string | null;
}

export const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Ben',
  full_body: 'Helkropp',
  cardio: 'Cardio',
  upper: 'Överkropp',
  lower: 'Underkropp',
  custom: 'Anpassat',
};

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Bröst',
  back: 'Rygg',
  shoulders: 'Axlar',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Underarmar',
  quads: 'Quadriceps',
  hamstrings: 'Hamstrings',
  glutes: 'Rumpa',
  calves: 'Vader',
  core: 'Core',
  full_body: 'Helkropp',
};

export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  barbell: 'Skivstång',
  dumbbell: 'Hantel',
  machine: 'Maskin',
  cable: 'Kabel',
  bodyweight: 'Kroppsvikt',
  kettlebell: 'Kettlebell',
  bands: 'Gummiband',
  cardio_machine: 'Cardiomaskin',
  other: 'Övrigt',
};