import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Clock, Dumbbell, Wifi, WifiOff } from 'lucide-react';
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
    addExercise, 
    removeExercise, 
    addSet, 
    deleteSet, 
    endWorkout,
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

  const formatDuration = () => {
    if (!activeWorkout) return '0 min';
    const start = new Date(activeWorkout.started_at);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
  };

  if (!activeWorkout) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col safe-top safe-bottom">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            className="touch-target"
            onClick={() => setShowEndSheet(true)}
          >
            <X className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-heading font-semibold">
              {activeWorkout.custom_type_name || WORKOUT_TYPE_LABELS[activeWorkout.workout_type]}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <WorkoutTimer startedAt={activeWorkout.started_at} className="text-sm !text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Offline indicator */}
          {!isOnline && (
            <Badge variant="outline" className="text-warning border-warning">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </Badge>
          )}
          <Badge variant="secondary" className="font-mono">
            {totalSets} set
          </Badge>
        </div>
      </header>

      {/* Exercise list */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 pb-32">
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

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border">
        <div className="flex gap-3 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <ExerciseSearch 
            onSelect={handleExerciseSelect}
            trigger={
              <Button className="flex-1 h-14 text-base touch-target">
                <Dumbbell className="h-5 w-5 mr-2" />
                Lägg till övning
              </Button>
            }
          />
          <Button 
            variant="destructive" 
            className="h-14 px-6 touch-target"
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
        onConfirm={async (rating, notes, templateData) => {
          // Stäng sheet och navigera FÖRST för att undvika blank skärm
          setShowEndSheet(false);
          navigate('/');
          
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
          
          // Avsluta workout sist
          await endWorkout(rating, notes);
        }}
        totalSets={totalSets}
        duration={formatDuration()}
        workoutType={activeWorkout.custom_type_name || WORKOUT_TYPE_LABELS[activeWorkout.workout_type]}
        exerciseCount={workoutExercises.length}
      />
    </div>
  );
}
