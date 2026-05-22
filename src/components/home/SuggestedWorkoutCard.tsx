import { Sparkles, Play, Coffee } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSuggestedWorkout } from '@/hooks/useSuggestedWorkout';
import { WorkoutType } from '@/types/workout';

interface Props {
  onStart: (type: WorkoutType, customName?: string) => void;
}

export function SuggestedWorkoutCard({ onStart }: Props) {
  const suggestion = useSuggestedWorkout();
  if (!suggestion || suggestion.isLoading) return null;

  if (suggestion.isRestDay) {
    return (
      <Card className="rounded-2xl shadow-ios bg-success/10 border-success/20">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="p-2 rounded-ios-md bg-success/20 shrink-0">
            <Coffee className="h-4 w-4 text-success-foreground" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
              Förslag idag
            </p>
            <p className="text-base font-semibold mt-0.5">Vilodag rekommenderas</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Du har nått veckans träningsmål. Bra jobbat 💪
            </p>
          </div>
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
      </CardContent>
    </Card>
  );
}
