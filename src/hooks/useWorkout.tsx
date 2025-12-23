import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WorkoutSession, WorkoutExercise, ExerciseSet, WorkoutType, CardioLog } from '@/types/workout';
import { useToast } from '@/hooks/use-toast';
import { saveWorkoutToLocal, getLocalWorkout, clearLocalWorkout, hasPendingSync, getPendingActions, clearPendingActions, queueAction } from '@/lib/offline-storage';
function useWorkoutImpl() {
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingActions();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync pending actions when coming online
  const syncPendingActions = async () => {
    if (!hasPendingSync()) return;
    
    const actions = getPendingActions();
    for (const action of actions) {
      try {
        if (action.type === 'addSet') {
          await supabase.from('exercise_sets').insert(action.data);
        } else if (action.type === 'deleteSet') {
          await supabase.from('exercise_sets').delete().eq('id', action.data.id);
        }
      } catch (error) {
        console.error('Sync error:', error);
      }
    }
    clearPendingActions();
    checkActiveWorkout();
    toast({ title: 'Synkroniserat!' });
  };

  // Check for active workout on mount
  useEffect(() => {
    checkActiveWorkout();
  }, []);

  // Save workout state to local storage for offline support
  useEffect(() => {
    if (activeWorkout) {
      saveWorkoutToLocal(activeWorkout, exercises);
    }
  }, [activeWorkout, exercises]);

  const checkActiveWorkout = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Check for local workout if offline
      const localWorkout = getLocalWorkout();
      if (localWorkout) {
        setActiveWorkout(localWorkout.session);
        setExercises(localWorkout.exercises);
      }
      return;
    }

    const { data, error } = await supabase
      .from('workout_sessions')
      .select(`
        *,
        workout_exercises (
          *,
          exercises (*),
          exercise_sets (*),
          cardio_logs (*)
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (data && !error) {
      setActiveWorkout(data as unknown as WorkoutSession);
      const workoutExercises = (data.workout_exercises || []).map((we: any) => ({
        ...we,
        exercise: we.exercises,
        sets: we.exercise_sets || [],
        cardioLog: we.cardio_logs?.[0] || null,
      })) as WorkoutExercise[];
      setExercises(workoutExercises);
    } else {
      // Check for local workout
      const localWorkout = getLocalWorkout();
      if (localWorkout) {
        setActiveWorkout(localWorkout.session);
        setExercises(localWorkout.exercises);
      }
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

      clearLocalWorkout();
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

      const newExercise = { 
        ...data, 
        exercise: data.exercises,
        sets: [] 
      } as unknown as WorkoutExercise;
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

      const insertData = {
        workout_exercise_id: workoutExerciseId,
        set_number: setNumber,
        weight_kg: setData.weight_kg ?? null,
        reps: setData.reps ?? null,
        is_warmup: setData.is_warmup ?? false,
        is_bodyweight: setData.is_bodyweight ?? false,
        rpe: setData.rpe ?? null,
        rir: setData.rir ?? null,
        notes: setData.notes ?? null,
      };

      if (!isOnline) {
        // Queue for later sync
        queueAction({ type: 'addSet', data: insertData });
        
        // Optimistic update
        const tempId = `temp-${Date.now()}`;
        const tempSet = { ...insertData, id: tempId, completed_at: new Date().toISOString() } as ExerciseSet;
        
        setExercises(prev => prev.map(e => {
          if (e.id === workoutExerciseId) {
            return { ...e, sets: [...(e.sets || []), tempSet] };
          }
          return e;
        }));
        
        toast({ title: 'Set sparat lokalt' });
        return tempSet;
      }

      const { data, error } = await supabase
        .from('exercise_sets')
        .insert(insertData)
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
      if (!isOnline) {
        queueAction({ type: 'deleteSet', data: { id: setId } });
      } else {
        const { error } = await supabase
          .from('exercise_sets')
          .delete()
          .eq('id', setId);

        if (error) throw error;
      }

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

  const updateSupersetGroup = async (workoutExerciseId: string, groupNumber: number | null) => {
    try {
      const { error } = await supabase
        .from('workout_exercises')
        .update({ superset_group: groupNumber })
        .eq('id', workoutExerciseId);

      if (error) throw error;

      setExercises(prev => prev.map(e => 
        e.id === workoutExerciseId ? { ...e, superset_group: groupNumber } : e
      ));
    } catch (error) {
      console.error('Error updating superset:', error);
      toast({ title: 'Kunde inte uppdatera superset', variant: 'destructive' });
    }
  };

  const linkToSuperset = async (exerciseIndex: number) => {
    if (exerciseIndex <= 0 || exerciseIndex >= exercises.length) return;
    
    const currentExercise = exercises[exerciseIndex];
    const previousExercise = exercises[exerciseIndex - 1];
    
    // Use existing group or create new one
    const groupNumber = previousExercise.superset_group || 
      Math.max(...exercises.map(e => e.superset_group || 0)) + 1;
    
    await updateSupersetGroup(previousExercise.id, groupNumber);
    await updateSupersetGroup(currentExercise.id, groupNumber);
  };

  const unlinkFromSuperset = async (workoutExerciseId: string) => {
    await updateSupersetGroup(workoutExerciseId, null);
  };

  const markExerciseComplete = async (workoutExerciseId: string, completed: boolean) => {
    try {
      // Optimistic update
      setExercises(prev => prev.map(e => 
        e.id === workoutExerciseId ? { ...e, is_completed: completed } : e
      ));

      const { error } = await supabase
        .from('workout_exercises')
        .update({ is_completed: completed })
        .eq('id', workoutExerciseId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking exercise complete:', error);
      // Revert on error
      setExercises(prev => prev.map(e => 
        e.id === workoutExerciseId ? { ...e, is_completed: !completed } : e
      ));
      toast({ title: 'Kunde inte uppdatera övning', variant: 'destructive' });
    }
  };

  // Cardio functions
  const addCardioLog = async (
    workoutExerciseId: string,
    logData: Partial<CardioLog>
  ) => {
    try {
      const insertData = {
        workout_exercise_id: workoutExerciseId,
        cardio_type: logData.cardio_type || 'running',
        duration_seconds: logData.duration_seconds ?? null,
        distance_km: logData.distance_km ?? null,
        calories: logData.calories ?? null,
        notes: logData.notes ?? null,
      };

      const { data, error } = await supabase
        .from('cardio_logs')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      setExercises(prev => prev.map(e => {
        if (e.id === workoutExerciseId) {
          return { ...e, cardioLog: data as unknown as CardioLog };
        }
        return e;
      }));

      return data;
    } catch (error) {
      console.error('Error adding cardio log:', error);
      toast({ title: 'Kunde inte spara cardio', variant: 'destructive' });
      return null;
    }
  };

  const updateCardioLog = async (logId: string, workoutExerciseId: string, updates: Partial<CardioLog>) => {
    try {
      const { error } = await supabase
        .from('cardio_logs')
        .update(updates)
        .eq('id', logId);

      if (error) throw error;

      setExercises(prev => prev.map(exercise => {
        if (exercise.id === workoutExerciseId && exercise.cardioLog) {
          return {
            ...exercise,
            cardioLog: { ...exercise.cardioLog, ...updates },
          };
        }
        return exercise;
      }));
    } catch (error) {
      console.error('Error updating cardio log:', error);
      toast({ title: 'Kunde inte uppdatera cardio', variant: 'destructive' });
    }
  };

  const deleteCardioLog = async (logId: string, workoutExerciseId: string) => {
    try {
      const { error } = await supabase
        .from('cardio_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;

      setExercises(prev => prev.map(exercise => {
        if (exercise.id === workoutExerciseId) {
          return { ...exercise, cardioLog: undefined };
        }
        return exercise;
      }));
    } catch (error) {
      console.error('Error deleting cardio log:', error);
      toast({ title: 'Kunde inte ta bort cardio', variant: 'destructive' });
    }
  };

  return {
    activeWorkout,
    exercises,
    isLoading,
    isOnline,
    startWorkout,
    endWorkout,
    addExercise,
    removeExercise,
    addSet,
    updateSet,
    deleteSet,
    linkToSuperset,
    unlinkFromSuperset,
    markExerciseComplete,
    addCardioLog,
    updateCardioLog,
    deleteCardioLog,
    refreshWorkout: checkActiveWorkout,
  };
}

type WorkoutContextValue = ReturnType<typeof useWorkoutImpl>;

const WorkoutContext = createContext<WorkoutContextValue | null>(null);

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const value = useWorkoutImpl();
  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}

export function useWorkout() {
  const ctx = useContext(WorkoutContext);
  if (!ctx) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return ctx;
}

