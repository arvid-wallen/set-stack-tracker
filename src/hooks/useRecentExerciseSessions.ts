import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RecentSession {
  date: string;
  sets: { weight_kg: number | null; reps: number | null }[];
}

/** Last N completed sessions for an exercise (working sets only), excluding the current session. */
export function useRecentExerciseSessions(exerciseId: string | null, currentSessionId: string | null, limit = 3) {
  return useQuery({
    queryKey: ['recent-exercise-sessions', exerciseId, currentSessionId, limit],
    enabled: !!exerciseId,
    staleTime: 1000 * 60 * 10,
    queryFn: async (): Promise<RecentSession[]> => {
      const { data, error } = await supabase
        .from('workout_exercises')
        .select('id, workout_session_id, workout_sessions!inner(started_at, status), exercise_sets(set_number, weight_kg, reps, is_warmup)')
        .eq('exercise_id', exerciseId!)
        .neq('workout_sessions.status', 'planned')
        .order('created_at', { ascending: false })
        .limit(limit + 4);
      if (error) throw error;
      const out: RecentSession[] = [];
      for (const row of (data ?? []) as any[]) {
        if (row.workout_session_id === currentSessionId) continue;
        const sets = ((row.exercise_sets ?? []) as any[])
          .filter((s) => !s.is_warmup)
          .sort((a, b) => a.set_number - b.set_number)
          .map((s) => ({ weight_kg: s.weight_kg != null ? Number(s.weight_kg) : null, reps: s.reps }));
        if (sets.length === 0) continue;
        out.push({ date: row.workout_sessions.started_at, sets });
        if (out.length >= limit) break;
      }
      return out;
    },
  });
}
