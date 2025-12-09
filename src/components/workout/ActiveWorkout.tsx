import { useState, useMemo } from 'react';
import { X, Clock, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WorkoutTimer } from './WorkoutTimer';
import { RestTimer } from './RestTimer';
import { ExerciseCard } from './ExerciseCard';
import { ExerciseSearch } from './ExerciseSearch';
import { EndWorkoutSheet } from './EndWorkoutSheet';
import { WorkoutSession, WorkoutExercise, WORKOUT_TYPE_LABELS, Exercise } from '@/types/workout';
import { cn } from '@/lib/utils';

interface ActiveWorkoutProps {
  workout: WorkoutSession;
  exercises: WorkoutExercise[];
  onAddExercise: (exerciseId: string) => Promise<WorkoutExercise | null>;
  onRemoveExercise: (workoutExerciseId: string) => void;
  onAddSet: (workoutExerciseId: string, data: any) => void;
  onDeleteSet: (setId: string, workoutExerciseId: string) => void;
  onEndWorkout: (rating?: number, notes?: string) => void;
}

export function ActiveWorkout({
  workout,
  exercises,
  onAddExercise,
  onRemoveExercise,
  onAddSet,
  onDeleteSet,
  onEndWorkout,
}: ActiveWorkoutProps) {
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showEndSheet, setShowEndSheet] = useState(false);

  const totalSets = useMemo(() => {
    return exercises.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0);
  }, [exercises]);

  const handleExerciseSelect = async (exercise: Exercise) => {
    await onAddExercise(exercise.id);
  };

  const formatDuration = () => {
    const start = new Date(workout.started_at);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col safe-top safe-bottom">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowEndSheet(true)}
          >
            <X className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-heading font-semibold">
              {workout.custom_type_name || WORKOUT_TYPE_LABELS[workout.workout_type]}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <WorkoutTimer startedAt={workout.started_at} className="text-sm !text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono">
            {totalSets} set
          </Badge>
        </div>
      </header>

      {/* Exercise list */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 pb-32">
          {exercises.length === 0 ? (
            <div className="text-center py-12">
              <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg mb-2">Lägg till din första övning</h3>
              <p className="text-muted-foreground text-sm">
                Tryck på knappen nedan för att komma igång
              </p>
            </div>
          ) : (
            exercises.map((workoutExercise) => (
              <ExerciseCard
                key={workoutExercise.id}
                workoutExercise={workoutExercise}
                onAddSet={(data) => onAddSet(workoutExercise.id, data)}
                onDeleteSet={(setId) => onDeleteSet(setId, workoutExercise.id)}
                onRemoveExercise={() => onRemoveExercise(workoutExercise.id)}
                onStartRest={() => setShowRestTimer(true)}
                supersetBadge={workoutExercise.superset_group || undefined}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t border-border safe-bottom">
        <div className="flex gap-3">
          <ExerciseSearch 
            onSelect={handleExerciseSelect}
            trigger={
              <Button className="flex-1 h-14 text-base">
                <Dumbbell className="h-5 w-5 mr-2" />
                Lägg till övning
              </Button>
            }
          />
          <Button 
            variant="destructive" 
            className="h-14 px-6"
            onClick={() => setShowEndSheet(true)}
          >
            Avsluta
          </Button>
        </div>
      </div>

      {/* Rest timer */}
      {showRestTimer && (
        <RestTimer
          initialSeconds={90}
          onComplete={() => setShowRestTimer(false)}
          onClose={() => setShowRestTimer(false)}
        />
      )}

      {/* End workout sheet */}
      <EndWorkoutSheet
        isOpen={showEndSheet}
        onClose={() => setShowEndSheet(false)}
        onConfirm={(rating, notes) => {
          onEndWorkout(rating, notes);
          setShowEndSheet(false);
        }}
        totalSets={totalSets}
        duration={formatDuration()}
      />
    </div>
  );
}