import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ParsedSet {
  weight: number | null;
  reps: number | null;
  isWarmup: boolean;
}

export interface ParsedExercise {
  name: string;
  sets: ParsedSet[];
  matchedExerciseId?: string;
}

export interface ParsedWorkout {
  date: string;
  workoutType: string;
  exercises: ParsedExercise[];
  notes?: string;
}

export function useImportWorkouts() {
  const { user } = useAuth();
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parsedWorkouts, setParsedWorkouts] = useState<ParsedWorkout[]>([]);

  const parseWorkoutNotes = async (text: string) => {
    if (!user) {
      toast.error('Du måste vara inloggad');
      return null;
    }

    setIsParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-workout-notes', {
        body: { text }
      });

      if (error) {
        console.error('Parse error:', error);
        toast.error('Kunde inte tolka anteckningarna');
        return null;
      }

      if (data.error) {
        toast.error(data.error);
        return null;
      }

      const workouts = data.workouts || [];
      setParsedWorkouts(workouts);
      return workouts;
    } catch (err) {
      console.error('Parse error:', err);
      toast.error('Ett fel uppstod vid tolkning');
      return null;
    } finally {
      setIsParsing(false);
    }
  };

  const importWorkouts = async (workouts: ParsedWorkout[]) => {
    if (!user) {
      toast.error('Du måste vara inloggad');
      return false;
    }

    setIsImporting(true);
    try {
      // First, get all exercises to match names
      const { data: exercises } = await supabase
        .from('exercises')
        .select('id, name');

      const exerciseMap = new Map(
        exercises?.map(e => [e.name.toLowerCase(), e.id]) || []
      );

      let importedCount = 0;
      let skippedExercises: string[] = [];

      for (const workout of workouts) {
        // Create workout session
        const { data: session, error: sessionError } = await supabase
          .from('workout_sessions')
          .insert({
            user_id: user.id,
            started_at: `${workout.date}T10:00:00Z`,
            ended_at: `${workout.date}T11:00:00Z`,
            is_active: false,
            workout_type: workout.workoutType as any,
            notes: workout.notes || null,
            duration_seconds: 3600,
          })
          .select()
          .single();

        if (sessionError || !session) {
          console.error('Failed to create session:', sessionError);
          continue;
        }

        let orderIndex = 0;
        for (const exercise of workout.exercises) {
          // Find matching exercise
          let exerciseId = exercise.matchedExerciseId;
          if (!exerciseId) {
            exerciseId = exerciseMap.get(exercise.name.toLowerCase());
          }

          if (!exerciseId) {
            // Try fuzzy match
            for (const [name, id] of exerciseMap) {
              if (name.includes(exercise.name.toLowerCase()) || 
                  exercise.name.toLowerCase().includes(name)) {
                exerciseId = id;
                break;
              }
            }
          }

          if (!exerciseId) {
            skippedExercises.push(exercise.name);
            continue;
          }

          // Create workout exercise
          const { data: workoutExercise, error: weError } = await supabase
            .from('workout_exercises')
            .insert({
              workout_session_id: session.id,
              exercise_id: exerciseId,
              order_index: orderIndex++,
              is_completed: true,
            })
            .select()
            .single();

          if (weError || !workoutExercise) {
            console.error('Failed to create workout exercise:', weError);
            continue;
          }

          // Create sets
          for (let i = 0; i < exercise.sets.length; i++) {
            const set = exercise.sets[i];
            await supabase
              .from('exercise_sets')
              .insert({
                workout_exercise_id: workoutExercise.id,
                set_number: i + 1,
                weight_kg: set.weight,
                reps: set.reps,
                is_warmup: set.isWarmup,
                is_bodyweight: set.weight === null || set.weight === 0,
              });
          }
        }

        importedCount++;
      }

      if (skippedExercises.length > 0) {
        const uniqueSkipped = [...new Set(skippedExercises)];
        toast.warning(`${importedCount} pass importerade. Kunde inte matcha: ${uniqueSkipped.join(', ')}`);
      } else {
        toast.success(`${importedCount} träningspass importerade!`);
      }

      setParsedWorkouts([]);
      return true;
    } catch (err) {
      console.error('Import error:', err);
      toast.error('Ett fel uppstod vid import');
      return false;
    } finally {
      setIsImporting(false);
    }
  };

  const updateParsedWorkout = (index: number, workout: ParsedWorkout) => {
    setParsedWorkouts(prev => {
      const updated = [...prev];
      updated[index] = workout;
      return updated;
    });
  };

  const removeParsedWorkout = (index: number) => {
    setParsedWorkouts(prev => prev.filter((_, i) => i !== index));
  };

  const clearParsedWorkouts = () => {
    setParsedWorkouts([]);
  };

  return {
    isParsing,
    isImporting,
    parsedWorkouts,
    parseWorkoutNotes,
    importWorkouts,
    updateParsedWorkout,
    removeParsedWorkout,
    clearParsedWorkouts,
  };
}
