import { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SetRow } from './SetRow';
import { WorkoutExercise, ExerciseSet, MUSCLE_GROUP_LABELS } from '@/types/workout';
import { cn } from '@/lib/utils';

interface ExerciseCardProps {
  workoutExercise: WorkoutExercise;
  onAddSet: (data: Partial<ExerciseSet>) => void;
  onDeleteSet: (setId: string) => void;
  onRemoveExercise: () => void;
  onStartRest: () => void;
  supersetBadge?: number;
}

export function ExerciseCard({
  workoutExercise,
  onAddSet,
  onDeleteSet,
  onRemoveExercise,
  onStartRest,
  supersetBadge,
}: ExerciseCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showNewSet, setShowNewSet] = useState(true);

  const exercise = workoutExercise.exercise;
  const sets = workoutExercise.sets || [];
  const workingSets = sets.filter(s => !s.is_warmup);
  const warmupSets = sets.filter(s => s.is_warmup);

  const lastWorkingSet = workingSets[workingSets.length - 1];

  const handleSaveNewSet = (data: { weight_kg: number; reps: number; is_warmup: boolean; is_bodyweight: boolean }) => {
    onAddSet(data);
    onStartRest();
  };

  if (!exercise) return null;

  return (
    <Card className="workout-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3">
        {supersetBadge && (
          <Badge variant="outline" className="rounded-full w-6 h-6 p-0 flex items-center justify-center text-xs">
            {supersetBadge}
          </Badge>
        )}
        
        <button 
          className="flex-1 flex items-center gap-3 text-left"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex-1">
            <h3 className="font-semibold">{exercise.name}</h3>
            <div className="flex gap-1 mt-1 flex-wrap">
              {exercise.muscle_groups.slice(0, 2).map(mg => (
                <Badge key={mg} variant="secondary" className="text-xs">
                  {MUSCLE_GROUP_LABELS[mg]}
                </Badge>
              ))}
              {sets.length > 0 && (
                <span className="text-xs text-muted-foreground ml-1">
                  {workingSets.length} set{workingSets.length !== 1 ? 's' : ''}
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
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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

      {/* Sets */}
      {isExpanded && (
        <div className="mt-4">
          {/* Header row */}
          <div className="flex items-center gap-3 pb-2 border-b border-border text-xs text-muted-foreground">
            <div className="w-8 text-center">SET</div>
            <div className="w-16 text-center">FÖRRA</div>
            <div className="flex-1 text-center">KG</div>
            <div className="flex-1 text-center">REPS</div>
            <div className="w-[88px]"></div>
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
              onSave={() => {}}
              onDelete={() => onDeleteSet(set.id)}
            />
          ))}

          {/* New set row */}
          {showNewSet && (
            <SetRow
              setNumber={workingSets.length + 1}
              isNew
              previousSet={lastWorkingSet ? {
                weight_kg: lastWorkingSet.weight_kg,
                reps: lastWorkingSet.reps,
              } : undefined}
              onSave={handleSaveNewSet}
              onStartRest={onStartRest}
            />
          )}

          {/* Add set button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-muted-foreground"
            onClick={() => setShowNewSet(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Lägg till set
          </Button>
        </div>
      )}
    </Card>
  );
}