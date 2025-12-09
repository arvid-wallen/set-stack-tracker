import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WorkoutSession, WorkoutExercise, ExerciseSet, WorkoutType } from '@/types/workout';
import { useToast } from '@/hooks/use-toast';

export function useWorkout() {
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Check for active workout on mount
  useEffect(() => {
    checkActiveWorkout();
  }, []);

  const checkActiveWorkout = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('workout_sessions')
      .select(`
        *,
        workout_exercises (
          *,
          exercises (*),
          exercise_sets (*)
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (data && !error) {
      setActiveWorkout(data as unknown as WorkoutSession);
      setExercises((data.workout_exercises || []) as unknown as WorkoutExercise[]);
    }
  };

  const startWorkout = async (workoutType: WorkoutType, customName?: string) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'Du måste vara inloggad', variant: 'destructive' });
        return null;
      }

      const { data, error } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          workout_type: workoutType,
          custom_type_name: customName || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setActiveWorkout(data as unknown as WorkoutSession);
      setExercises([]);
      toast({ title: 'Pass startat! 💪' });
      return data;
    } catch (error) {
      console.error('Error starting workout:', error);
      toast({ title: 'Kunde inte starta pass', variant: 'destructive' });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const endWorkout = async (rating?: number, notes?: string) => {
    if (!activeWorkout) return;

    setIsLoading(true);
    try {
      const endTime = new Date();
      const startTime = new Date(activeWorkout.started_at);
      const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      const { error } = await supabase
        .from('workout_sessions')
        .update({
          is_active: false,
          ended_at: endTime.toISOString(),
          duration_seconds: durationSeconds,
          rating,
          notes,
        })
        .eq('id', activeWorkout.id);

      if (error) throw error;

      setActiveWorkout(null);
      setExercises([]);
      toast({ title: 'Pass avslutat! Bra jobbat! 🎉' });
    } catch (error) {
      console.error('Error ending workout:', error);
      toast({ title: 'Kunde inte avsluta pass', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const addExercise = async (exerciseId: string) => {
    if (!activeWorkout) return null;

    try {
      const orderIndex = exercises.length;

      const { data, error } = await supabase
        .from('workout_exercises')
        .insert({
          workout_session_id: activeWorkout.id,
          exercise_id: exerciseId,
          order_index: orderIndex,
        })
        .select(`
          *,
          exercises (*)
        `)
        .single();

      if (error) throw error;

      const newExercise = { ...data, sets: [] } as unknown as WorkoutExercise;
      setExercises(prev => [...prev, newExercise]);
      return newExercise;
    } catch (error) {
      console.error('Error adding exercise:', error);
      toast({ title: 'Kunde inte lägga till övning', variant: 'destructive' });
      return null;
    }
  };

  const removeExercise = async (workoutExerciseId: string) => {
    try {
      const { error } = await supabase
        .from('workout_exercises')
        .delete()
        .eq('id', workoutExerciseId);

      if (error) throw error;

      setExercises(prev => prev.filter(e => e.id !== workoutExerciseId));
    } catch (error) {
      console.error('Error removing exercise:', error);
      toast({ title: 'Kunde inte ta bort övning', variant: 'destructive' });
    }
  };

  const addSet = async (
    workoutExerciseId: string,
    setData: Partial<ExerciseSet>
  ) => {
    try {
      const exercise = exercises.find(e => e.id === workoutExerciseId);
      const setNumber = (exercise?.sets?.length || 0) + 1;

      const { data, error } = await supabase
        .from('exercise_sets')
        .insert({
          workout_exercise_id: workoutExerciseId,
          set_number: setNumber,
          weight_kg: setData.weight_kg ?? null,
          reps: setData.reps ?? null,
          is_warmup: setData.is_warmup ?? false,
          is_bodyweight: setData.is_bodyweight ?? false,
          rpe: setData.rpe ?? null,
          rir: setData.rir ?? null,
          notes: setData.notes ?? null,
        })
        .select()
        .single();

      if (error) throw error;

      setExercises(prev => prev.map(e => {
        if (e.id === workoutExerciseId) {
          return {
            ...e,
            sets: [...(e.sets || []), data as unknown as ExerciseSet],
          };
        }
        return e;
      }));

      return data;
    } catch (error) {
      console.error('Error adding set:', error);
      toast({ title: 'Kunde inte lägga till set', variant: 'destructive' });
      return null;
    }
  };

  const updateSet = async (setId: string, updates: Partial<ExerciseSet>) => {
    try {
      const { error } = await supabase
        .from('exercise_sets')
        .update(updates)
        .eq('id', setId);

      if (error) throw error;

      setExercises(prev => prev.map(exercise => ({
        ...exercise,
        sets: exercise.sets?.map(set => 
          set.id === setId ? { ...set, ...updates } : set
        ),
      })));
    } catch (error) {
      console.error('Error updating set:', error);
      toast({ title: 'Kunde inte uppdatera set', variant: 'destructive' });
    }
  };

  const deleteSet = async (setId: string, workoutExerciseId: string) => {
    try {
      const { error } = await supabase
        .from('exercise_sets')
        .delete()
        .eq('id', setId);

      if (error) throw error;

      setExercises(prev => prev.map(exercise => {
        if (exercise.id === workoutExerciseId) {
          return {
            ...exercise,
            sets: exercise.sets?.filter(set => set.id !== setId),
          };
        }
        return exercise;
      }));
    } catch (error) {
      console.error('Error deleting set:', error);
      toast({ title: 'Kunde inte ta bort set', variant: 'destructive' });
    }
  };

  return {
    activeWorkout,
    exercises,
    isLoading,
    startWorkout,
    endWorkout,
    addExercise,
    removeExercise,
    addSet,
    updateSet,
    deleteSet,
    refreshWorkout: checkActiveWorkout,
  };
}