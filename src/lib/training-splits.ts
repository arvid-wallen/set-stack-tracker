import { WorkoutType, MuscleGroup } from '@/types/workout';

export type TrainingSplitId =
  | 'full_body'
  | 'upper_lower_2'
  | 'upper_lower_4'
  | 'push_pull_2'
  | 'ppl_3'
  | 'ppl_6'
  | 'bro_5'
  | 'arnold_6'
  | 'classic_4'
  | 'custom';

export interface SplitDay {
  /** Used when starting a workout */
  type: WorkoutType;
  /** Used for custom-type workouts to disambiguate */
  customName?: string;
  /** Short label shown in UI ("Push", "Bröst & Triceps", etc.) */
  label: string;
  /** Muscle groups primarily targeted (informational) */
  groups: MuscleGroup[];
}

export interface SplitDefinition {
  id: TrainingSplitId;
  label: string;
  shortLabel: string;
  daysPerWeek: number;
  /** True if every weekday is a training day (no built-in rest cadence) */
  noRestDays: boolean;
  days: SplitDay[];
}

export const TRAINING_SPLITS: Record<Exclude<TrainingSplitId, 'custom'>, SplitDefinition> = {
  full_body: {
    id: 'full_body',
    label: 'Helkropp',
    shortLabel: 'Helkropp',
    daysPerWeek: 3,
    noRestDays: false,
    days: [
      { type: 'full_body', label: 'Helkropp', groups: ['chest', 'back', 'quads', 'shoulders', 'core'] },
    ],
  },
  upper_lower_2: {
    id: 'upper_lower_2',
    label: 'Upper / Lower (2-dagars)',
    shortLabel: 'Upper/Lower 2d',
    daysPerWeek: 2,
    noRestDays: false,
    days: [
      { type: 'upper', label: 'Överkropp', groups: ['chest', 'back', 'shoulders', 'biceps', 'triceps'] },
      { type: 'lower', label: 'Underkropp', groups: ['quads', 'hamstrings', 'glutes', 'calves'] },
    ],
  },
  upper_lower_4: {
    id: 'upper_lower_4',
    label: 'Upper / Lower (4-dagars)',
    shortLabel: 'Upper/Lower 4d',
    daysPerWeek: 4,
    noRestDays: false,
    days: [
      { type: 'upper', label: 'Överkropp', groups: ['chest', 'back', 'shoulders', 'biceps', 'triceps'] },
      { type: 'lower', label: 'Underkropp', groups: ['quads', 'hamstrings', 'glutes', 'calves'] },
      { type: 'upper', label: 'Överkropp', groups: ['chest', 'back', 'shoulders', 'biceps', 'triceps'] },
      { type: 'lower', label: 'Underkropp', groups: ['quads', 'hamstrings', 'glutes', 'calves'] },
    ],
  },
  push_pull_2: {
    id: 'push_pull_2',
    label: 'Push / Pull (2-dagars)',
    shortLabel: 'Push/Pull 2d',
    daysPerWeek: 2,
    noRestDays: false,
    days: [
      { type: 'push', label: 'Push', groups: ['chest', 'shoulders', 'triceps'] },
      { type: 'pull', label: 'Pull', groups: ['back', 'biceps'] },
    ],
  },
  ppl_3: {
    id: 'ppl_3',
    label: 'PPL (3-dagars)',
    shortLabel: 'PPL 3d',
    daysPerWeek: 3,
    noRestDays: false,
    days: [
      { type: 'push', label: 'Push', groups: ['chest', 'shoulders', 'triceps'] },
      { type: 'pull', label: 'Pull', groups: ['back', 'biceps'] },
      { type: 'legs', label: 'Ben', groups: ['quads', 'hamstrings', 'glutes', 'calves'] },
    ],
  },
  ppl_6: {
    id: 'ppl_6',
    label: 'PPL (6-dagars)',
    shortLabel: 'PPL 6d',
    daysPerWeek: 6,
    noRestDays: true,
    days: [
      { type: 'push', label: 'Push', groups: ['chest', 'shoulders', 'triceps'] },
      { type: 'pull', label: 'Pull', groups: ['back', 'biceps'] },
      { type: 'legs', label: 'Ben', groups: ['quads', 'hamstrings', 'glutes', 'calves'] },
      { type: 'push', label: 'Push', groups: ['chest', 'shoulders', 'triceps'] },
      { type: 'pull', label: 'Pull', groups: ['back', 'biceps'] },
      { type: 'legs', label: 'Ben', groups: ['quads', 'hamstrings', 'glutes', 'calves'] },
    ],
  },
  bro_5: {
    id: 'bro_5',
    label: 'Bro split (5-dagars)',
    shortLabel: 'Bro split',
    daysPerWeek: 5,
    noRestDays: false,
    days: [
      { type: 'custom', customName: 'Bröst', label: 'Bröst', groups: ['chest', 'triceps'] },
      { type: 'custom', customName: 'Rygg', label: 'Rygg', groups: ['back', 'biceps'] },
      { type: 'legs', label: 'Ben', groups: ['quads', 'hamstrings', 'glutes', 'calves'] },
      { type: 'custom', customName: 'Axlar', label: 'Axlar', groups: ['shoulders'] },
      { type: 'custom', customName: 'Armar', label: 'Armar', groups: ['biceps', 'triceps'] },
    ],
  },
  arnold_6: {
    id: 'arnold_6',
    label: 'Arnold split (6-dagars)',
    shortLabel: 'Arnold',
    daysPerWeek: 6,
    noRestDays: true,
    days: [
      { type: 'custom', customName: 'Bröst & Rygg', label: 'Bröst & Rygg', groups: ['chest', 'back'] },
      { type: 'custom', customName: 'Axlar & Armar', label: 'Axlar & Armar', groups: ['shoulders', 'biceps', 'triceps'] },
      { type: 'legs', label: 'Ben', groups: ['quads', 'hamstrings', 'glutes', 'calves'] },
      { type: 'custom', customName: 'Bröst & Rygg', label: 'Bröst & Rygg', groups: ['chest', 'back'] },
      { type: 'custom', customName: 'Axlar & Armar', label: 'Axlar & Armar', groups: ['shoulders', 'biceps', 'triceps'] },
      { type: 'legs', label: 'Ben', groups: ['quads', 'hamstrings', 'glutes', 'calves'] },
    ],
  },
  classic_4: {
    id: 'classic_4',
    label: '4-dagars klassisk',
    shortLabel: '4d klassisk',
    daysPerWeek: 4,
    noRestDays: false,
    days: [
      { type: 'custom', customName: 'Bröst & Triceps', label: 'Bröst & Triceps', groups: ['chest', 'triceps'] },
      { type: 'custom', customName: 'Rygg & Biceps', label: 'Rygg & Biceps', groups: ['back', 'biceps'] },
      { type: 'legs', label: 'Ben', groups: ['quads', 'hamstrings', 'glutes', 'calves'] },
      { type: 'custom', customName: 'Axlar', label: 'Axlar', groups: ['shoulders'] },
    ],
  },
};

export const TRAINING_SPLIT_OPTIONS: Array<{ id: TrainingSplitId; label: string; description: string }> = [
  { id: 'ppl_6', label: 'PPL (6-dagars)', description: 'Push → Pull → Ben, två varv per vecka' },
  { id: 'ppl_3', label: 'PPL (3-dagars)', description: 'Push → Pull → Ben, ett varv per vecka' },
  { id: 'upper_lower_4', label: 'Upper/Lower (4-dagars)', description: 'Överkropp och underkropp varannan dag' },
  { id: 'upper_lower_2', label: 'Upper/Lower (2-dagars)', description: 'En överkropps- och en underkroppsdag' },
  { id: 'push_pull_2', label: 'Push/Pull (2-dagars)', description: 'En push-dag och en pull-dag' },
  { id: 'bro_5', label: 'Bro split (5-dagars)', description: 'En muskelgrupp per dag' },
  { id: 'arnold_6', label: 'Arnold split (6-dagars)', description: 'Bröst+Rygg, Axlar+Armar, Ben — två varv' },
  { id: 'classic_4', label: '4-dagars klassisk', description: 'Bröst+Tri, Rygg+Bi, Ben, Axlar' },
  { id: 'full_body', label: 'Helkropp', description: 'Hela kroppen varje pass' },
  { id: 'custom', label: 'Eget upplägg', description: 'Ingen fast rotation – förslag baseras på återhämtning' },
];

export interface PastWorkout {
  workout_type: WorkoutType;
  custom_type_name: string | null;
  started_at: string;
}

/** Find the index of a SplitDay matching a past workout. Returns -1 if none. */
function matchDayIndex(split: SplitDefinition, past: PastWorkout): number {
  // Case-insensitive custom-name match first when present
  const customName = past.custom_type_name?.trim().toLowerCase();
  if (past.workout_type === 'custom' && customName) {
    return split.days.findIndex(
      (d) => d.type === 'custom' && d.customName?.toLowerCase() === customName
    );
  }
  // Fallback: match by workout_type (first occurrence wins for repeating splits;
  // we resolve actual position via `recentPositions` in getNextInSplit).
  return split.days.findIndex((d) => d.type === past.workout_type);
}

/**
 * Determine the next workout in the split based on the most recent workouts.
 * Uses the latest matched workout's position and returns the following day in
 * the rotation.
 */
export function getNextInSplit(
  splitId: TrainingSplitId,
  recentWorkouts: PastWorkout[]
): { day: SplitDay; previousLabel: string | null; splitLabel: string } | null {
  if (splitId === 'custom') return null;
  const split = TRAINING_SPLITS[splitId];
  if (!split) return null;

  // Walk recent workouts (newest first) and find the latest one we can match.
  for (const past of recentWorkouts) {
    const idx = matchDayIndex(split, past);
    if (idx >= 0) {
      const nextIdx = (idx + 1) % split.days.length;
      return {
        day: split.days[nextIdx],
        previousLabel: split.days[idx].label,
        splitLabel: split.label,
      };
    }
  }

  // No matching prior workout — start at day 0
  return {
    day: split.days[0],
    previousLabel: null,
    splitLabel: split.label,
  };
}
