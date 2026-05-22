import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRecovery } from '@/hooks/useRecovery';
import { useTrainingMetrics } from '@/hooks/useTrainingMetrics';
import { usePTProfile } from '@/hooks/usePTProfile';
import { WorkoutType, MuscleGroup } from '@/types/workout';
import {
  getNextInSplit,
  TrainingSplitId,
  TRAINING_SPLITS,
  PastWorkout,
} from '@/lib/training-splits';

export interface WorkoutSuggestion {
  type: WorkoutType;
  /** Custom name to pass to startWorkout when type is 'custom' */
  customName?: string;
  label: string;
  reason: string;
  muscleGroups: MuscleGroup[];
  daysSinceMax: number | null;
  score: number;
  /** True if the user has already met their weekly target. */
  isRestDay: boolean;
  isLoading: boolean;
  /** Human-readable split name when suggestion is split-driven */
  splitLabel?: string;
}

const FALLBACK_TEMPLATES: Array<{
  type: WorkoutType;
  label: string;
  groups: MuscleGroup[];
}> = [
  { type: 'push', label: 'Push (bröst, axlar, triceps)', groups: ['chest', 'shoulders', 'triceps'] },
  { type: 'pull', label: 'Pull (rygg, biceps)', groups: ['back', 'biceps'] },
  { type: 'legs', label: 'Ben (quads, baksida, glutes)', groups: ['quads', 'hamstrings', 'glutes', 'calves'] },
  { type: 'full_body', label: 'Helkropp', groups: ['chest', 'back', 'quads', 'core'] },
];

export function useSuggestedWorkout(): WorkoutSuggestion | null {
  const { user } = useAuth();
  const { groups, isLoading: recLoading } = useRecovery();
  const metrics = useTrainingMetrics();
  const { ptProfile } = usePTProfile();

  const splitId = (ptProfile as any)?.training_split as TrainingSplitId | null | undefined;

  // Load recent completed workouts (newest first) for split rotation
  const { data: recentWorkouts, isLoading: recentLoading } = useQuery({
    queryKey: ['recent-workouts-for-split', user?.id],
    enabled: !!user && !!splitId && splitId !== 'custom',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('workout_type, custom_type_name, started_at, is_active')
        .eq('user_id', user!.id)
        .eq('is_active', false)
        .order('started_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as PastWorkout[];
    },
  });

  const weeklyTarget =
    ptProfile?.training_days_per_week ?? metrics.weeklyGoal ?? 3;
  const isRestDay =
    weeklyTarget > 0 && metrics.workoutsThisWeek >= weeklyTarget;

  const isLoading = recLoading || recentLoading;

  // --- Split-driven suggestion ---
  if (splitId && splitId !== 'custom' && TRAINING_SPLITS[splitId]) {
    const next = getNextInSplit(splitId, recentWorkouts ?? []);
    if (next) {
      const byGroup = new Map(groups.map((g) => [g.group, g]));
      let maxDays: number | null = 0;
      let allUntrained = true;
      for (const g of next.day.groups) {
        const r = byGroup.get(g);
        if (!r) continue;
        const d = r.daysSince === null ? 14 : r.daysSince;
        if (r.daysSince !== null) allUntrained = false;
        if (maxDays === null || d > maxDays) maxDays = d;
      }

      const reason = next.previousLabel
        ? `Du körde ${next.previousLabel} senast — dags för ${next.day.label}`
        : `Starta din ${next.splitLabel}-rotation med ${next.day.label}`;

      return {
        type: next.day.type,
        customName: next.day.customName,
        label: next.day.label,
        muscleGroups: next.day.groups,
        daysSinceMax: allUntrained ? null : maxDays,
        score: maxDays ?? 0,
        reason,
        isRestDay,
        isLoading,
        splitLabel: next.splitLabel,
      };
    }
  }

  // --- Fallback: recovery-based heuristic ---
  const byGroup = new Map(groups.map((g) => [g.group, g]));
  let best: WorkoutSuggestion | null = null;
  for (const t of FALLBACK_TEMPLATES) {
    let score = 0;
    let maxDays: number | null = 0;
    let allUntrained = true;
    for (const g of t.groups) {
      const r = byGroup.get(g);
      if (!r) continue;
      const d = r.daysSince === null ? 14 : r.daysSince;
      if (r.daysSince !== null) allUntrained = false;
      score += d;
      if (maxDays === null || d > maxDays) maxDays = d;
    }
    score = score / t.groups.length;
    const candidate: WorkoutSuggestion = {
      type: t.type,
      label: t.label,
      muscleGroups: t.groups,
      daysSinceMax: allUntrained ? null : maxDays,
      score,
      reason: allUntrained
        ? 'Inte tränat dessa muskler senaste månaden'
        : `Snitt ${score.toFixed(0)} dagars vila`,
      isRestDay,
      isLoading,
    };
    if (!best || candidate.score > best.score) best = candidate;
  }

  if (!best) return null;
  return { ...best, isRestDay, isLoading };
}
