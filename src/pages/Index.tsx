import { useState, useEffect } from 'react';
import { Play, Dumbbell, TrendingUp, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthForm } from '@/components/auth/AuthForm';
import { ActiveWorkout } from '@/components/workout/ActiveWorkout';
import { WorkoutTypeSelector } from '@/components/workout/WorkoutTypeSelector';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useWorkout } from '@/hooks/useWorkout';
import { WorkoutType, WORKOUT_TYPE_LABELS } from '@/types/workout';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

const Index = () => {
  const { user, profile, isLoading: authLoading } = useAuth();
  const { activeWorkout, startWorkout, isLoading: workoutLoading } = useWorkout();
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);
  const [stats, setStats] = useState({ thisWeek: 0, totalSets: 0, avgDuration: 0 });

  // Fetch recent workouts and stats
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch recent completed workouts
      const { data: workouts } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', false)
        .order('started_at', { ascending: false })
        .limit(5);

      if (workouts) {
        setRecentWorkouts(workouts);
      }

      // Calculate this week's workouts
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
      startOfWeek.setHours(0, 0, 0, 0);

      const { count: weekCount } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_active', false)
        .gte('started_at', startOfWeek.toISOString());

      // Calculate total sets this week
      const { data: weekWorkouts } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', false)
        .gte('started_at', startOfWeek.toISOString());

      let totalSets = 0;
      if (weekWorkouts && weekWorkouts.length > 0) {
        const workoutIds = weekWorkouts.map(w => w.id);
        const { data: exercises } = await supabase
          .from('workout_exercises')
          .select('id')
          .in('workout_session_id', workoutIds);

        if (exercises && exercises.length > 0) {
          const exerciseIds = exercises.map(e => e.id);
          const { count } = await supabase
            .from('exercise_sets')
            .select('*', { count: 'exact', head: true })
            .in('workout_exercise_id', exerciseIds);
          totalSets = count || 0;
        }
      }

      // Calculate average duration
      const completedWorkouts = workouts?.filter(w => w.duration_seconds) || [];
      const avgDuration = completedWorkouts.length > 0
        ? Math.round(completedWorkouts.reduce((acc, w) => acc + (w.duration_seconds || 0), 0) / completedWorkouts.length / 60)
        : 0;

      setStats({
        thisWeek: weekCount || 0,
        totalSets,
        avgDuration
      });
    };

    fetchData();
  }, [user]);

  const handleStartWorkout = (type: WorkoutType, customName?: string) => {
    startWorkout(type, customName);
    setShowTypeSelector(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins % 60}min`;
    }
    return `${mins}min`;
  };

  // Show loading state
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

  // Show auth form if not logged in
  if (!user) {
    return <AuthForm />;
  }

  // Show active workout if one exists
  if (activeWorkout) {
    return <ActiveWorkout />;
  }

  // Show home screen
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <span className="font-heading text-xl font-bold">Gym Tracker</span>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Hero Greeting */}
        <div className="w-full text-center py-6">
          <h1 className="font-display text-4xl md:text-5xl font-black leading-tight">
            Tjena, {profile?.first_name || 'du'}! 👋
            <span className="block mt-2">Redo att slakta gymmet idag?</span>
          </h1>
        </div>

        {/* Start Workout Button */}
        <Button
          size="lg"
          className="w-full h-16 text-lg font-semibold touch-target"
          onClick={() => setShowTypeSelector(true)}
          disabled={workoutLoading}
        >
          <Play className="mr-3 h-6 w-6" />
          Starta nytt pass
        </Button>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <Calendar className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats.thisWeek}</p>
              <p className="text-xs text-muted-foreground">Pass denna vecka</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats.totalSets}</p>
              <p className="text-xs text-muted-foreground">Set denna vecka</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <Clock className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats.avgDuration}</p>
              <p className="text-xs text-muted-foreground">Min snitt/pass</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Workouts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Senaste pass</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentWorkouts.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">
                Inga tidigare pass ännu. Starta ditt första pass!
              </p>
            ) : (
              recentWorkouts.map((workout) => (
                <div
                  key={workout.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
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
                  {workout.rating && (
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={i < workout.rating ? 'text-yellow-500' : 'text-muted-foreground/30'}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>

      {/* Workout Type Selector Sheet */}
      <WorkoutTypeSelector
        open={showTypeSelector}
        onOpenChange={setShowTypeSelector}
        onSelect={handleStartWorkout}
      />

      <BottomNav />
    </div>
  );
};

export default Index;
