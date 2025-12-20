import { useState, useMemo } from 'react';
import { Search, Plus, X, Dumbbell, Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useExercises } from '@/hooks/useExercises';
import { Exercise, MuscleGroup, MUSCLE_GROUP_LABELS, EQUIPMENT_TYPE_LABELS } from '@/types/workout';
import { cn } from '@/lib/utils';
import { CreateExerciseSheet } from '@/components/library/CreateExerciseSheet';

interface ExerciseSearchProps {
  onSelect: (exercise: Exercise) => void;
  trigger?: React.ReactNode;
}

const MUSCLE_FILTERS: (MuscleGroup | 'cardio')[] = ['cardio', 'chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'core'];

export function ExerciseSearch({ onSelect, trigger }: ExerciseSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'cardio' | null>(null);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  
  const { exercises, isLoading, searchExercises, createCustomExercise } = useExercises();

  const filteredExercises = useMemo(() => {
    let results = searchExercises(query, {
      muscleGroup: selectedMuscle === 'cardio' ? undefined : selectedMuscle || undefined,
    });
    
    // Filter by cardio if selected
    if (selectedMuscle === 'cardio') {
      results = results.filter(e => e.is_cardio);
    }
    
    return results;
  }, [query, selectedMuscle, exercises]);

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise);
    setIsOpen(false);
    setQuery('');
    setSelectedMuscle(null);
  };

  const handleCreateExercise = async (exercise: Partial<Exercise>) => {
    const result = await createCustomExercise(exercise);
    if (result) {
      setShowCreateSheet(false);
      // Automatically select the newly created exercise
      handleSelect(result as Exercise);
    }
    return result;
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button className="w-full touch-target">
            <Plus className="h-5 w-5 mr-2" />
            Lägg till övning
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle>Välj övning</SheetTitle>
        </SheetHeader>

        {/* Search input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök övningar..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-12"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => setQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Create exercise button */}
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground mb-2"
          onClick={() => setShowCreateSheet(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Skapa egen övning
        </Button>

        {/* Muscle group filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide">
          <Badge
            variant={selectedMuscle === null ? "default" : "outline"}
            className="cursor-pointer shrink-0"
            onClick={() => setSelectedMuscle(null)}
          >
            Alla
          </Badge>
          {MUSCLE_FILTERS.map(muscle => (
            <Badge
              key={muscle}
              variant={selectedMuscle === muscle ? "default" : "outline"}
              className={cn(
                "cursor-pointer shrink-0",
                muscle === 'cardio' && selectedMuscle === 'cardio' && "bg-orange-500 hover:bg-orange-600",
                muscle === 'cardio' && selectedMuscle !== 'cardio' && "border-orange-500/50 text-orange-500"
              )}
              onClick={() => setSelectedMuscle(muscle)}
            >
              {muscle === 'cardio' ? (
                <>
                  <Activity className="h-3 w-3 mr-1" />
                  Cardio
                </>
              ) : (
                MUSCLE_GROUP_LABELS[muscle]
              )}
            </Badge>
          ))}
        </div>

        {/* Exercise list */}
        <ScrollArea className="h-[calc(100%-140px)]">
          <div className="space-y-2 pr-4">
            {isLoading ? (
              <div className="text-center text-muted-foreground py-8">
                Laddar övningar...
              </div>
            ) : filteredExercises.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  {query ? `Hittade ingen övning som matchar "${query}"` : 'Inga övningar hittades'}
                </p>
                <Button onClick={() => setShowCreateSheet(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {query ? `Skapa "${query}" som ny övning` : 'Skapa egen övning'}
                </Button>
              </div>
            ) : (
              filteredExercises.map(exercise => (
                <button
                  key={exercise.id}
                  className="w-full p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors text-left"
                  onClick={() => handleSelect(exercise)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                      exercise.is_cardio ? "bg-orange-500/20" : "bg-muted"
                    )}>
                      {exercise.is_cardio ? (
                        <Activity className="h-5 w-5 text-orange-500" />
                      ) : (
                        <Dumbbell className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{exercise.name}</h4>
                        {exercise.is_cardio && (
                          <Badge variant="secondary" className="text-xs bg-orange-500/20 text-orange-500 border-orange-500/30">
                            Cardio
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {!exercise.is_cardio && exercise.muscle_groups.slice(0, 2).map(mg => (
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
                </button>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Create exercise sheet */}
        <CreateExerciseSheet
          isOpen={showCreateSheet}
          onClose={() => setShowCreateSheet(false)}
          onSubmit={handleCreateExercise}
        />
      </SheetContent>
    </Sheet>
  );
}