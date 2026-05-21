import { useRecovery } from '@/hooks/useRecovery';
import { useTrainingMetrics } from '@/hooks/useTrainingMetrics';
import { usePTProfile } from '@/hooks/usePTProfile';
import { WorkoutType, MuscleGroup } from '@/types/workout';

export interface WorkoutSuggestion {
  type: WorkoutType;
  label: string;
  reason: string;
  muscleGroups: MuscleGroup[];
  daysSinceMax: number | null;
  score: number;
  /** True if the user has already met their weekly target. */
  isRestDay: boolean;
  isLoading: boolean;
}

const TEMPLATES: Array<{
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
  const { groups, isLoading: recLoading } = useRecovery();
  const metrics = useTrainingMetrics();
  const { ptProfile } = usePTProfile();

  const weeklyTarget =
    ptProfile?.training_days_per_week ?? metrics.weeklyGoal ?? 3;
  const isRestDay =
    weeklyTarget > 0 && metrics.workoutsThisWeek >= weeklyTarget;

  const byGroup = new Map(groups.map((g) => [g.group, g]));

  let best: WorkoutSuggestion | null = null;
  for (const t of TEMPLATES) {
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
      reason:
        allUntrained
          ? 'Inte tränat dessa muskler senaste månaden'
          : `Snitt ${score.toFixed(0)} dagars vila`,
      isRestDay,
      isLoading: recLoading,
    };
    if (!best || candidate.score > best.score) best = candidate;
  }

  if (!best) return null;
  return { ...best, isRestDay, isLoading: recLoading };
}
