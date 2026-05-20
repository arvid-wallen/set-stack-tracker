import { Dumbbell, ChevronUp, WifiOff, Pause } from 'lucide-react';
import { WorkoutTimer } from './WorkoutTimer';
import { useWorkout } from '@/hooks/useWorkout';
import { WORKOUT_TYPE_LABELS } from '@/types/workout';
import { cn } from '@/lib/utils';

export function WorkoutMiniBar() {
  const { activeWorkout, isMinimized, expandWorkout, isOnline, isPaused, pausedAt, totalPausedMs } = useWorkout();

  if (!activeWorkout || !isMinimized) {
    return null;
  }

  const workoutName = activeWorkout.custom_type_name || WORKOUT_TYPE_LABELS[activeWorkout.workout_type];

  return (
    <button
      onClick={expandWorkout}
      className={cn(
        "fixed left-4 right-4 z-40 animate-slide-in-bottom",
        "bottom-[calc(80px+env(safe-area-inset-bottom))]",
        "h-14 px-4",
        "flex items-center justify-between gap-3",
        "rounded-full",
        "bg-card/80 backdrop-blur-xl",
        "border border-border/50",
        "shadow-lg shadow-black/10",
        "transition-all duration-300 ease-out",
        "hover:bg-card/90 active:scale-[0.98]"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
          <Dumbbell className="h-4 w-4 text-primary" />
        </div>
        <span className="font-medium text-sm truncate">
          {workoutName}
        </span>
        {isPaused && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Pause className="h-3 w-3" /> Pausad
          </span>
        )}
        {!isOnline && (
          <WifiOff className="h-3.5 w-3.5 text-warning flex-shrink-0" />
        )}
      </div>

      <div className="flex items-center gap-3">
        <WorkoutTimer
          startedAt={activeWorkout.started_at}
          isPaused={isPaused}
          pausedAt={pausedAt}
          totalPausedMs={totalPausedMs}
          className="text-sm font-mono text-muted-foreground"
        />
        <ChevronUp className="h-5 w-5 text-muted-foreground" />
      </div>
    </button>
  );
}
