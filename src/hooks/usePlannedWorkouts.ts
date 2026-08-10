import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { WorkoutType } from '@/types/workout';

export interface PlannedExerciseInput {
  exercise_id: string;
  exercise_name?: string;
  target_sets: number | null;
  target_reps: string | null;
  target_weight_kg: number | null;
  notes?: string | null;
}

export interface PlannedWorkout {
  id: string;
  workout_type: WorkoutType;
  title: string | null;
  notes: string | null;
  planned_date: string | null;
  source: string;
  exercises: Array<{
    id: string;
    exercise_id: string;
    exercise_name: string;
    order_index: number;
    target_sets: number | null;
    target_reps: string | null;
    target_weight_kg: number | null;
    notes: string | null;
  }>;
}

export function usePlannedWorkouts(includePast = false) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['planned-workouts', user?.id, includePast],
    enabled: !!user?.id,
    staleTime: 1000 * 60,
    queryFn: async (): Promise<PlannedWorkout[]> => {
      let q = supabase
        .from('workout_sessions')
        .select(
          `id, workout_type, title, notes, planned_date, source,
           workout_exercises ( id, exercise_id, order_index, target_sets, target_reps, target_weight_kg, notes, exercises ( name ) )`,
        )
        .eq('status', 'planned')
        .order('planned_date', { ascending: true });

      if (!includePast) {
        q = q.gte('planned_date', new Date().toISOString().slice(0, 10));
      }

      const { data, error } = await q;
      if (error) throw error;

      return ((data ?? []) as any[]).map((w) => ({
        id: w.id,
        workout_type: w.workout_type,
        title: w.title,
        notes: w.notes,
        planned_date: w.planned_date,
        source: w.source,
        exercises: (w.workout_exercises ?? [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((we: any) => ({
            id: we.id,
            exercise_id: we.exercise_id,
            exercise_name: we.exercises?.name ?? 'Okänd övning',
            order_index: we.order_index,
            target_sets: we.target_sets,
            target_reps: we.target_reps,
            target_weight_kg: we.target_weight_kg,
            notes: we.notes,
          })),
      }));
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['planned-workouts'] });
  };

  const savePlanned = useMutation({
    mutationFn: async (input: {
      id?: string;
      date: string;
      workout_type: WorkoutType;
      title: string | null;
      notes: string | null;
      exercises: PlannedExerciseInput[];
    }) => {
      if (!user?.id) throw new Error('Inte inloggad');
      let sessionId = input.id;

      if (sessionId) {
        const { error } = await supabase
          .from('workout_sessions')
          .update({
            workout_type: input.workout_type,
            title: input.title,
            notes: input.notes,
            planned_date: input.date,
            started_at: `${input.date}T12:00:00.000Z`,
          })
          .eq('id', sessionId)
          .eq('status', 'planned');
        if (error) throw error;
        await supabase.from('workout_exercises').delete().eq('workout_session_id', sessionId);
      } else {
        const { data, error } = await supabase
          .from('workout_sessions')
          .insert({
            user_id: user.id,
            workout_type: input.workout_type,
            title: input.title,
            notes: input.notes,
            status: 'planned',
            source: 'app',
            planned_date: input.date,
            is_active: false,
            started_at: `${input.date}T12:00:00.000Z`,
          })
          .select('id')
          .single();
        if (error) throw error;
        sessionId = data.id;
      }

      if (input.exercises.length) {
        const { error } = await supabase.from('workout_exercises').insert(
          input.exercises.map((e, index) => ({
            workout_session_id: sessionId!,
            exercise_id: e.exercise_id,
            order_index: index,
            target_sets: e.target_sets,
            target_reps: e.target_reps,
            target_weight_kg: e.target_weight_kg,
            notes: e.notes ?? null,
          })),
        );
        if (error) throw error;
      }

      return sessionId!;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Planerat pass sparat' });
    },
    onError: (error: any) => {
      toast({ title: 'Kunde inte spara passet', description: error.message, variant: 'destructive' });
    },
  });

  const deletePlanned = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workout_sessions')
        .delete()
        .eq('id', id)
        .eq('status', 'planned');
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Planerat pass borttaget' });
    },
    onError: (error: any) => {
      toast({ title: 'Kunde inte ta bort passet', description: error.message, variant: 'destructive' });
    },
  });

  return {
    plannedWorkouts: query.data ?? [],
    isLoading: query.isLoading,
    savePlanned,
    deletePlanned,
    refetch: invalidate,
  };
}
