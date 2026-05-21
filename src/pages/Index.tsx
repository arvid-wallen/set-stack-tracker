import { useState, useEffect, useMemo } from 'react';
import { Play, Dumbbell, Flame, Trophy, ChevronRight, MoreHorizontal, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AuthForm } from '@/components/auth/AuthForm';
import { WorkoutTypeSelector } from '@/components/workout/WorkoutTypeSelector';
import { BottomNav } from '@/components/layout/BottomNav';
import { WorkoutDetailSheet } from '@/components/history/WorkoutDetailSheet';
import { useAuth } from '@/hooks/useAuth';
import { useWorkout } from '@/hooks/useWorkout';
import { useWorkoutHistory, WorkoutWithDetails } from '@/hooks/useWorkoutHistory';
import { useTrainingMetrics, markBadgesSeen } from '@/hooks/useTrainingMetrics';
import { useProfile } from '@/hooks/useProfile';
import { WorkoutType, WORKOUT_TYPE_LABELS } from '@/types/workout';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import hausLogo from '@/assets/haus-logo.png';
import { SuggestedWorkoutCard } from '@/components/home/SuggestedWorkoutCard';
import { GoalEditorSheet, GoalView } from '@/components/home/GoalEditorSheet';

const Index = () => {
  const { user, profile, isLoading: authLoading } = useAuth();
  const { startWorkout, isLoading: workoutLoading } = useWorkout();
  const { workouts: fullWorkouts } = useWorkoutHistory();
  const metrics = useTrainingMetrics();
  const { updateProfile, isSaving: profileSaving } = useProfile(user?.id);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutWithDetails | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);
  const [goalView, setGoalView] = useState<GoalView>(() => {
    if (typeof window === 'undefined') return 'week';
    return (localStorage.getItem('goal-card-view') as GoalView) || 'week';
  });
  const [goalEditorOpen, setGoalEditorOpen] = useState(false);
  const [goalEditorTab, setGoalEditorTab] = useState<GoalView>('week');

  useEffect(() => {
    try { localStorage.setItem('goal-card-view', goalView); } catch {}
  }, [goalView]);

  const toggleGoalView = () => setGoalView((v) => (v === 'week' ? 'month' : 'week'));
  const openGoalEditor = (tab: GoalView) => {
    setGoalEditorTab(tab);
    setGoalEditorOpen(true);
  };

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

        {/* North Star card: tap to toggle week/month, ⋯ to edit */}
        {(() => {
          const isMonth = goalView === 'month';
          const current = isMonth ? metrics.workoutsThisMonth : metrics.workoutsThisWeek;
          const goal = isMonth ? metrics.monthlyGoal : metrics.weeklyGoal;
          const progress = isMonth ? metrics.monthlyProgress : metrics.weeklyProgress;
          const breakdown = isMonth ? metrics.breakdownThisMonth : metrics.breakdownThisWeek;
          const comp = metrics.goalComposition;
          const hasComp = (comp.strength + comp.cardio) > 0;
          const remaining = Math.max(0, goal - current);

          return (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative">
                  <button
                    type="button"
                    onClick={toggleGoalView}
                    aria-label="Byt mellan vecko- och månadsmål"
                    className="w-full text-left p-5 press-feedback hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-5">
                      <ProgressRing
                        progress={progress}
                        label={`${current}/${goal}`}
                      />
                      <div className="flex-1 min-w-0 pr-10">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                          {isMonth ? 'Månadsmål' : 'Veckomål'}
                        </p>
                        <p className="text-base font-semibold mt-0.5">
                          {current >= goal
                            ? isMonth ? '🎯 Månadsmålet är klart' : '🎯 Veckomålet är klart'
                            : `${remaining} pass kvar`}
                        </p>
                        <div className="flex items-center gap-3 mt-3 flex-wrap">
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
                        {hasComp && (
                          <div className="flex items-center gap-3 mt-3 text-xs flex-wrap">
                            {comp.strength > 0 && (
                              <div className="flex items-center gap-1.5">
                                <Dumbbell className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                                <span className="font-medium tabular-nums">
                                  {breakdown.strength}/{comp.strength}
                                </span>
                                <span className="text-muted-foreground">styrka</span>
                              </div>
                            )}
                            {comp.cardio > 0 && (
                              <div className="flex items-center gap-1.5">
                                <Heart className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                                <span className="font-medium tabular-nums">
                                  {breakdown.cardio}/{comp.cardio}
                                </span>
                                <span className="text-muted-foreground">kondition</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>

                  <div className="absolute top-3 right-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          aria-label="Redigera mål"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openGoalEditor('week')}>
                          Redigera veckomål
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openGoalEditor('month')}>
                          Redigera månadsmål
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openGoalEditor(goalView)}>
                          Sätt sammansättning
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

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
      <GoalEditorSheet
        open={goalEditorOpen}
        onOpenChange={setGoalEditorOpen}
        initialTab={goalEditorTab}
        weeklyGoal={metrics.weeklyGoal}
        monthlyGoal={metrics.monthlyGoal}
        composition={metrics.goalComposition}
        isSaving={profileSaving}
        onSave={async (data) => {
          const ok = await updateProfile(data);
          if (ok) {
            // refresh metrics so new goals reflect immediately
            // useTrainingMetrics keys off user.id; profile state changes will re-render with new goals
          }
          return ok;
        }}
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
