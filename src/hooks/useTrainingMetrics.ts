import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  startOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  differenceInCalendarWeeks,
  isSameWeek,
} from 'date-fns';

export interface Badge {
  key: string;
  label: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface TrainingMetrics {
  workoutsLast28Days: number;
  workoutsThisWeek: number;
  weeklyGoal: number;
  weeklyProgress: number; // 0..1
  currentWeekStreak: number;
  longestWeekStreak: number;
  totalWorkouts: number;
  badges: Badge[];
  newlyUnlocked: Badge[];
  isLoading: boolean;
}

const BADGE_DEFS: Array<{
  key: string;
  label: string;
  description: string;
  test: (ctx: { total: number; streak: number; week: number; goal: number }) => boolean;
}> = [
  { key: 'first_workout', label: 'Första passet', description: 'Du loggade ditt allra första pass', test: (c) => c.total >= 1 },
  { key: 'ten_workouts', label: '10 pass', description: '10 färdiga pass', test: (c) => c.total >= 10 },
  { key: 'fifty_workouts', label: '50 pass', description: '50 färdiga pass', test: (c) => c.total >= 50 },
  { key: 'hundred_workouts', label: '100 pass', description: '100 färdiga pass', test: (c) => c.total >= 100 },
  { key: 'streak_2', label: '2 veckor i rad', description: 'Klarade veckomålet 2 veckor i rad', test: (c) => c.streak >= 2 },
  { key: 'streak_4', label: '4 veckor i rad', description: 'En hel månads streak', test: (c) => c.streak >= 4 },
  { key: 'streak_12', label: '12 veckor i rad', description: 'Ett kvartal utan miss', test: (c) => c.streak >= 12 },
  { key: 'weekly_goal', label: 'Veckomål klart', description: 'Du nådde veckans mål', test: (c) => c.goal > 0 && c.week >= c.goal },
];

const SEEN_KEY = 'gym-tracker-seen-badges';

function getSeenBadges(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markBadgesSeen(keys: string[]) {
  try {
    const seen = new Set(getSeenBadges());
    keys.forEach((k) => seen.add(k));
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  } catch {
    // ignore
  }
}

export function useTrainingMetrics(): TrainingMetrics {
  const { user, profile } = useAuth();
  const weeklyGoal = (profile as any)?.weekly_goal ?? 3;

  const { data, isLoading } = useQuery({
    queryKey: ['training-metrics', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = subDays(startOfDay(new Date()), 120); // 120 days for streak calc
      const { data: sessions, error } = await supabase
        .from('workout_sessions')
        .select('id, started_at')
        .eq('user_id', user!.id)
        .eq('is_active', false)
        .gte('started_at', since.toISOString())
        .order('started_at', { ascending: false });

      if (error) throw error;

      const { count: totalCount } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('is_active', false);

      return { sessions: sessions ?? [], total: totalCount ?? 0 };
    },
  });

  const sessions = data?.sessions ?? [];
  const total = data?.total ?? 0;
  const now = new Date();

  // 28 day count
  const cutoff28 = subDays(startOfDay(now), 28);
  const workoutsLast28Days = sessions.filter((s) => new Date(s.started_at) >= cutoff28).length;

  // This week (Mon start)
  const wkStart = startOfWeek(now, { weekStartsOn: 1 });
  const wkEnd = endOfWeek(now, { weekStartsOn: 1 });
  const workoutsThisWeek = sessions.filter((s) => {
    const d = new Date(s.started_at);
    return d >= wkStart && d <= wkEnd;
  }).length;

  // Streak: count consecutive weeks (back from this week) where goal was met.
  // Current week counts even if not yet met (grace) — only break streak on a *fully past* week that missed.
  let currentWeekStreak = 0;
  if (weeklyGoal > 0 && sessions.length > 0) {
    // Bucket sessions by week-start
    const buckets = new Map<number, number>();
    for (const s of sessions) {
      const d = new Date(s.started_at);
      const wk = startOfWeek(d, { weekStartsOn: 1 }).getTime();
      buckets.set(wk, (buckets.get(wk) ?? 0) + 1);
    }
    // Walk back from current week
    let cursor = wkStart;
    let i = 0;
    while (i < 52) {
      const count = buckets.get(cursor.getTime()) ?? 0;
      const isCurrent = isSameWeek(cursor, now, { weekStartsOn: 1 });
      if (count >= weeklyGoal) {
        currentWeekStreak += 1;
      } else if (isCurrent) {
        // current week not yet complete: don't count, but don't break either
      } else {
        break;
      }
      cursor = subDays(cursor, 7);
      i += 1;
    }
  }

  // Longest streak (over loaded window — good enough for last ~17 weeks)
  let longestWeekStreak = 0;
  if (weeklyGoal > 0 && sessions.length > 0) {
    const buckets = new Map<number, number>();
    for (const s of sessions) {
      const d = new Date(s.started_at);
      const wk = startOfWeek(d, { weekStartsOn: 1 }).getTime();
      buckets.set(wk, (buckets.get(wk) ?? 0) + 1);
    }
    const sortedWeeks = [...buckets.keys()].sort((a, b) => a - b);
    let run = 0;
    let prevWeek: number | null = null;
    for (const wk of sortedWeeks) {
      if ((buckets.get(wk) ?? 0) >= weeklyGoal) {
        if (prevWeek === null || wk - prevWeek === 7 * 86400_000) {
          run += 1;
        } else {
          run = 1;
        }
        prevWeek = wk;
      } else {
        run = 0;
        prevWeek = null;
      }
      if (run > longestWeekStreak) longestWeekStreak = run;
    }
  }

  const ctx = { total, streak: currentWeekStreak, week: workoutsThisWeek, goal: weeklyGoal };
  const seen = getSeenBadges();
  const badges: Badge[] = BADGE_DEFS.map((b) => ({
    key: b.key,
    label: b.label,
    description: b.description,
    unlocked: b.test(ctx),
  }));
  const newlyUnlocked = badges.filter((b) => b.unlocked && !seen.includes(b.key));

  const weeklyProgress = weeklyGoal > 0 ? Math.min(workoutsThisWeek / weeklyGoal, 1) : 0;

  return {
    workoutsLast28Days,
    workoutsThisWeek,
    weeklyGoal,
    weeklyProgress,
    currentWeekStreak,
    longestWeekStreak,
    totalWorkouts: total,
    badges,
    newlyUnlocked,
    isLoading,
  };
}
