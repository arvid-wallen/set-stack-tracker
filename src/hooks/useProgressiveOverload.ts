import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type SuggestionType = 'increase_weight' | 'increase_reps' | 'deload' | 'maintain' | 'first_time';

export interface ProgressiveSuggestion {
  type: SuggestionType;
  message: string;
  suggestedWeight?: number;
  suggestedReps?: number;
  confidence: 'high' | 'medium' | 'low';
}

interface ExerciseHistory {
  date: string;
  bestWeight: number;
  bestReps: number;
  totalSets: number;
}

export function useProgressiveOverload(exerciseId: string | null) {
  // Fetch last 5 workout sessions for this exercise
  const { data: historyData, isLoading } = useQuery({
    queryKey: ['progressive-overload', exerciseId],
    enabled: !!exerciseId,
    queryFn: async () => {
      if (!exerciseId) return null;

      // Get workout exercises for this exercise, ordered by session date
      const { data: workoutExercises, error } = await supabase
        .from('workout_exercises')
        .select(`
          id,
          workout_session_id,
          workout_sessions!inner (
            started_at,
            is_active
          )
        `)
        .eq('exercise_id', exerciseId)
        .eq('workout_sessions.is_active', false)
        .order('workout_sessions(started_at)', { ascending: false })
        .limit(10);

      if (error) throw error;
      if (!workoutExercises || workoutExercises.length === 0) return null;

      const workoutExerciseIds = workoutExercises.map(we => we.id);

      // Fetch sets for these exercises
      const { data: sets, error: setsError } = await supabase
        .from('exercise_sets')
        .select('*')
        .in('workout_exercise_id', workoutExerciseIds)
        .eq('is_warmup', false);

      if (setsError) throw setsError;

      // Group sets by workout exercise
      const history: ExerciseHistory[] = [];
      
      for (const we of workoutExercises) {
        const exerciseSets = sets?.filter(s => s.workout_exercise_id === we.id) || [];
        if (exerciseSets.length === 0) continue;

        const workingSetWeights = exerciseSets
          .filter(s => s.weight_kg !== null)
          .map(s => s.weight_kg as number);
        
        const workingSetReps = exerciseSets
          .filter(s => s.reps !== null)
          .map(s => s.reps as number);

        if (workingSetWeights.length === 0) continue;

        const session = we.workout_sessions as { started_at: string };
        
        history.push({
          date: session.started_at,
          bestWeight: Math.max(...workingSetWeights),
          bestReps: Math.max(...workingSetReps),
          totalSets: exerciseSets.length,
        });
      }

      return history.slice(0, 5); // Last 5 sessions
    },
  });

  const suggestion = useMemo((): ProgressiveSuggestion | null => {
    if (!historyData || historyData.length === 0) {
      return {
        type: 'first_time',
        message: 'Första gången! Börja lätt och hitta rätt vikt.',
        confidence: 'low',
      };
    }

    const [lastSession, ...previousSessions] = historyData;
    
    if (previousSessions.length === 0) {
      return {
        type: 'maintain',
        message: `Senast: ${lastSession.bestWeight} kg × ${lastSession.bestReps} reps`,
        suggestedWeight: lastSession.bestWeight,
        suggestedReps: lastSession.bestReps,
        confidence: 'medium',
      };
    }

    // Check for progression over last 3-5 sessions
    const recentBestWeight = lastSession.bestWeight;
    const recentBestReps = lastSession.bestReps;
    
    // Calculate average of previous sessions
    const avgPreviousWeight = previousSessions.reduce((sum, s) => sum + s.bestWeight, 0) / previousSessions.length;
    const avgPreviousReps = previousSessions.reduce((sum, s) => sum + s.bestReps, 0) / previousSessions.length;

    // Check if last session hit target reps (e.g., 8-12 range, hitting 12 means ready to increase)
    const hitTargetReps = recentBestReps >= 10;
    
    // Check for plateau (same weight for 3+ sessions)
    const weightStagnant = previousSessions.length >= 2 && 
      previousSessions.slice(0, 2).every(s => s.bestWeight === recentBestWeight);

    // Check for decline
    const declining = recentBestWeight < avgPreviousWeight * 0.9;

    if (declining && previousSessions.length >= 3) {
      return {
        type: 'deload',
        message: 'Tänk på återhämtning. Överväg en lättare vecka.',
        suggestedWeight: Math.round(recentBestWeight * 0.8 / 2.5) * 2.5,
        confidence: 'medium',
      };
    }

    if (hitTargetReps && !weightStagnant) {
      // Ready to increase weight
      const newWeight = Math.ceil((recentBestWeight + 2.5) / 2.5) * 2.5;
      return {
        type: 'increase_weight',
        message: `Öka till ${newWeight} kg (du klarade ${recentBestReps} reps)`,
        suggestedWeight: newWeight,
        suggestedReps: 8,
        confidence: 'high',
      };
    }

    if (weightStagnant && recentBestReps < 10) {
      // Plateau - suggest increasing reps first
      return {
        type: 'increase_reps',
        message: `Sikta på ${recentBestReps + 1}-${recentBestReps + 2} reps @ ${recentBestWeight} kg`,
        suggestedWeight: recentBestWeight,
        suggestedReps: recentBestReps + 1,
        confidence: 'medium',
      };
    }

    // Default: maintain
    return {
      type: 'maintain',
      message: `Fortsätt med ${recentBestWeight} kg × ${recentBestReps} reps`,
      suggestedWeight: recentBestWeight,
      suggestedReps: recentBestReps,
      confidence: 'medium',
    };
  }, [historyData]);

  return {
    suggestion,
    history: historyData,
    isLoading,
  };
}
