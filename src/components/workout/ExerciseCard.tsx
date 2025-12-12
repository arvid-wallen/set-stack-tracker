import { useState, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronUp, Trash2, MoreVertical, Link2, Unlink, Circle, CheckCircle2, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SetRow } from './SetRow';
import { CardioLogRow } from './CardioLogRow';
import { WorkoutExercise, ExerciseSet, CardioLog, MUSCLE_GROUP_LABELS, CardioType } from '@/types/workout';
import { cn } from '@/lib/utils';

interface ExerciseCardProps {
  workoutExercise: WorkoutExercise;
  onAddSet: (data: Partial<ExerciseSet>) => void;
  onDeleteSet: (setId: string) => void;
  onRemoveExercise: () => void;
  onStartRest: () => void;
  onLinkSuperset?: () => void;
  onUnlinkSuperset?: () => void;
  onMarkComplete?: (completed: boolean) => void;
  onAddCardioLog?: (data: Partial<CardioLog>) => void;
  onUpdateCardioLog?: (logId: string, data: Partial<CardioLog>) => void;
  onDeleteCardioLog?: (logId: string) => void;
  supersetBadge?: number;
}

export function ExerciseCard({
  workoutExercise,
  onAddSet,
  onDeleteSet,
  onRemoveExercise,
  onStartRest,
  onLinkSuperset,
  onUnlinkSuperset,
  onMarkComplete,
  onAddCardioLog,
  onUpdateCardioLog,
  onDeleteCardioLog,
  supersetBadge,
}: ExerciseCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newSetKey, setNewSetKey] = useState(0);

  const exercise = workoutExercise.exercise;
  const isCompleted = workoutExercise.is_completed;
  const isCardio = exercise?.is_cardio ?? false;
  const cardioLog = workoutExercise.cardioLog;
  const sets = workoutExercise.sets || [];
  const workingSets = sets.filter(s => !s.is_warmup);
  const warmupSets = sets.filter(s => s.is_warmup);

  // Auto-collapse when marked complete
  useEffect(() => {
    if (isCompleted) {
      setIsExpanded(false);
    }
  }, [isCompleted]);

  const handleToggleComplete = useCallback(() => {
    onMarkComplete?.(!isCompleted);
  }, [onMarkComplete, isCompleted]);

  const lastWorkingSet = workingSets[workingSets.length - 1];

  const handleSaveNewSet = useCallback((data: { 
    weight_kg: number; 
    reps: number; 
    is_warmup: boolean; 
    is_bodyweight: boolean;
    rpe?: number;
  }) => {
    onAddSet({
      ...data,
      rpe: data.rpe ?? null,
    });
    // Force new SetRow component by changing key
    setNewSetKey(prev => prev + 1);
    onStartRest();
  }, [onAddSet, onStartRest]);

  const handleSaveCardio = useCallback((data: Partial<CardioLog>) => {
    if (onAddCardioLog) {
      onAddCardioLog(data);
    }
  }, [onAddCardioLog]);

  const handleUpdateCardio = useCallback((data: Partial<CardioLog>) => {
    if (cardioLog && onUpdateCardioLog) {
      onUpdateCardioLog(cardioLog.id, data);
    }
  }, [cardioLog, onUpdateCardioLog]);

  if (!exercise) return null;

  return (
    <Card className={cn(
      "workout-card overflow-hidden transition-all duration-300",
      supersetBadge && "border-l-4 border-l-primary",
      isCompleted && "opacity-60 bg-muted/30"
    )}>
      {/* Header */}
      <div className="flex items-center gap-3">
        {/* Complete toggle */}
        <button
          className="touch-target flex items-center justify-center"
          onClick={handleToggleComplete}
          aria-label={isCompleted ? "Markera som ej klar" : "Markera som klar"}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          ) : (
            <Circle className="h-6 w-6 text-muted-foreground" />
          )}
        </button>

        {supersetBadge && (
          <Badge variant="outline" className="rounded-full w-6 h-6 p-0 flex items-center justify-center text-xs border-primary text-primary">
            {supersetBadge}
          </Badge>
        )}
        
        <button 
          className="flex-1 flex items-center gap-3 text-left touch-target"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {isCardio && <Activity className="h-4 w-4 text-orange-500" />}
              <h3 className={cn(
                "font-semibold",
                isCompleted && "line-through text-muted-foreground"
              )}>{exercise.name}</h3>
              {isCardio && (
                <Badge variant="secondary" className="text-xs bg-orange-500/20 text-orange-500 border-orange-500/30">
                  Cardio
                </Badge>
              )}
              {isCompleted && (
                <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-500 border-green-500/30">
                  ✓ Klar
                </Badge>
              )}
            </div>
            <div className="flex gap-1 mt-1 flex-wrap">
              {!isCardio && exercise.muscle_groups.slice(0, 2).map(mg => (
                <Badge key={mg} variant="secondary" className="text-xs">
                  {MUSCLE_GROUP_LABELS[mg]}
                </Badge>
              ))}
              {isCardio && cardioLog && (
                <span className="text-xs text-muted-foreground">
                  {cardioLog.duration_seconds && `${Math.floor(cardioLog.duration_seconds / 60)} min`}
                  {cardioLog.distance_km && ` · ${cardioLog.distance_km} km`}
                </span>
              )}
              {!isCardio && sets.length > 0 && (
                <span className="text-xs text-muted-foreground ml-1">
                  {workingSets.length} set{workingSets.length !== 1 ? 's' : ''}
                  {warmupSets.length > 0 && ` + ${warmupSets.length} uppv.`}
                </span>
              )}
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 touch-target">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onLinkSuperset && (
              <DropdownMenuItem onClick={onLinkSuperset}>
                <Link2 className="h-4 w-4 mr-2" />
                Länka till superset
              </DropdownMenuItem>
            )}
            {supersetBadge && onUnlinkSuperset && (
              <DropdownMenuItem onClick={onUnlinkSuperset}>
                <Unlink className="h-4 w-4 mr-2" />
                Ta bort från superset
              </DropdownMenuItem>
            )}
            {(onLinkSuperset || supersetBadge) && <DropdownMenuSeparator />}
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={onRemoveExercise}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Ta bort övning
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content: Cardio or Sets */}
      {isExpanded && (
        <div className="mt-4">
          {isCardio ? (
            /* Cardio log input */
            <CardioLogRow
              cardioLog={cardioLog}
              cardioType={(exercise.name?.toLowerCase().includes('löpning') ? 'running' :
                          exercise.name?.toLowerCase().includes('cykel') ? 'cycling' :
                          exercise.name?.toLowerCase().includes('rodd') ? 'rowing' :
                          exercise.name?.toLowerCase().includes('simning') ? 'swimming' :
                          'running') as CardioType}
              onSave={handleSaveCardio}
              onUpdate={handleUpdateCardio}
              onDelete={cardioLog ? () => onDeleteCardioLog?.(cardioLog.id) : undefined}
            />
          ) : (
            /* Strength training sets */
            <>
              {/* Header row */}
              <div className="flex items-center gap-3 pb-2 border-b border-border text-xs text-muted-foreground uppercase tracking-wide">
                <div className="w-8 text-center">Set</div>
                <div className="w-16 text-center">Förra</div>
                <div className="flex-1 text-center">Kg</div>
                <div className="flex-1 text-center">Reps</div>
                <div className="w-[176px]"></div>
              </div>

              {/* Warmup sets */}
              {warmupSets.map((set, i) => (
                <SetRow
                  key={set.id}
                  set={set}
                  setNumber={i + 1}
                  onSave={() => {}}
                  onDelete={() => onDeleteSet(set.id)}
                />
              ))}

              {/* Working sets */}
              {workingSets.map((set, i) => (
                <SetRow
                  key={set.id}
                  set={set}
                  setNumber={i + 1}
                  previousSet={i > 0 ? {
                    weight_kg: workingSets[i - 1].weight_kg,
                    reps: workingSets[i - 1].reps,
                  } : undefined}
                  onSave={() => {}}
                  onDelete={() => onDeleteSet(set.id)}
                />
              ))}

              {/* New set row - key changes force remount after save */}
              <SetRow
                key={`new-${newSetKey}`}
                setNumber={workingSets.length + 1}
                isNew
                previousSet={lastWorkingSet ? {
                  weight_kg: lastWorkingSet.weight_kg,
                  reps: lastWorkingSet.reps,
                } : undefined}
                onSave={handleSaveNewSet}
                onStartRest={onStartRest}
              />

              {/* Add set hint */}
              <p className="text-xs text-muted-foreground text-center mt-3 py-2">
                Fyll i och tryck ✓ för att logga set
              </p>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
