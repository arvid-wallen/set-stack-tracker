import { useState } from 'react';
import { Plus, X, GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExerciseSearch } from '@/components/workout/ExerciseSearch';
import { useRoutines } from '@/hooks/useRoutines';
import { Exercise, WorkoutType, WORKOUT_TYPE_LABELS, MUSCLE_GROUP_LABELS } from '@/types/workout';

interface CreateRoutineSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface RoutineExerciseItem {
  exercise: Exercise;
  default_sets: number;
}

const WORKOUT_TYPES: WorkoutType[] = ['push', 'pull', 'legs', 'upper', 'lower', 'full_body', 'cardio', 'custom'];

export function CreateRoutineSheet({ isOpen, onClose, onCreated }: CreateRoutineSheetProps) {
  const { createRoutine, getFolders } = useRoutines();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [workoutType, setWorkoutType] = useState<WorkoutType>('custom');
  const [folder, setFolder] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [exercises, setExercises] = useState<RoutineExerciseItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const existingFolders = getFolders();

  const handleAddExercise = (exercise: Exercise) => {
    if (!exercises.find(e => e.exercise.id === exercise.id)) {
      setExercises(prev => [...prev, { exercise, default_sets: 3 }]);
    }
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setExercises(prev => prev.filter(e => e.exercise.id !== exerciseId));
  };

  const handleUpdateSets = (exerciseId: string, sets: number) => {
    setExercises(prev => prev.map(e => 
      e.exercise.id === exerciseId ? { ...e, default_sets: sets } : e
    ));
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await createRoutine({
        name: name.trim(),
        description: description.trim() || undefined,
        workout_type: workoutType,
        folder: folder.trim() || undefined,
        is_favorite: isFavorite,
        exercises: exercises.map(e => ({
          exercise_id: e.exercise.id,
          default_sets: e.default_sets,
        })),
      });
      
      // Reset form
      setName('');
      setDescription('');
      setWorkoutType('custom');
      setFolder('');
      setIsFavorite(false);
      setExercises([]);
      
      onCreated();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = name.trim().length > 0;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle>Skapa ny rutin</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-180px)] pb-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="routineName">Namn *</Label>
            <Input
              id="routineName"
              placeholder="T.ex. Push Day A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12"
            />
          </div>

          {/* Workout type */}
          <div className="space-y-2">
            <Label>Passtyp</Label>
            <Select value={workoutType} onValueChange={(v) => setWorkoutType(v as WorkoutType)}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WORKOUT_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {WORKOUT_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Folder */}
          <div className="space-y-2">
            <Label htmlFor="folder">Mapp (valfritt)</Label>
            <Input
              id="folder"
              placeholder="T.ex. PPL Split"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="h-12"
              list="folders"
            />
            {existingFolders.length > 0 && (
              <datalist id="folders">
                {existingFolders.map(f => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="routineDescription">Beskrivning (valfritt)</Label>
            <Textarea
              id="routineDescription"
              placeholder="T.ex. Fokus på bröst och axlar"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Favorite toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div>
              <Label htmlFor="isFavorite" className="font-medium">Favorit</Label>
              <p className="text-sm text-muted-foreground">
                Visa i toppen av listan
              </p>
            </div>
            <Switch
              id="isFavorite"
              checked={isFavorite}
              onCheckedChange={setIsFavorite}
            />
          </div>

          {/* Exercises */}
          <div className="space-y-3">
            <Label>Övningar</Label>
            
            {exercises.length > 0 && (
              <div className="space-y-2">
                {exercises.map((item, index) => (
                  <div 
                    key={item.exercise.id}
                    className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border"
                  >
                    <span className="text-muted-foreground text-sm w-6">{index + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{item.exercise.name}</p>
                      <div className="flex gap-1 mt-1">
                        {item.exercise.muscle_groups.slice(0, 2).map(mg => (
                          <Badge key={mg} variant="secondary" className="text-xs">
                            {MUSCLE_GROUP_LABELS[mg]}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={item.default_sets}
                        onChange={(e) => handleUpdateSets(item.exercise.id, parseInt(e.target.value) || 1)}
                        className="w-14 h-8 text-center text-sm"
                        min={1}
                        max={20}
                      />
                      <span className="text-sm text-muted-foreground">set</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handleRemoveExercise(item.exercise.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <ExerciseSearch
              onSelect={handleAddExercise}
              trigger={
                <Button variant="outline" className="w-full h-12">
                  <Plus className="h-4 w-4 mr-2" />
                  Lägg till övning
                </Button>
              }
            />
          </div>
        </div>

        <SheetFooter className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t border-border">
          <div className="flex gap-3 w-full">
            <Button variant="outline" onClick={onClose} className="flex-1 h-12">
              Avbryt
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!isValid || isSubmitting}
              className="flex-1 h-12"
            >
              {isSubmitting ? 'Skapar...' : 'Skapa rutin'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
