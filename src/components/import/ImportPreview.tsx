import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Dumbbell, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  Pencil,
  Check,
  X
} from 'lucide-react';
import { ParsedWorkout, ParsedExercise } from '@/hooks/useImportWorkouts';
import { format, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';

interface ImportPreviewProps {
  workouts: ParsedWorkout[];
  onUpdateWorkout: (index: number, workout: ParsedWorkout) => void;
  onRemoveWorkout: (index: number) => void;
}

export function ImportPreview({ workouts, onUpdateWorkout, onRemoveWorkout }: ImportPreviewProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  if (workouts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Inga träningspass hittades i texten
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Hittade {workouts.length} träningspass. Klicka för att granska och redigera.
      </p>
      
      {workouts.map((workout, index) => (
        <WorkoutPreviewCard
          key={index}
          workout={workout}
          index={index}
          isExpanded={expandedIndex === index}
          onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
          onUpdate={(updated) => onUpdateWorkout(index, updated)}
          onRemove={() => onRemoveWorkout(index)}
        />
      ))}
    </div>
  );
}

interface WorkoutPreviewCardProps {
  workout: ParsedWorkout;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (workout: ParsedWorkout) => void;
  onRemove: () => void;
}

function WorkoutPreviewCard({ 
  workout, 
  index, 
  isExpanded, 
  onToggle, 
  onUpdate, 
  onRemove 
}: WorkoutPreviewCardProps) {
  const [editingExercise, setEditingExercise] = useState<number | null>(null);

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'd MMM yyyy', { locale: sv });
    } catch {
      return dateStr;
    }
  };

  const totalSets = workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);

  const updateExerciseName = (exerciseIndex: number, newName: string) => {
    const updated = { ...workout };
    updated.exercises = [...workout.exercises];
    updated.exercises[exerciseIndex] = {
      ...updated.exercises[exerciseIndex],
      name: newName
    };
    onUpdate(updated);
  };

  const removeExercise = (exerciseIndex: number) => {
    const updated = { ...workout };
    updated.exercises = workout.exercises.filter((_, i) => i !== exerciseIndex);
    onUpdate(updated);
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: number | null) => {
    const updated = { ...workout };
    updated.exercises = [...workout.exercises];
    updated.exercises[exerciseIndex] = {
      ...updated.exercises[exerciseIndex],
      sets: [...updated.exercises[exerciseIndex].sets]
    };
    updated.exercises[exerciseIndex].sets[setIndex] = {
      ...updated.exercises[exerciseIndex].sets[setIndex],
      [field]: value
    };
    onUpdate(updated);
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader 
        className="py-3 px-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{formatDate(workout.date)}</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {workout.workoutType}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {workout.exercises.length} övningar, {totalSets} set
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 px-4 pb-4">
          <div className="space-y-4">
            {workout.exercises.map((exercise, exIndex) => (
              <ExercisePreview
                key={exIndex}
                exercise={exercise}
                isEditing={editingExercise === exIndex}
                onStartEdit={() => setEditingExercise(exIndex)}
                onStopEdit={() => setEditingExercise(null)}
                onUpdateName={(name) => updateExerciseName(exIndex, name)}
                onRemove={() => removeExercise(exIndex)}
                onUpdateSet={(setIndex, field, value) => updateSet(exIndex, setIndex, field, value)}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

interface ExercisePreviewProps {
  exercise: ParsedExercise;
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onUpdateName: (name: string) => void;
  onRemove: () => void;
  onUpdateSet: (setIndex: number, field: 'weight' | 'reps', value: number | null) => void;
}

function ExercisePreview({
  exercise,
  isEditing,
  onStartEdit,
  onStopEdit,
  onUpdateName,
  onRemove,
  onUpdateSet
}: ExercisePreviewProps) {
  const [editName, setEditName] = useState(exercise.name);

  const handleSave = () => {
    onUpdateName(editName);
    onStopEdit();
  };

  const handleCancel = () => {
    setEditName(exercise.name);
    onStopEdit();
  };

  return (
    <div className="border border-border/50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-8"
              autoFocus
            />
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSave}>
              <Check className="h-4 w-4 text-green-500" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-primary" />
            <span className="font-medium">{exercise.name}</span>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onStartEdit}>
              <Pencil className="h-3 w-3" />
            </Button>
          </div>
        )}
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onRemove}>
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </div>

      <div className="space-y-1">
        {exercise.sets.map((set, setIndex) => (
          <div key={setIndex} className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground w-8">
              {setIndex + 1}.
            </span>
            <Input
              type="number"
              value={set.weight || ''}
              onChange={(e) => onUpdateSet(setIndex, 'weight', e.target.value ? Number(e.target.value) : null)}
              className="h-7 w-16 text-center"
              placeholder="kg"
            />
            <span className="text-muted-foreground">kg ×</span>
            <Input
              type="number"
              value={set.reps || ''}
              onChange={(e) => onUpdateSet(setIndex, 'reps', e.target.value ? Number(e.target.value) : null)}
              className="h-7 w-14 text-center"
              placeholder="reps"
            />
            <span className="text-muted-foreground">reps</span>
            {set.isWarmup && (
              <Badge variant="secondary" className="text-xs">
                uppv
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
