import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { subDays, differenceInCalendarDays } from 'date-fns';
import { MuscleGroup, MUSCLE_GROUP_LABELS } from '@/types/workout';

export interface MuscleRecovery {
  group: MuscleGroup;
  label: string;
  daysSince: number | null; // null = never trained in window
  setsLast7: number;
  setsPrev7: number;
  /** 0..1 readiness: 0 = trained today, 1 = >=5 days rest */
  readiness: number;
  status: 'fresh' | 'recovering' | 'recent' | 'untrained';
}

const TRACKED_GROUPS: MuscleGroup[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'core',
];

export function useRecovery() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['muscle-recovery', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = subDays(new Date(), 30);
      // Fetch sets with completion date + exercise muscle groups via nested join
      const { data: sets, error } = await supabase
        .from('exercise_sets')
        .select(
          `completed_at, is_warmup,
           workout_exercises:workout_exercise_id (
             exercises:exercise_id ( muscle_groups )
           )`
        )
        .gte('completed_at', since.toISOString());
      if (error) throw error;
      return sets ?? [];
    },
  });

  const now = new Date();
  const cutoff7 = subDays(now, 7);
  const cutoff14 = subDays(now, 14);

  const perGroup = new Map<
    MuscleGroup,
    { lastAt: Date | null; last7: number; prev7: number }
  >();
  TRACKED_GROUPS.forEach((g) =>
    perGroup.set(g, { lastAt: null, last7: 0, prev7: 0 })
  );

  for (const row of data ?? []) {
    if ((row as any).is_warmup) continue;
    const we: any = (row as any).workout_exercises;
    const ex: any = we?.exercises;
    const groups: MuscleGroup[] = ex?.muscle_groups ?? [];
    const at = new Date((row as any).completed_at);
    for (const g of groups) {
      const entry = perGroup.get(g);
      if (!entry) continue;
      if (!entry.lastAt || at > entry.lastAt) entry.lastAt = at;
      if (at >= cutoff7) entry.last7 += 1;
      else if (at >= cutoff14) entry.prev7 += 1;
    }
  }

  const groups: MuscleRecovery[] = TRACKED_GROUPS.map((g) => {
    const e = perGroup.get(g)!;
    const daysSince = e.lastAt ? differenceInCalendarDays(now, e.lastAt) : null;
    const readiness =
      daysSince === null ? 1 : Math.min(1, daysSince / 5);
    let status: MuscleRecovery['status'];
    if (daysSince === null) status = 'untrained';
    else if (daysSince <= 1) status = 'recent';
    else if (daysSince <= 3) status = 'recovering';
    else status = 'fresh';
    return {
      group: g,
      label: MUSCLE_GROUP_LABELS[g],
      daysSince,
      setsLast7: e.last7,
      setsPrev7: e.prev7,
      readiness,
      status,
    };
  });

  return { groups, isLoading };
}
