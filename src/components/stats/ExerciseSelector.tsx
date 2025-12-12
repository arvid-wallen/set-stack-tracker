import { useState, useMemo } from 'react';
import { Search, Dumbbell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useExercises } from '@/hooks/useExercises';
import { MUSCLE_GROUP_LABELS } from '@/types/workout';
import { cn } from '@/lib/utils';

interface ExerciseSelectorProps {
  selectedId: string | null;
  onSelect: (exerciseId: string) => void;
}

export function ExerciseSelector({ selectedId, onSelect }: ExerciseSelectorProps) {
  const [search, setSearch] = useState('');
  const { exercises, isLoading } = useExercises();

  const filteredExercises = useMemo(() => {
    if (!exercises) return [];
    const query = search.toLowerCase();
    return exercises.filter(
      (e) =>
        e.name.toLowerCase().includes(query) ||
        e.muscle_groups.some((mg) =>
          MUSCLE_GROUP_LABELS[mg].toLowerCase().includes(query)
        )
    );
  }, [exercises, search]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Sök övning..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <ScrollArea className="h-[300px]">
        <div className="space-y-1">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Laddar övningar...
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Inga övningar hittades
            </div>
          ) : (
            filteredExercises.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => onSelect(exercise.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                  selectedId === exercise.id
                    ? "bg-primary/10 border border-primary/30"
                    : "bg-muted/30 hover:bg-muted/50"
                )}
              >
                <div className="p-2 rounded-full bg-background">
                  <Dumbbell className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{exercise.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {exercise.muscle_groups.slice(0, 2).map((mg) => (
                      <Badge key={mg} variant="secondary" className="text-xs">
                        {MUSCLE_GROUP_LABELS[mg]}
                      </Badge>
                    ))}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
