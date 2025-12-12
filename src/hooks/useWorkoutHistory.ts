import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useMemo } from 'react';
import { WorkoutType, MuscleGroup } from '@/types/workout';
import { startOfDay, format } from 'date-fns';

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

export function useWorkoutHistory() {
  const [filters, setFilters] = useState<WorkoutHistoryFilters>({
    workoutType: 'all',
    muscleGroup: 'all',
    rating: 'all',
  });

  const { data: workouts, isLoading, error } = useQuery({
    queryKey: ['workout-history'],
    queryFn: async () => {
      // Fetch completed workout sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('is_active', false)
        .order('started_at', { ascending: false });

      if (sessionsError) throw sessionsError;
      if (!sessions || sessions.length === 0) return [];

      // Fetch workout exercises with exercise details
      const sessionIds = sessions.map(s => s.id);
      const { data: workoutExercises, error: exercisesError } = await supabase
        .from('workout_exercises')
        .select(`
          id,
          workout_session_id,
          exercise_id,
          exercises (
            name,
            muscle_groups,
            is_cardio
          )
        `)
        .in('workout_session_id', sessionIds);

      if (exercisesError) throw exercisesError;

      // Fetch exercise sets
      const exerciseIds = workoutExercises?.map(we => we.id) || [];
      const { data: sets, error: setsError } = await supabase
        .from('exercise_sets')
        .select('*')
        .in('workout_exercise_id', exerciseIds);

      if (setsError) throw setsError;

      // Fetch cardio logs
      const { data: cardioLogs, error: cardioError } = await supabase
        .from('cardio_logs')
        .select('*')
        .in('workout_exercise_id', exerciseIds);

      if (cardioError) throw cardioError;

      // Combine data
      const workoutsWithDetails: WorkoutWithDetails[] = sessions.map(session => {
        const sessionExercises = workoutExercises?.filter(
          we => we.workout_session_id === session.id
        ) || [];

        return {
          id: session.id,
          workout_type: session.workout_type as WorkoutType,
          custom_type_name: session.custom_type_name,
          started_at: session.started_at,
          ended_at: session.ended_at,
          duration_seconds: session.duration_seconds,
          rating: session.rating,
          notes: session.notes,
          exercises: sessionExercises.map(we => {
            const exerciseSets = sets?.filter(s => s.workout_exercise_id === we.id) || [];
            const cardioLog = cardioLogs?.find(cl => cl.workout_exercise_id === we.id);
            const exercise = we.exercises as { name: string; muscle_groups: MuscleGroup[]; is_cardio: boolean } | null;

            return {
              id: we.id,
              exercise_id: we.exercise_id,
              exercise_name: exercise?.name || 'Okänd övning',
              muscle_groups: (exercise?.muscle_groups || []) as MuscleGroup[],
              is_cardio: exercise?.is_cardio || false,
              sets: exerciseSets
                .sort((a, b) => a.set_number - b.set_number)
                .map(s => ({
                  id: s.id,
                  set_number: s.set_number,
                  weight_kg: s.weight_kg,
                  reps: s.reps,
                  is_warmup: s.is_warmup,
                  is_bodyweight: s.is_bodyweight,
                })),
              cardio_log: cardioLog ? {
                duration_seconds: cardioLog.duration_seconds,
                distance_km: cardioLog.distance_km ? Number(cardioLog.distance_km) : null,
                calories: cardioLog.calories,
                cardio_type: cardioLog.cardio_type,
              } : null,
            };
          }),
        };
      });

      return workoutsWithDetails;
    },
  });

  // Apply filters
  const filteredWorkouts = useMemo(() => {
    if (!workouts) return [];

    return workouts.filter(workout => {
      // Filter by workout type
      if (filters.workoutType !== 'all' && workout.workout_type !== filters.workoutType) {
        return false;
      }

      // Filter by rating
      if (filters.rating !== 'all' && workout.rating !== filters.rating) {
        return false;
      }

      // Filter by muscle group
      if (filters.muscleGroup !== 'all') {
        const hasMuscleGroup = workout.exercises.some(exercise =>
          exercise.muscle_groups.includes(filters.muscleGroup as MuscleGroup)
        );
        if (!hasMuscleGroup) return false;
      }

      return true;
    });
  }, [workouts, filters]);

  // Group workouts by date for calendar view
  const workoutsByDate = useMemo(() => {
    const map = new Map<string, WorkoutWithDetails[]>();

    filteredWorkouts.forEach(workout => {
      const dateKey = format(startOfDay(new Date(workout.started_at)), 'yyyy-MM-dd');
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, workout]);
    });

    return map;
  }, [filteredWorkouts]);

  // Get all dates that have workouts
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
