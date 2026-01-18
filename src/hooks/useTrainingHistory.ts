import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format, subDays } from 'date-fns';
import { sv } from 'date-fns/locale';

interface RecentWorkout {
  date: string;
  type: string;
  exerciseCount: number;
  duration: number;
  topExercise: string;
}

interface TopExercise {
  name: string;
  exerciseId: string;
  lastWeight: number;
  lastReps: number;
  personalRecord: number;
  timesPerformed: number;
  progressSuggestion: string;
}

interface PersonalRecord {
  exerciseName: string;
  weight: number;
  date: string;
}

export interface TrainingHistory {
  recentWorkouts: RecentWorkout[];
  topExercises: TopExercise[];
  personalRecords: PersonalRecord[];
}

// Progressive overload logic (same as useProgressiveOverload)
function calculateProgressSuggestion(
  lastWeight: number,
  lastReps: number,
  personalRecord: number
): string {
  if (!lastWeight || !lastReps) return '';
  
  // If they hit 10+ reps, suggest increasing weight
  if (lastReps >= 10) {
    const newWeight = lastWeight + 2.5;
    return `Öka till ${newWeight}kg (klarade ${lastReps} reps)`;
  }
  
  // If they're below 6 reps, might need to decrease
  if (lastReps < 6 && lastWeight > 20) {
    const newWeight = lastWeight - 2.5;
    return `Överväg ${newWeight}kg för fler reps`;
  }
  
  // If close to PR, encourage pushing
  if (lastWeight >= personalRecord * 0.95 && lastWeight < personalRecord) {
    return `Nära PR! Försök slå ${personalRecord}kg`;
  }
  
  // Standard progression - try to add reps
  if (lastReps >= 8) {
    return `Bra! Sikta på ${lastReps + 1}-${lastReps + 2} reps`;
  }
  
  return `Fortsätt med ${lastWeight}kg, sikta på 8-10 reps`;
}

export function useTrainingHistory() {
  const { user } = useAuth();

  const { data: trainingHistory, isLoading } = useQuery({
    queryKey: ['training-history-for-ai', user?.id],
    queryFn: async (): Promise<TrainingHistory> => {
      if (!user) {
        return { recentWorkouts: [], topExercises: [], personalRecords: [] };
      }

      // Fetch recent completed workouts (last 30 days, max 10)
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      
      const { data: sessions, error: sessionsError } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', false)
        .gte('started_at', thirtyDaysAgo)
        .order('started_at', { ascending: false })
        .limit(10);

      if (sessionsError) throw sessionsError;

      // Get workout exercises with exercise details
      const sessionIds = sessions?.map(s => s.id) || [];
      
      let workoutExercises: any[] = [];
      let exerciseSets: any[] = [];
      
      if (sessionIds.length > 0) {
        const { data: exercises, error: exercisesError } = await supabase
          .from('workout_exercises')
          .select(`
            id,
            workout_session_id,
            exercise_id,
            exercises (
              id,
              name,
              is_cardio
            )
          `)
          .in('workout_session_id', sessionIds);

        if (exercisesError) throw exercisesError;
        workoutExercises = exercises || [];

        // Get sets for these exercises
        const exerciseIds = workoutExercises.map(we => we.id);
        if (exerciseIds.length > 0) {
          const { data: sets, error: setsError } = await supabase
            .from('exercise_sets')
            .select('*')
            .in('workout_exercise_id', exerciseIds)
            .eq('is_warmup', false);

          if (setsError) throw setsError;
          exerciseSets = sets || [];
        }
      }

      // Build recent workouts summary
      const recentWorkouts: RecentWorkout[] = (sessions || []).map(session => {
        const sessionExercises = workoutExercises.filter(
          we => we.workout_session_id === session.id
        );
        
        // Find top exercise (heaviest weight)
        let topExercise = '';
        let maxWeight = 0;
        
        sessionExercises.forEach(we => {
          const sets = exerciseSets.filter(s => s.workout_exercise_id === we.id);
          const heaviestSet = sets.reduce((max, s) => 
            (s.weight_kg || 0) > (max.weight_kg || 0) ? s : max, 
            { weight_kg: 0, reps: 0 }
          );
          
          if (heaviestSet.weight_kg > maxWeight) {
            maxWeight = heaviestSet.weight_kg;
            const exerciseName = we.exercises?.name || 'Okänd';
            topExercise = `${exerciseName} ${heaviestSet.weight_kg}kg × ${heaviestSet.reps}`;
          }
        });

        const workoutTypeLabels: Record<string, string> = {
          push: 'Push',
          pull: 'Pull',
          legs: 'Ben',
          full_body: 'Helkropp',
          upper: 'Överkropp',
          lower: 'Underkropp',
          cardio: 'Kondition',
          custom: session.custom_type_name || 'Eget pass',
        };

        return {
          date: format(new Date(session.started_at), 'd MMM', { locale: sv }),
          type: workoutTypeLabels[session.workout_type] || session.workout_type,
          exerciseCount: sessionExercises.length,
          duration: Math.round((session.duration_seconds || 0) / 60),
          topExercise,
        };
      });

      // Build top exercises with progression suggestions
      const exerciseStats = new Map<string, {
        name: string;
        exerciseId: string;
        weights: number[];
        reps: number[];
        count: number;
        lastWeight: number;
        lastReps: number;
      }>();

      // Process exercises in chronological order
      const sortedExercises = [...workoutExercises].sort((a, b) => {
        const sessionA = sessions?.find(s => s.id === a.workout_session_id);
        const sessionB = sessions?.find(s => s.id === b.workout_session_id);
        return new Date(sessionA?.started_at || 0).getTime() - new Date(sessionB?.started_at || 0).getTime();
      });

      sortedExercises.forEach(we => {
        if (we.exercises?.is_cardio) return;
        
        const exerciseId = we.exercise_id;
        const exerciseName = we.exercises?.name || 'Okänd';
        const sets = exerciseSets.filter(s => s.workout_exercise_id === we.id);
        
        if (sets.length === 0) return;

        const heaviestSet = sets.reduce((max, s) => 
          (s.weight_kg || 0) > (max.weight_kg || 0) ? s : max,
          { weight_kg: 0, reps: 0 }
        );

        if (!exerciseStats.has(exerciseId)) {
          exerciseStats.set(exerciseId, {
            name: exerciseName,
            exerciseId,
            weights: [],
            reps: [],
            count: 0,
            lastWeight: 0,
            lastReps: 0,
          });
        }

        const stats = exerciseStats.get(exerciseId)!;
        stats.weights.push(heaviestSet.weight_kg || 0);
        stats.reps.push(heaviestSet.reps || 0);
        stats.count++;
        stats.lastWeight = heaviestSet.weight_kg || 0;
        stats.lastReps = heaviestSet.reps || 0;
      });

      // Convert to top exercises array with progression
      const topExercises: TopExercise[] = Array.from(exerciseStats.values())
        .filter(e => e.count >= 1 && e.lastWeight > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
        .map(e => {
          const personalRecord = Math.max(...e.weights);
          return {
            name: e.name,
            exerciseId: e.exerciseId,
            lastWeight: e.lastWeight,
            lastReps: e.lastReps,
            personalRecord,
            timesPerformed: e.count,
            progressSuggestion: calculateProgressSuggestion(e.lastWeight, e.lastReps, personalRecord),
          };
        });

      // Build personal records (top 5 heaviest lifts)
      const personalRecords: PersonalRecord[] = [];
      const prMap = new Map<string, { weight: number; date: string }>();

      workoutExercises.forEach(we => {
        if (we.exercises?.is_cardio) return;
        
        const exerciseName = we.exercises?.name || 'Okänd';
        const session = sessions?.find(s => s.id === we.workout_session_id);
        const sets = exerciseSets.filter(s => s.workout_exercise_id === we.id);
        
        const heaviestSet = sets.reduce((max, s) => 
          (s.weight_kg || 0) > (max.weight_kg || 0) ? s : max,
          { weight_kg: 0 }
        );

        const currentPR = prMap.get(exerciseName);
        if (!currentPR || heaviestSet.weight_kg > currentPR.weight) {
          prMap.set(exerciseName, {
            weight: heaviestSet.weight_kg,
            date: session ? format(new Date(session.started_at), 'd MMM', { locale: sv }) : '',
          });
        }
      });

      prMap.forEach((pr, exerciseName) => {
        if (pr.weight > 0) {
          personalRecords.push({
            exerciseName,
            weight: pr.weight,
            date: pr.date,
          });
        }
      });

      // Sort by weight and take top 5
      personalRecords.sort((a, b) => b.weight - a.weight);
      personalRecords.splice(5);

      return {
        recentWorkouts,
        topExercises,
        personalRecords,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    trainingHistory: trainingHistory || { recentWorkouts: [], topExercises: [], personalRecords: [] },
    isLoading,
  };
}
