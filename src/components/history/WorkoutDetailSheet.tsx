import { useState } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';
import { WorkoutWithDetails } from '@/hooks/useWorkoutHistory';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { WORKOUT_TYPE_LABELS, MUSCLE_GROUP_LABELS, WorkoutType } from '@/types/workout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Dumbbell, Star, Calendar, MessageSquare, Flame, Route, Pencil, Check, X, BookmarkPlus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DurationInput } from '@/components/ui/duration-input';
import { useUpdateWorkout } from '@/hooks/useUpdateWorkout';
import { SaveAsRoutineSheet } from './SaveAsRoutineSheet';

interface WorkoutDetailSheetProps {
  workout: WorkoutWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function WorkoutDetailSheet({ workout, open, onOpenChange }: WorkoutDetailSheetProps) {
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [editedDuration, setEditedDuration] = useState(workout?.duration_seconds || 0);
  const [saveAsRoutineOpen, setSaveAsRoutineOpen] = useState(false);
  const { updateWorkout } = useUpdateWorkout();

  if (!workout) return null;
  
  const hasNonCardioExercises = workout.exercises.some(e => !e.is_cardio);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const handleStartEdit = () => {
    setEditedDuration(workout.duration_seconds || 0);
    setIsEditingDuration(true);
  };

  const handleCancelEdit = () => {
    setIsEditingDuration(false);
    setEditedDuration(workout.duration_seconds || 0);
  };

  const handleSaveDuration = () => {
    updateWorkout.mutate({ 
      workoutId: workout.id, 
      data: { duration_seconds: editedDuration } 
    });
    setIsEditingDuration(false);
  };

  const formatCardioDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-left pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <DrawerTitle className="flex items-center gap-2">
                <Badge 
                  variant="secondary" 
                  className={cn(
                    'text-white border-0',
                    WORKOUT_TYPE_COLORS[workout.workout_type]
                  )}
                >
                  {workout.custom_type_name || WORKOUT_TYPE_LABELS[workout.workout_type]}
                </Badge>
              </DrawerTitle>
              <DrawerDescription className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(workout.started_at), 'EEEE d MMMM yyyy', { locale: sv })}
              </DrawerDescription>
            </div>

            {workout.rating && (
              <div className="flex items-center gap-1 text-yellow-500">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'h-4 w-4',
                      star <= workout.rating! ? 'fill-current' : 'opacity-30'
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            {isEditingDuration ? (
              <div className="flex items-center gap-2">
                <DurationInput 
                  value={editedDuration} 
                  onChange={setEditedDuration}
                />
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8"
                  onClick={handleSaveDuration}
                  disabled={updateWorkout.isPending}
                >
                  <Check className="h-4 w-4 text-primary" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8"
                  onClick={handleCancelEdit}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button 
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                onClick={handleStartEdit}
              >
                <Clock className="h-4 w-4" />
                {formatDuration(workout.duration_seconds)}
                <Pencil className="h-3 w-3 opacity-50" />
              </button>
            )}
            <span className="flex items-center gap-1.5">
              <Dumbbell className="h-4 w-4" />
              {workout.exercises.length} övningar
            </span>
          </div>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4 pb-8">
          <div className="space-y-4">
            {/* Exercises */}
            {workout.exercises.map((exercise, index) => (
              <div 
                key={exercise.id}
                className="p-4 rounded-xl bg-accent/30 border border-border/50"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h4 className="font-medium">{exercise.exercise_name}</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {exercise.muscle_groups.map((mg) => (
                        <span 
                          key={mg} 
                          className="text-xs text-muted-foreground"
                        >
                          {MUSCLE_GROUP_LABELS[mg]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">#{index + 1}</span>
                </div>

                {/* Cardio log */}
                {exercise.is_cardio && exercise.cardio_log && (
                  <div className="flex flex-wrap gap-3 text-sm">
                    {exercise.cardio_log.duration_seconds && (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {formatCardioDuration(exercise.cardio_log.duration_seconds)}
                      </span>
                    )}
                    {exercise.cardio_log.distance_km && (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Route className="h-3.5 w-3.5" />
                        {exercise.cardio_log.distance_km} km
                      </span>
                    )}
                    {exercise.cardio_log.calories && (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Flame className="h-3.5 w-3.5" />
                        {exercise.cardio_log.calories} kcal
                      </span>
                    )}
                  </div>
                )}

                {/* Sets */}
                {!exercise.is_cardio && exercise.sets.length > 0 && (
                  <div className="space-y-1.5">
                    {exercise.sets.map((set) => (
                      <div 
                        key={set.id}
                        className={cn(
                          'flex items-center gap-3 text-sm',
                          set.is_warmup && 'text-muted-foreground'
                        )}
                      >
                        <span className="w-6 text-muted-foreground">
                          {set.is_warmup ? 'W' : set.set_number}
                        </span>
                        <span className="flex-1">
                          {set.is_bodyweight ? (
                            <span className="text-muted-foreground">Kroppsvikt</span>
                          ) : (
                            <span>{set.weight_kg ?? '-'} kg</span>
                          )}
                        </span>
                        <span className="font-medium">
                          {set.reps ?? '-'} reps
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Notes */}
            {workout.notes && (
              <div className="p-4 rounded-xl bg-accent/30 border border-border/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Anteckningar</span>
                </div>
                <p className="text-sm">{workout.notes}</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer with Save as Template button */}
        {hasNonCardioExercises && (
          <DrawerFooter className="border-t border-border pt-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setSaveAsRoutineOpen(true)}
            >
              <BookmarkPlus className="h-4 w-4 mr-2" />
              Spara som mall
            </Button>
          </DrawerFooter>
        )}
      </DrawerContent>

      {/* Save as Routine Sheet */}
      <SaveAsRoutineSheet
        workout={workout}
        open={saveAsRoutineOpen}
        onOpenChange={setSaveAsRoutineOpen}
      />
    </Drawer>
  );
}
