import { WorkoutWithDetails } from '@/hooks/useWorkoutHistory';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { WORKOUT_TYPE_LABELS, WorkoutType } from '@/types/workout';
import { Badge } from '@/components/ui/badge';
import { Clock, Dumbbell, Star, Calendar } from 'lucide-react';

interface WorkoutHistoryListProps {
  workouts: WorkoutWithDetails[];
  onWorkoutSelect: (workout: WorkoutWithDetails) => void;
}

const WORKOUT_TYPE_COLORS: Record<WorkoutType, string> = {
  push: 'bg-blue-500',
  pull: 'bg-green-500',
  legs: 'bg-orange-500',
  full_body: 'bg-purple-500',
  cardio: 'bg-red-500',
  upper: 'bg-cyan-500',
  lower: 'bg-yellow-500',
  custom: 'bg-muted-foreground',
};

export function WorkoutHistoryList({ workouts, onWorkoutSelect }: WorkoutHistoryListProps) {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">Inga pass hittades</p>
        <p className="text-sm text-muted-foreground/70">
          Dina avslutade pass kommer visas här
        </p>
      </div>
    );
  }

  // Group workouts by month
  const workoutsByMonth = workouts.reduce((acc, workout) => {
    const monthKey = format(new Date(workout.started_at), 'MMMM yyyy', { locale: sv });
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(workout);
    return acc;
  }, {} as Record<string, WorkoutWithDetails[]>);

  return (
    <div className="space-y-6">
      {Object.entries(workoutsByMonth).map(([month, monthWorkouts]) => (
        <div key={month} className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground capitalize sticky top-0 bg-background py-2">
            {month}
          </h3>

          <div className="space-y-3">
            {monthWorkouts.map((workout) => (
              <button
                key={workout.id}
                onClick={() => onWorkoutSelect(workout)}
                className="w-full p-4 rounded-2xl bg-card border border-border/50 shadow-ios text-left transition-all hover:bg-accent/50 active:scale-[0.98]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          'text-white border-0',
                          WORKOUT_TYPE_COLORS[workout.workout_type]
                        )}
                      >
                        {workout.custom_type_name || WORKOUT_TYPE_LABELS[workout.workout_type]}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(workout.started_at), 'EEEE d MMM', { locale: sv })}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDuration(workout.duration_seconds)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Dumbbell className="h-3.5 w-3.5" />
                        {workout.exercises.length} övningar
                      </span>
                    </div>

                    {/* Exercise preview */}
                    <p className="text-xs text-muted-foreground/70 line-clamp-1">
                      {workout.exercises.slice(0, 3).map(e => e.exercise_name).join(', ')}
                      {workout.exercises.length > 3 && ` +${workout.exercises.length - 3}`}
                    </p>
                  </div>

                  {workout.rating && (
                    <div className="flex items-center gap-0.5 text-yellow-500 shrink-0">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm font-medium">{workout.rating}</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
