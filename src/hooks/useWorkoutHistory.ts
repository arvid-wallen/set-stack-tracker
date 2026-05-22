import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useMemo } from 'react';
import { WorkoutType, MuscleGroup } from '@/types/workout';
import { startOfDay, format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

export interface WorkoutHistoryFilters {
  workoutType: WorkoutType | 'all';
  muscleGroup: MuscleGroup | 'all';
  rating: number | 'all';
}

export interface WorkoutWithDetails {
  id: string;
  workout_type: WorkoutType;
  custom_type_name: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  rating: number | null;
  notes: string | null;
  exercises: {
    id: string;
    exercise_id: string;
    exercise_name: string;
    muscle_groups: MuscleGroup[];
    is_cardio: boolean;
    sets: {
      id: string;
      set_number: number;
      weight_kg: number | null;
      reps: number | null;
      is_warmup: boolean;
      is_bodyweight: boolean;
    }[];
    cardio_log: {
      duration_seconds: number | null;
      distance_km: number | null;
      calories: number | null;
      cardio_type: string;
    } | null;
  }[];
}

const PAGE_SIZE = 1000;

// Fetch all rows of an `in()`-filtered query in batches to avoid the
// Supabase 1000-row default response limit.
async function fetchAllIn<T>(
  table: string,
  selectClause: string,
  column: string,
  ids: string[],
): Promise<T[]> {
  if (ids.length === 0) return [];
  const CHUNK = 200; // keep IN-list URL short
  const results: T[] = [];
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    let from = 0;
    // page through results for this chunk
    while (true) {
      const { data, error } = await supabase
        .from(table as any)
        .select(selectClause)
        .in(column, chunk)
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      const rows = (data ?? []) as T[];
      results.push(...rows);
      if (rows.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }
  }
  return results;
}

/**
 * Standalone fetcher (used by lazy actions like export).
 * Pulls *all* completed workout sessions for the current user with full
 * exercise/set/cardio details, paginated to avoid the 1000-row cap.
 */
export async function fetchWorkoutHistory(): Promise<WorkoutWithDetails[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Page through workout_sessions
  const sessions: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', false)
      .order('started_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const rows = data ?? [];
    sessions.push(...rows);
    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  if (sessions.length === 0) return [];

  const sessionIds = sessions.map((s) => s.id);
  const workoutExercises = await fetchAllIn<any>(
    'workout_exercises',
    `id, workout_session_id, exercise_id, exercises ( name, muscle_groups, is_cardio )`,
    'workout_session_id',
    sessionIds,
  );

  const exerciseIds = workoutExercises.map((we) => we.id);
  const [sets, cardioLogs] = await Promise.all([
    fetchAllIn<any>('exercise_sets', '*', 'workout_exercise_id', exerciseIds),
    fetchAllIn<any>('cardio_logs', '*', 'workout_exercise_id', exerciseIds),
  ]);

  return sessions.map((session) => {
    const sessionExercises = workoutExercises.filter(
      (we) => we.workout_session_id === session.id,
    );

    return {
      id: session.id,
      workout_type: session.workout_type as WorkoutType,
      custom_type_name: session.custom_type_name,
      started_at: session.started_at,
      ended_at: session.ended_at,
      duration_seconds: session.duration_seconds,
      rating: session.rating,
      notes: session.notes,
      exercises: sessionExercises.map((we) => {
        const exerciseSets = sets.filter((s) => s.workout_exercise_id === we.id);
        const cardioLog = cardioLogs.find((cl) => cl.workout_exercise_id === we.id);
        const exercise = we.exercises as
          | { name: string; muscle_groups: MuscleGroup[]; is_cardio: boolean }
          | null;

        return {
          id: we.id,
          exercise_id: we.exercise_id,
          exercise_name: exercise?.name || 'Okänd övning',
          muscle_groups: (exercise?.muscle_groups || []) as MuscleGroup[],
          is_cardio: exercise?.is_cardio || false,
          sets: exerciseSets
            .sort((a: any, b: any) => a.set_number - b.set_number)
            .map((s: any) => ({
              id: s.id,
              set_number: s.set_number,
              weight_kg: s.weight_kg,
              reps: s.reps,
              is_warmup: s.is_warmup,
              is_bodyweight: s.is_bodyweight,
            })),
          cardio_log: cardioLog
            ? {
                duration_seconds: cardioLog.duration_seconds,
                distance_km: cardioLog.distance_km ? Number(cardioLog.distance_km) : null,
                calories: cardioLog.calories,
                cardio_type: cardioLog.cardio_type,
              }
            : null,
        };
      }),
    };
  });
}

export function useWorkoutHistory() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<WorkoutHistoryFilters>({
    workoutType: 'all',
    muscleGroup: 'all',
    rating: 'all',
  });

  const { data: workouts, isLoading, error } = useQuery({
    queryKey: ['workout-history', user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: fetchWorkoutHistory,
  });

  // Apply filters
  const filteredWorkouts = useMemo(() => {
    if (!workouts) return [];

    return workouts.filter(workout => {
      if (filters.workoutType !== 'all' && workout.workout_type !== filters.workoutType) {
        return false;
      }
      if (filters.rating !== 'all' && workout.rating !== filters.rating) {
        return false;
      }
      if (filters.muscleGroup !== 'all') {
        const hasMuscleGroup = workout.exercises.some(exercise =>
          exercise.muscle_groups.includes(filters.muscleGroup as MuscleGroup)
        );
        if (!hasMuscleGroup) return false;
      }
      return true;
    });
  }, [workouts, filters]);

  const workoutsByDate = useMemo(() => {
    const map = new Map<string, WorkoutWithDetails[]>();
    filteredWorkouts.forEach(workout => {
      const dateKey = format(startOfDay(new Date(workout.started_at)), 'yyyy-MM-dd');
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, workout]);
    });
    return map;
  }, [filteredWorkouts]);

  const workoutDates = useMemo(() => {
    return Array.from(workoutsByDate.keys()).map(dateStr => new Date(dateStr));
  }, [workoutsByDate]);

  return {
    workouts: filteredWorkouts,
    workoutsByDate,
    workoutDates,
    isLoading,
    error,
    filters,
    setFilters,
    clearFilters: () => setFilters({
      workoutType: 'all',
      muscleGroup: 'all',
      rating: 'all',
    }),
  };
}
