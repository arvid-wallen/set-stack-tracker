import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WorkoutExercise } from '@/types/workout';

export interface ExercisePR {
  exerciseId: string;
  exerciseName: string;
  newMaxWeight: number;
  previousMaxWeight: number | null;
  reps: number;
}

export interface WorkoutSummary {
  totalVolumeKg: number;
  workingSetsCount: number;
  newPRs: ExercisePR[];
  isLoading: boolean;
}

/**
 * Compute summary for a just-finished (or in-progress) workout:
 * - Total volume (sum of weight*reps for non-warmup sets)
 * - Working set count
 * - Per-exercise new max-weight PRs vs all historical sets BEFORE this workout started
 */
export function useWorkoutSummary(
  workoutExercises: WorkoutExercise[],
  workoutStartedAt: string | null,
  enabled: boolean
): WorkoutSummary {
  const exerciseIds = workoutExercises
    .map((we) => we.exercise_id)
    .filter((id, i, a) => a.indexOf(id) === i);

  const { data: historyMax, isLoading } = useQuery({
    queryKey: ['workout-summary-history', exerciseIds.sort().join(','), workoutStartedAt],
    enabled: enabled && exerciseIds.length > 0 && !!workoutStartedAt,
    queryFn: async () => {
      // Get all workout_exercise rows for these exercises BEFORE this workout
      const { data: weRows, error: weErr } = await supabase
        .from('workout_exercises')
        .select('id, exercise_id, workout_session_id, workout_sessions!inner(started_at)')
        .in('exercise_id', exerciseIds)
        .lt('workout_sessions.started_at', workoutStartedAt!);

      if (weErr) throw weErr;
      if (!weRows || weRows.length === 0) return new Map<string, number>();

      const weIds = weRows.map((r) => r.id);
      const { data: sets, error: setsErr } = await supabase
        .from('exercise_sets')
        .select('workout_exercise_id, weight_kg, is_warmup')
        .in('workout_exercise_id', weIds)
        .eq('is_warmup', false);

      if (setsErr) throw setsErr;

      const weToExercise = new Map(weRows.map((r) => [r.id, r.exercise_id]));
      const maxByExercise = new Map<string, number>();
      for (const s of sets ?? []) {
        if (s.weight_kg == null) continue;
        const exId = weToExercise.get(s.workout_exercise_id);
        if (!exId) continue;
        const w = Number(s.weight_kg);
        const cur = maxByExercise.get(exId) ?? -Infinity;
        if (w > cur) maxByExercise.set(exId, w);
      }
      return maxByExercise;
    },
  });

  let totalVolumeKg = 0;
  let workingSetsCount = 0;
  const newPRs: ExercisePR[] = [];

  for (const we of workoutExercises) {
    const workingSets = (we.sets ?? []).filter((s) => !s.is_warmup);
    if (workingSets.length === 0) continue;

    let bestWeight = -Infinity;
    let bestReps = 0;
    for (const s of workingSets) {
      if (s.weight_kg != null && s.reps != null) {
        totalVolumeKg += Number(s.weight_kg) * Number(s.reps);
        workingSetsCount += 1;
        if (Number(s.weight_kg) > bestWeight) {
          bestWeight = Number(s.weight_kg);
          bestReps = Number(s.reps);
        }
      }
    }

    if (bestWeight > 0 && historyMax) {
      const prev = historyMax.get(we.exercise_id);
      // PR if no history OR strictly higher than previous max
      if (prev === undefined || bestWeight > prev) {
        newPRs.push({
          exerciseId: we.exercise_id,
          exerciseName: we.exercise?.name ?? 'Övning',
          newMaxWeight: bestWeight,
          previousMaxWeight: prev ?? null,
          reps: bestReps,
        });
      }
    }
  }

  return {
    totalVolumeKg: Math.round(totalVolumeKg),
    workingSetsCount,
    newPRs,
    isLoading,
  };
}
