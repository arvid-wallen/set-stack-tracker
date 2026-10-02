import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Heaviest working-set weight ever logged for an exercise, excluding the current session. */
export function useExerciseBest(exerciseId: string | null, currentSessionId: string | null) {
  return useQuery({
    queryKey: ['exercise-best', exerciseId, currentSessionId],
    enabled: !!exerciseId,
    staleTime: 1000 * 60 * 30,
    queryFn: async (): Promise<number | null> => {
      const { data, error } = await supabase
        .from('workout_exercises')
        .select('workout_session_id, workout_sessions!inner(status), exercise_sets(weight_kg, is_warmup)')
        .eq('exercise_id', exerciseId!)
        .neq('workout_sessions.status', 'planned')
        .limit(1000);
      if (error) throw error;
      let best: number | null = null;
      for (const row of (data ?? []) as any[]) {
        if (row.workout_session_id === currentSessionId) continue;
        for (const s of row.exercise_sets ?? []) {
          if (s.is_warmup || s.weight_kg == null) continue;
          const w = Number(s.weight_kg);
          if (best === null || w > best) best = w;
        }
      }
      return best;
    },
  });
}
