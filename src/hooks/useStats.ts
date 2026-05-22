import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';
import { startOfWeek, subWeeks, format, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';
import { MuscleGroup, MUSCLE_GROUP_LABELS } from '@/types/workout';
import { useAuth } from '@/hooks/useAuth';

export type TimePeriod = 'week' | 'month' | 'year' | 'all';

interface WeeklyData {
  week: string;
  weekLabel: string;
  workouts: number;
  tonnage: number;
  sets: number;
  duration: number;
}

interface MuscleGroupData {
  muscleGroup: MuscleGroup;
  label: string;
  sets: number;
  volume: number;
  percentage: number;
  color: string;
}

interface OverviewStats {
  totalWorkouts: number;
  totalDuration: number;
  totalVolume: number;
  avgWorkoutsPerWeek: number;
  avgDuration: number;
  totalSets: number;
}

const MUSCLE_GROUP_COLORS: Record<MuscleGroup, string> = {
  chest: 'hsl(0, 70%, 50%)',
  back: 'hsl(210, 70%, 50%)',
  shoulders: 'hsl(30, 70%, 50%)',
  biceps: 'hsl(140, 70%, 50%)',
  triceps: 'hsl(270, 70%, 50%)',
  forearms: 'hsl(180, 70%, 50%)',
  quads: 'hsl(45, 70%, 50%)',
  hamstrings: 'hsl(55, 70%, 50%)',
  glutes: 'hsl(35, 70%, 50%)',
  calves: 'hsl(65, 70%, 50%)',
  core: 'hsl(190, 70%, 50%)',
  full_body: 'hsl(300, 70%, 50%)',
};

const PAGE_SIZE = 1000;

async function fetchAllSets(userId: string) {
  // Page through exercise_sets for this user; uses RLS to scope, but we still
  // need to paginate past the 1000-row default response cap.
  const all: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('exercise_sets')
      .select(
        `id, weight_kg, reps, is_warmup, completed_at,
         workout_exercises!inner (
           workout_session_id,
           exercises!inner ( muscle_groups )
         )`
      )
      .eq('is_warmup', false)
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const rows = data ?? [];
    all.push(...rows);
    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

export function useStats(_period: TimePeriod = 'all') {
  const { user } = useAuth();
  const userId = user?.id;

  // Single sessions query — also serves as the date map (no separate fetch).
  const { data: workoutData, isLoading: workoutsLoading } = useQuery({
    queryKey: ['stats-workouts', userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('id, started_at, ended_at, duration_seconds, workout_type')
        .eq('user_id', userId!)
        .eq('is_active', false)
        .order('started_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: setsData, isLoading: setsLoading } = useQuery({
    queryKey: ['stats-sets', userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: () => fetchAllSets(userId!),
  });

  // Session date map derived from workoutData (was a redundant 3rd query).
  const sessionDates = useMemo(() => {
    return new Map((workoutData ?? []).map((s) => [s.id, s.started_at]));
  }, [workoutData]);

  const overviewStats = useMemo<OverviewStats>(() => {
    if (!workoutData || !setsData) {
      return {
        totalWorkouts: 0,
        totalDuration: 0,
        totalVolume: 0,
        avgWorkoutsPerWeek: 0,
        avgDuration: 0,
        totalSets: 0,
      };
    }

    const totalWorkouts = workoutData.length;
    const totalDuration = workoutData.reduce((acc, w) => acc + (w.duration_seconds || 0), 0);
    const totalVolume = setsData.reduce((acc, s) => acc + (s.weight_kg || 0) * (s.reps || 0), 0);
    const totalSets = setsData.length;

    const firstWorkout = workoutData[workoutData.length - 1];
    const weeksSinceFirst = firstWorkout
      ? Math.max(1, Math.ceil((Date.now() - new Date(firstWorkout.started_at).getTime()) / (7 * 24 * 60 * 60 * 1000)))
      : 1;

    return {
      totalWorkouts,
      totalDuration,
      totalVolume,
      avgWorkoutsPerWeek: totalWorkouts / weeksSinceFirst,
      avgDuration: totalWorkouts > 0 ? totalDuration / totalWorkouts : 0,
      totalSets,
    };
  }, [workoutData, setsData]);

  const weeklyData = useMemo<WeeklyData[]>(() => {
    if (!workoutData || !setsData) return [];

    const weeks = new Map<string, WeeklyData>();
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
      const key = format(weekStart, 'yyyy-MM-dd');
      weeks.set(key, {
        week: key,
        weekLabel: format(weekStart, 'd MMM', { locale: sv }),
        workouts: 0,
        tonnage: 0,
        sets: 0,
        duration: 0,
      });
    }

    workoutData.forEach(workout => {
      const weekStart = startOfWeek(parseISO(workout.started_at), { weekStartsOn: 1 });
      const key = format(weekStart, 'yyyy-MM-dd');
      const week = weeks.get(key);
      if (week) {
        week.workouts++;
        week.duration += workout.duration_seconds || 0;
      }
    });

    setsData.forEach(set => {
      const sessionId = (set.workout_exercises as any)?.workout_session_id;
      const sessionDate = sessionDates.get(sessionId);
      if (!sessionDate) return;

      const weekStart = startOfWeek(parseISO(sessionDate), { weekStartsOn: 1 });
      const key = format(weekStart, 'yyyy-MM-dd');
      const week = weeks.get(key);
      if (week) {
        week.tonnage += (set.weight_kg || 0) * (set.reps || 0);
        week.sets++;
      }
    });

    return Array.from(weeks.values());
  }, [workoutData, setsData, sessionDates]);

  const muscleGroupData = useMemo<MuscleGroupData[]>(() => {
    if (!setsData) return [];

    const groups = new Map<MuscleGroup, { sets: number; volume: number }>();

    setsData.forEach(set => {
      const muscleGroups = (set.workout_exercises as any)?.exercises?.muscle_groups as MuscleGroup[] || [];
      const volume = (set.weight_kg || 0) * (set.reps || 0);

      muscleGroups.forEach(mg => {
        const existing = groups.get(mg) || { sets: 0, volume: 0 };
        groups.set(mg, {
          sets: existing.sets + 1,
          volume: existing.volume + volume,
        });
      });
    });

    const totalSets = Array.from(groups.values()).reduce((acc, g) => acc + g.sets, 0);

    return Array.from(groups.entries())
      .map(([muscleGroup, data]) => ({
        muscleGroup,
        label: MUSCLE_GROUP_LABELS[muscleGroup],
        sets: data.sets,
        volume: data.volume,
        percentage: totalSets > 0 ? (data.sets / totalSets) * 100 : 0,
        color: MUSCLE_GROUP_COLORS[muscleGroup],
      }))
      .sort((a, b) => b.sets - a.sets);
  }, [setsData]);

  const trends = useMemo(() => {
    if (weeklyData.length < 2) {
      return { workouts: 0, tonnage: 0, duration: 0 };
    }

    const thisWeek = weeklyData[weeklyData.length - 1];
    const lastWeek = weeklyData[weeklyData.length - 2];

    const calcTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      workouts: calcTrend(thisWeek.workouts, lastWeek.workouts),
      tonnage: calcTrend(thisWeek.tonnage, lastWeek.tonnage),
      duration: calcTrend(thisWeek.duration, lastWeek.duration),
    };
  }, [weeklyData]);

  return {
    overviewStats,
    weeklyData,
    muscleGroupData,
    trends,
    isLoading: workoutsLoading || setsLoading,
  };
}
