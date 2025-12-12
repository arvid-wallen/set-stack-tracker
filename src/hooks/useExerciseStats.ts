import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';

interface SetData {
  id: string;
  weight_kg: number | null;
  reps: number | null;
  completed_at: string;
  is_warmup: boolean;
}

interface ExerciseHistory {
  date: string;
  dateLabel: string;
  bestWeight: number;
  bestReps: number;
  estimated1RM: number;
  totalVolume: number;
  sets: SetData[];
}

interface PersonalRecord {
  type: 'weight' | '1rm' | 'volume';
  value: number;
  date: string;
  reps?: number;
}

interface ExerciseGoal {
  id: string;
  exercise_id: string;
  target_weight_kg: number | null;
  target_reps: number | null;
  target_date: string | null;
  achieved: boolean;
  achieved_at: string | null;
  notes: string | null;
}

// Epley formula for 1RM estimation
export function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps === 0 || weight === 0) return 0;
  return Math.round(weight * (1 + reps / 30));
}

export function useExerciseStats(exerciseId: string | null) {
  const queryClient = useQueryClient();

  // Fetch all sets for this exercise
  const { data: setsData, isLoading: setsLoading } = useQuery({
    queryKey: ['exercise-stats', exerciseId],
    queryFn: async () => {
      if (!exerciseId) return [];

      const { data, error } = await supabase
        .from('exercise_sets')
        .select(`
          id,
          weight_kg,
          reps,
          completed_at,
          is_warmup,
          workout_exercises!inner (
            workout_session_id,
            workout_sessions!inner (
              started_at,
              is_active
            )
          )
        `)
        .eq('workout_exercises.exercise_id', exerciseId)
        .eq('workout_exercises.workout_sessions.is_active', false)
        .eq('is_warmup', false)
        .order('completed_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!exerciseId,
  });

  // Fetch goals for this exercise
  const { data: goals, isLoading: goalsLoading } = useQuery({
    queryKey: ['exercise-goals', exerciseId],
    queryFn: async () => {
      if (!exerciseId) return [];

      const { data, error } = await supabase
        .from('exercise_goals')
        .select('*')
        .eq('exercise_id', exerciseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ExerciseGoal[];
    },
    enabled: !!exerciseId,
  });

  // Group sets by workout date and calculate stats
  const history = useMemo<ExerciseHistory[]>(() => {
    if (!setsData || setsData.length === 0) return [];

    const byDate = new Map<string, SetData[]>();

    setsData.forEach((set: any) => {
      const sessionDate = set.workout_exercises?.workout_sessions?.started_at;
      if (!sessionDate) return;

      const dateKey = format(parseISO(sessionDate), 'yyyy-MM-dd');
      const existing = byDate.get(dateKey) || [];
      existing.push({
        id: set.id,
        weight_kg: set.weight_kg,
        reps: set.reps,
        completed_at: set.completed_at,
        is_warmup: set.is_warmup,
      });
      byDate.set(dateKey, existing);
    });

    return Array.from(byDate.entries()).map(([date, sets]) => {
      const workingSets = sets.filter(s => !s.is_warmup);
      const bestWeight = Math.max(...workingSets.map(s => s.weight_kg || 0));
      const bestReps = Math.max(...workingSets.map(s => s.reps || 0));
      
      // Find best estimated 1RM for this session
      const estimated1RM = Math.max(
        ...workingSets.map(s => calculate1RM(s.weight_kg || 0, s.reps || 0))
      );
      
      const totalVolume = workingSets.reduce(
        (acc, s) => acc + (s.weight_kg || 0) * (s.reps || 0),
        0
      );

      return {
        date,
        dateLabel: format(parseISO(date), 'd MMM', { locale: sv }),
        bestWeight,
        bestReps,
        estimated1RM,
        totalVolume,
        sets: workingSets,
      };
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [setsData]);

  // Calculate personal records
  const personalRecords = useMemo<PersonalRecord[]>(() => {
    if (history.length === 0) return [];

    const records: PersonalRecord[] = [];

    // Best weight PR
    let maxWeight = 0;
    let maxWeightDate = '';
    let maxWeightReps = 0;

    // Best estimated 1RM PR
    let max1RM = 0;
    let max1RMDate = '';

    // Best volume in single session
    let maxVolume = 0;
    let maxVolumeDate = '';

    history.forEach(session => {
      session.sets.forEach(set => {
        if ((set.weight_kg || 0) > maxWeight) {
          maxWeight = set.weight_kg || 0;
          maxWeightDate = session.date;
          maxWeightReps = set.reps || 0;
        }
      });

      if (session.estimated1RM > max1RM) {
        max1RM = session.estimated1RM;
        max1RMDate = session.date;
      }

      if (session.totalVolume > maxVolume) {
        maxVolume = session.totalVolume;
        maxVolumeDate = session.date;
      }
    });

    if (maxWeight > 0) {
      records.push({ type: 'weight', value: maxWeight, date: maxWeightDate, reps: maxWeightReps });
    }
    if (max1RM > 0) {
      records.push({ type: '1rm', value: max1RM, date: max1RMDate });
    }
    if (maxVolume > 0) {
      records.push({ type: 'volume', value: maxVolume, date: maxVolumeDate });
    }

    return records;
  }, [history]);

  // Current progress toward goals
  const goalProgress = useMemo(() => {
    if (!goals || goals.length === 0 || history.length === 0) return [];

    const latestSession = history[history.length - 1];
    const currentBest = Math.max(...history.map(h => h.bestWeight));

    return goals.map(goal => {
      const targetWeight = goal.target_weight_kg || 0;
      const progress = targetWeight > 0 ? (currentBest / targetWeight) * 100 : 0;

      return {
        ...goal,
        currentBest,
        progress: Math.min(progress, 100),
        remaining: Math.max(0, targetWeight - currentBest),
      };
    });
  }, [goals, history]);

  // Add goal mutation
  const addGoal = useMutation({
    mutationFn: async (goal: {
      target_weight_kg: number;
      target_reps?: number;
      target_date?: string;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !exerciseId) throw new Error('Not authenticated');

      const { error } = await supabase.from('exercise_goals').insert({
        user_id: user.id,
        exercise_id: exerciseId,
        target_weight_kg: goal.target_weight_kg,
        target_reps: goal.target_reps || null,
        target_date: goal.target_date || null,
        notes: goal.notes || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise-goals', exerciseId] });
    },
  });

  // Delete goal mutation
  const deleteGoal = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase.from('exercise_goals').delete().eq('id', goalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise-goals', exerciseId] });
    },
  });

  return {
    history,
    personalRecords,
    goals: goalProgress,
    isLoading: setsLoading || goalsLoading,
    addGoal,
    deleteGoal,
  };
}
