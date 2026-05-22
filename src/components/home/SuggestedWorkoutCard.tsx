import { Sparkles, Play, Coffee, MoreHorizontal, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSuggestedWorkout } from '@/hooks/useSuggestedWorkout';
import { usePTProfile } from '@/hooks/usePTProfile';
import { WorkoutType } from '@/types/workout';
import { TRAINING_SPLIT_OPTIONS, TrainingSplitId } from '@/lib/training-splits';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface Props {
  onStart: (type: WorkoutType, customName?: string) => void;
}

export function SuggestedWorkoutCard({ onStart }: Props) {
  const suggestion = useSuggestedWorkout();
  const { ptProfile, updatePTProfile, savePTProfile } = usePTProfile();
  const queryClient = useQueryClient();
  const currentSplit = (ptProfile?.training_split ?? null) as TrainingSplitId | null;

  const handleChangeSplit = async (id: TrainingSplitId) => {
    if (id === currentSplit) return;
    if (ptProfile) {
      await updatePTProfile({ training_split: id });
    } else {
      await savePTProfile({ training_split: id });
    }
    queryClient.invalidateQueries({ queryKey: ['recent-workouts-for-split'] });
  };

  if (!suggestion || suggestion.isLoading) return null;

  const SplitMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full -mt-1 -mr-1 shrink-0"
          aria-label="Byt träningssplit"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Byt träningssplit</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {TRAINING_SPLIT_OPTIONS.map((opt) => {
          const isActive = opt.id === currentSplit;
          return (
            <DropdownMenuItem
              key={opt.id}
              onClick={() => handleChangeSplit(opt.id)}
              className="flex items-start gap-2"
            >
              <Check
                className={cn(
                  'h-4 w-4 mt-0.5 shrink-0',
                  isActive ? 'opacity-100 text-primary' : 'opacity-0',
                )}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight">{opt.label}</p>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                  {opt.description}
                </p>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (suggestion.isRestDay) {
    return (
      <Card className="rounded-2xl shadow-ios bg-success/10 border-success/20">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="p-2 rounded-ios-md bg-success/20 shrink-0">
            <Coffee className="h-4 w-4 text-success-foreground" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
              Förslag idag
            </p>
            <p className="text-base font-semibold mt-0.5">Vilodag rekommenderas</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Du har nått veckans träningsmål. Bra jobbat 💪
            </p>
          </div>
          {SplitMenu}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl shadow-ios bg-primary/5 border-primary/20">
      <CardContent className="p-4 flex items-start gap-3">
        <div className="p-2 rounded-ios-md bg-primary/15 shrink-0">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
            Förslag idag
          </p>
          <p className="text-base font-semibold mt-0.5 truncate">{suggestion.label}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{suggestion.reason}</p>
          {suggestion.splitLabel && (
            <p className="text-xs text-muted-foreground/80 mt-0.5">
              Enligt din split: {suggestion.splitLabel}
            </p>
          )}
          <Button
            size="sm"
            variant="pill"
            className="mt-3 h-9"
            onClick={() => onStart(suggestion.type, suggestion.customName)}
          >
            <Play className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Starta {suggestion.label}
          </Button>
        </div>
        {SplitMenu}
      </CardContent>
    </Card>
  );
}
