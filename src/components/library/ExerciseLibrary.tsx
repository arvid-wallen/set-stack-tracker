import { useState, useMemo } from 'react';
import { Search, Plus, X, Dumbbell, Filter, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useExercises } from '@/hooks/useExercises';
import { Exercise, MuscleGroup, EquipmentType, MUSCLE_GROUP_LABELS, EQUIPMENT_TYPE_LABELS } from '@/types/workout';
import { CreateExerciseSheet } from './CreateExerciseSheet';
import { cn } from '@/lib/utils';

const MUSCLE_FILTERS: MuscleGroup[] = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'core'];
const EQUIPMENT_FILTERS: EquipmentType[] = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell'];

type ExerciseFilter = 'all' | 'custom' | 'default';

export function ExerciseLibrary() {
  const [query, setQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType | null>(null);
  const [typeFilter, setTypeFilter] = useState<ExerciseFilter>('all');
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  
  const { exercises, isLoading, searchExercises, createCustomExercise, refetch } = useExercises();

  const filteredExercises = useMemo(() => {
    let filtered = searchExercises(query, {
      muscleGroup: selectedMuscle || undefined,
      equipmentType: selectedEquipment || undefined,
    });

    if (typeFilter === 'custom') {
      filtered = filtered.filter(e => e.is_custom);
    } else if (typeFilter === 'default') {
      filtered = filtered.filter(e => !e.is_custom);
    }

    return filtered;
  }, [query, selectedMuscle, selectedEquipment, typeFilter, exercises]);

  const handleCreateExercise = async (exercise: Partial<Exercise>) => {
    const result = await createCustomExercise(exercise);
    if (result) {
      setShowCreateSheet(false);
      refetch();
    }
    return result;
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Sök övningar..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 h-12 rounded-ios-lg"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-ios-md"
            onClick={() => setQuery('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Type filter */}
      <div className="flex gap-2">
        <Badge
          variant={typeFilter === 'all' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setTypeFilter('all')}
        >
          Alla
        </Badge>
        <Badge
          variant={typeFilter === 'custom' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setTypeFilter('custom')}
        >
          <Sparkles className="h-3 w-3 mr-1" />
          Egna
        </Badge>
        <Badge
          variant={typeFilter === 'default' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setTypeFilter('default')}
        >
          Standard
        </Badge>
      </div>

      {/* Muscle group filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Badge
          variant={selectedMuscle === null ? 'default' : 'outline'}
          className="cursor-pointer shrink-0"
          onClick={() => setSelectedMuscle(null)}
        >
          Alla muskler
        </Badge>
        {MUSCLE_FILTERS.map(muscle => (
          <Badge
            key={muscle}
            variant={selectedMuscle === muscle ? 'default' : 'outline'}
            className="cursor-pointer shrink-0"
            onClick={() => setSelectedMuscle(muscle)}
          >
            {MUSCLE_GROUP_LABELS[muscle]}
          </Badge>
        ))}
      </div>

      {/* Equipment filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Badge
          variant={selectedEquipment === null ? 'default' : 'outline'}
          className="cursor-pointer shrink-0"
          onClick={() => setSelectedEquipment(null)}
        >
          All utrustning
        </Badge>
        {EQUIPMENT_FILTERS.map(eq => (
          <Badge
            key={eq}
            variant={selectedEquipment === eq ? 'default' : 'outline'}
            className="cursor-pointer shrink-0"
            onClick={() => setSelectedEquipment(eq)}
          >
            {EQUIPMENT_TYPE_LABELS[eq]}
          </Badge>
        ))}
      </div>

      {/* Create button */}
      <Button 
        onClick={() => setShowCreateSheet(true)}
        className="w-full h-14 rounded-ios-lg"
      >
        <Plus className="h-5 w-5 mr-2" />
        Skapa egen övning
      </Button>

      {/* Exercise list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : filteredExercises.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Inga övningar hittades</p>
            {query && (
              <Button variant="link" onClick={() => setQuery('')}>
                Rensa sökning
              </Button>
            )}
          </div>
        ) : (
          filteredExercises.map(exercise => (
            <div
              key={exercise.id}
              className="p-4 rounded-2xl bg-card border border-border/50 shadow-ios"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-ios-md bg-muted flex items-center justify-center shrink-0">
                  <Dumbbell className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium truncate">{exercise.name}</h4>
                    {exercise.is_custom && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        <Sparkles className="h-2.5 w-2.5 mr-1" />
                        Egen
                      </Badge>
                    )}
                  </div>
                  {exercise.description && (
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {exercise.description}
                    </p>
                  )}
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {exercise.muscle_groups.slice(0, 3).map(mg => (
                      <Badge key={mg} variant="secondary" className="text-xs">
                        {MUSCLE_GROUP_LABELS[mg]}
                      </Badge>
                    ))}
                    <Badge variant="outline" className="text-xs">
                      {EQUIPMENT_TYPE_LABELS[exercise.equipment_type]}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <CreateExerciseSheet
        isOpen={showCreateSheet}
        onClose={() => setShowCreateSheet(false)}
        onSubmit={handleCreateExercise}
      />
    </div>
  );
}
