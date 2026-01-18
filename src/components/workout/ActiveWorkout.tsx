import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Clock, Dumbbell, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WorkoutTimer } from './WorkoutTimer';
import { RestTimer } from './RestTimer';
import { ExerciseCard } from './ExerciseCard';
import { ExerciseSearch } from './ExerciseSearch';
import { EndWorkoutSheet } from './EndWorkoutSheet';
import { useWorkout } from '@/hooks/useWorkout';
import { useRoutines } from '@/hooks/useRoutines';
import { WORKOUT_TYPE_LABELS, Exercise } from '@/types/workout';
import { cn } from '@/lib/utils';

export function ActiveWorkout() {
  const { 
    activeWorkout, 
    exercises: workoutExercises, 
    isOnline,
    isMinimized,
    minimizeWorkout,
    addExercise, 
    removeExercise, 
    addSet, 
    deleteSet, 
    endWorkout,
    discardWorkout,
    linkToSuperset,
    unlinkFromSuperset,
    markExerciseComplete,
    addCardioLog,
    updateCardioLog,
    deleteCardioLog,
  } = useWorkout();
  
  const navigate = useNavigate();
  const { createRoutine } = useRoutines();
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showEndSheet, setShowEndSheet] = useState(false);

  const totalSets = useMemo(() => {
    return workoutExercises.reduce((acc, ex) => acc + (ex.sets?.filter(s => !s.is_warmup).length || 0), 0);
  }, [workoutExercises]);

  const handleExerciseSelect = async (exercise: Exercise) => {
    await addExercise(exercise.id);
  };

  const getDurationSeconds = () => {
    if (!activeWorkout) return 0;
    const start = new Date(activeWorkout.started_at);
    const now = new Date();
    return Math.floor((now.getTime() - start.getTime()) / 1000);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
  };

  // Don't render if no workout or if minimized
  if (!activeWorkout || isMinimized) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col safe-top safe-bottom">
      {/* iOS Navigation Bar Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-border/30 bg-background/95 backdrop-blur-xl">
        <Button 
          variant="ghost" 
          size="icon"
          className="h-12 w-12 rounded-ios-md touch-target"
          onClick={minimizeWorkout}
        >
          <Minus className="h-5 w-5" />
        </Button>
        
        <div className="flex-1 text-center">
          <h1 className="font-heading font-semibold text-lg">
            {activeWorkout.custom_type_name || WORKOUT_TYPE_LABELS[activeWorkout.workout_type]}
          </h1>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <WorkoutTimer startedAt={activeWorkout.started_at} className="text-sm !text-muted-foreground" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Offline indicator */}
          {!isOnline && (
            <Badge variant="outline" className="text-warning border-warning rounded-full">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </Badge>
          )}
          <Badge variant="secondary" className="font-mono rounded-full px-3">
            {totalSets} set
          </Badge>
        </div>
      </header>

      {/* Exercise list */}
      <ScrollArea className="flex-1 px-5 py-6">
        <div className="space-y-5 pb-36">
          {workoutExercises.length === 0 ? (
            <div className="text-center py-12">
              <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg mb-2">Lägg till din första övning</h3>
              <p className="text-muted-foreground text-sm">
                Tryck på knappen nedan för att komma igång
              </p>
            </div>
          ) : (
            workoutExercises.map((workoutExercise, index) => (
              <ExerciseCard
                key={workoutExercise.id}
                workoutExercise={workoutExercise}
                onAddSet={(data) => addSet(workoutExercise.id, data)}
                onDeleteSet={(setId) => deleteSet(setId, workoutExercise.id)}
                onRemoveExercise={() => removeExercise(workoutExercise.id)}
                onStartRest={() => setShowRestTimer(true)}
                onLinkSuperset={index > 0 ? () => linkToSuperset(index) : undefined}
                onUnlinkSuperset={workoutExercise.superset_group ? () => unlinkFromSuperset(workoutExercise.id) : undefined}
                onMarkComplete={(completed) => markExerciseComplete(workoutExercise.id, completed)}
                onAddCardioLog={(data) => addCardioLog(workoutExercise.id, data)}
                onUpdateCardioLog={(logId, data) => updateCardioLog(logId, workoutExercise.id, data)}
                onDeleteCardioLog={(logId) => deleteCardioLog(logId, workoutExercise.id)}
                supersetBadge={workoutExercise.superset_group || undefined}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Bottom action bar - iOS style */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/30">
        <div className="flex gap-4 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          <ExerciseSearch 
            onSelect={handleExerciseSelect}
            trigger={
              <Button variant="outline" className="flex-1 h-14 text-base touch-target rounded-ios-lg">
                <Dumbbell className="h-5 w-5 mr-2" />
                Lägg till övning
              </Button>
            }
          />
          <Button 
            variant="destructive" 
            className="h-14 px-6 touch-target rounded-ios-lg"
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
        onConfirm={async (rating, notes, customDuration, templateData) => {
          // Stäng sheeten först så overlay inte kan fastna
          setShowEndSheet(false);

          // Spara som mall om det begärdes
          if (templateData) {
            await createRoutine({
              name: templateData.name,
              folder: templateData.folder,
              is_favorite: templateData.isFavorite,
              workout_type: activeWorkout.workout_type,
              exercises: workoutExercises.map(we => ({
                exercise_id: we.exercise_id,
                default_sets: we.sets?.filter(s => !s.is_warmup).length || 3,
              })),
            });
          }

          // Avsluta workout FÖRST (så startsidan inte tror att ett pass fortfarande är aktivt)
          await endWorkout(rating, notes, customDuration);

          // Alltid tillbaka till hem
          navigate('/', { replace: true });
        }}
        onDiscard={async () => {
          setShowEndSheet(false);
          await discardWorkout();
          navigate('/', { replace: true });
        }}
        totalSets={totalSets}
        durationSeconds={getDurationSeconds()}
        workoutType={activeWorkout.custom_type_name || WORKOUT_TYPE_LABELS[activeWorkout.workout_type]}
        exerciseCount={workoutExercises.length}
      />
    </div>
  );
}
