import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { WorkoutWithDetails } from '@/hooks/useWorkoutHistory';
import { format, isSameDay } from 'date-fns';
import { sv } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { WORKOUT_TYPE_LABELS, WorkoutType } from '@/types/workout';
import { Badge } from '@/components/ui/badge';
import { Clock, Dumbbell, Star } from 'lucide-react';

interface WorkoutCalendarProps {
  workoutDates: Date[];
  workoutsByDate: Map<string, WorkoutWithDetails[]>;
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

export function WorkoutCalendar({ workoutDates, workoutsByDate, onWorkoutSelect }: WorkoutCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const selectedDateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const selectedWorkouts = selectedDateKey ? workoutsByDate.get(selectedDateKey) || [] : [];

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  return (
    <div className="space-y-4">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={setSelectedDate}
        locale={sv}
        className="rounded-xl border border-border bg-card p-4 pointer-events-auto"
        modifiers={{
          workout: workoutDates,
        }}
        modifiersStyles={{
          workout: {
            position: 'relative',
          },
        }}
        components={{
          DayContent: ({ date }) => {
            const dateKey = format(date, 'yyyy-MM-dd');
            const dayWorkouts = workoutsByDate.get(dateKey);
            const hasWorkouts = dayWorkouts && dayWorkouts.length > 0;

            return (
              <div className="relative flex flex-col items-center">
                <span>{date.getDate()}</span>
                {hasWorkouts && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayWorkouts.slice(0, 3).map((workout, i) => (
                      <div
                        key={i}
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          WORKOUT_TYPE_COLORS[workout.workout_type]
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          },
        }}
      />

      {/* Selected day workouts */}
      {selectedDate && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            {format(selectedDate, 'd MMMM yyyy', { locale: sv })}
          </h3>

          {selectedWorkouts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Inget pass denna dag
            </p>
          ) : (
            <div className="space-y-2">
              {selectedWorkouts.map((workout) => (
                <button
                  key={workout.id}
                  onClick={() => onWorkoutSelect(workout)}
                  className="w-full p-4 rounded-xl bg-card border border-border text-left transition-colors hover:bg-accent/50 active:scale-[0.98]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            'text-white border-0',
                            WORKOUT_TYPE_COLORS[workout.workout_type]
                          )}
                        >
                          {workout.custom_type_name || WORKOUT_TYPE_LABELS[workout.workout_type]}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDuration(workout.duration_seconds)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Dumbbell className="h-3.5 w-3.5" />
                          {workout.exercises.length} övningar
                        </span>
                      </div>
                    </div>

                    {workout.rating && (
                      <div className="flex items-center gap-0.5 text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-medium">{workout.rating}</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
