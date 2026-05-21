import { useState, useEffect, useMemo } from 'react';
import { Play, Dumbbell, Flame, Trophy, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthForm } from '@/components/auth/AuthForm';
import { WorkoutTypeSelector } from '@/components/workout/WorkoutTypeSelector';
import { BottomNav } from '@/components/layout/BottomNav';
import { WorkoutDetailSheet } from '@/components/history/WorkoutDetailSheet';
import { useAuth } from '@/hooks/useAuth';
import { useWorkout } from '@/hooks/useWorkout';
import { useWorkoutHistory, WorkoutWithDetails } from '@/hooks/useWorkoutHistory';
import { useTrainingMetrics, markBadgesSeen } from '@/hooks/useTrainingMetrics';
import { WorkoutType, WORKOUT_TYPE_LABELS } from '@/types/workout';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import hausLogo from '@/assets/haus-logo.png';
import { SuggestedWorkoutCard } from '@/components/home/SuggestedWorkoutCard';

const Index = () => {
  const { user, profile, isLoading: authLoading } = useAuth();
  const { startWorkout, isLoading: workoutLoading } = useWorkout();
  const { workouts: fullWorkouts } = useWorkoutHistory();
  const metrics = useTrainingMetrics();
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutWithDetails | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);

  // Fetch recent completed workouts (separate from metrics)
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', false)
        .order('started_at', { ascending: false })
        .limit(5);
      if (data) setRecentWorkouts(data);
    })();
  }, [user]);

  // Surface newly unlocked badges as a toast (once)
  useEffect(() => {
    if (metrics.newlyUnlocked.length === 0) return;
    const keys = metrics.newlyUnlocked.map((b) => b.key);
    metrics.newlyUnlocked.slice(0, 2).forEach((b) => {
      toast(`🏆 ${b.label}`, { description: b.description });
    });
    markBadgesSeen(keys);
  }, [metrics.newlyUnlocked]);

  const handleStartWorkout = (type: WorkoutType, customName?: string) => {
    startWorkout(type, customName);
    setShowTypeSelector(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}min`;
    return `${mins}min`;
  };

  const handleWorkoutClick = (workoutId: string) => {
    const fullWorkout = fullWorkouts.find((w) => w.id === workoutId);
    if (fullWorkout) {
      setSelectedWorkout(fullWorkout);
      setDetailOpen(true);
    }
  };

  // Loading
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Dumbbell className="h-12 w-12 text-primary animate-pulse" />
          <p className="text-muted-foreground">Laddar...</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthForm />;

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="ios-nav-bar">
        <div className="flex items-center justify-center">
          <img src={hausLogo} alt="Haus" className="h-7 dark:invert" />
        </div>
      </header>

      <main className="px-5 py-6 space-y-7">
        {/* Hero greeting */}
        <div className="w-full text-center py-4">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
            Tjena, {profile?.first_name || 'du'}! 👋
            <span className="block mt-3">Redo att slakta gymmet idag?</span>
          </h1>
        </div>

        {/* Start workout */}
        <Button
          variant="pill"
          size="lg"
          className="w-full h-14 text-lg font-semibold touch-target press-feedback transition-all duration-200 hover:shadow-ios-lg"
          onClick={() => setShowTypeSelector(true)}
          disabled={workoutLoading}
        >
          <Play className="mr-3 h-6 w-6" aria-hidden="true" />
          Starta nytt pass
        </Button>

        {/* Adaptive suggestion based on recovery */}
        <SuggestedWorkoutCard onStart={(type) => handleStartWorkout(type)} />

        {/* North Star card: progress ring + 28 day count + streak */}
        <Card className="overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-5">
              <ProgressRing
                progress={metrics.weeklyProgress}
                label={`${metrics.workoutsThisWeek}/${metrics.weeklyGoal}`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  Veckomål
                </p>
                <p className="text-base font-semibold mt-0.5">
                  {metrics.workoutsThisWeek >= metrics.weeklyGoal
                    ? '🎯 Veckomålet är klart'
                    : `${Math.max(0, metrics.weeklyGoal - metrics.workoutsThisWeek)} pass kvar`}
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1.5">
                    <Flame
                      className={cn(
                        'h-4 w-4',
                        metrics.currentWeekStreak > 0 ? 'text-warning' : 'text-muted-foreground/50'
                      )}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-semibold tabular-nums">
                      {metrics.currentWeekStreak}
                    </span>
                    <span className="text-xs text-muted-foreground">v streak</span>
                  </div>
                  <div className="h-3 w-px bg-border" aria-hidden="true" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold tabular-nums">
                      {metrics.workoutsLast28Days}
                    </span>
                    <span className="text-xs text-muted-foreground">pass / 28 d</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badges row */}
        {metrics.badges.some((b) => b.unlocked) && (
          <div>
            <div className="flex items-center gap-2 mb-3 px-1">
              <Trophy className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                Milstolpar
              </p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {metrics.badges
                .filter((b) => b.unlocked)
                .map((b) => (
                  <div
                    key={b.key}
                    className="shrink-0 px-3 py-2 rounded-full bg-primary/15 text-foreground/85 text-xs font-medium"
                    title={b.description}
                  >
                    🏆 {b.label}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Recent workouts */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Senaste pass</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentWorkouts.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">
                Inga tidigare pass ännu. Starta ditt första pass!
              </p>
            ) : (
              recentWorkouts.map((workout) => (
                <button
                  key={workout.id}
                  onClick={() => handleWorkoutClick(workout.id)}
                  className="flex items-center justify-between p-4 rounded-ios-lg bg-muted/50 w-full text-left hover:bg-muted/70 transition-colors"
                >
                  <div>
                    <p className="font-medium">
                      {workout.custom_type_name || WORKOUT_TYPE_LABELS[workout.workout_type as WorkoutType]}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(workout.started_at), 'd MMM', { locale: sv })}
                      {workout.duration_seconds && ` · ${formatDuration(workout.duration_seconds)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {workout.rating && (
                      <div className="flex items-center gap-0.5" aria-label={`Betyg ${workout.rating} av 5`}>
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            aria-hidden="true"
                            className={i < workout.rating ? 'text-yellow-500' : 'text-muted-foreground/30'}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </main>

      <WorkoutTypeSelector
        open={showTypeSelector}
        onOpenChange={setShowTypeSelector}
        onSelect={handleStartWorkout}
      />
      <WorkoutDetailSheet
        workout={selectedWorkout}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
      <BottomNav />
    </div>
  );
};

/** SVG progress ring used for the weekly goal */
function ProgressRing({ progress, label }: { progress: number; label: string }) {
  const size = 76;
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(progress, 0), 1));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="text-muted/60"
          stroke="currentColor"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary transition-[stroke-dashoffset] duration-700 ease-out"
          stroke="currentColor"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold tabular-nums">{label}</span>
      </div>
    </div>
  );
}

export default Index;
