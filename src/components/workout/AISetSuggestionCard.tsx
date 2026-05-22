import { useState } from "react";
import { Sparkles, Check, X, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAISetSuggestion } from "@/hooks/useAISetSuggestion";
import { cn } from "@/lib/utils";

interface Props {
  exerciseId: string;
  workoutSessionId: string;
  onAccept: (weight: number, reps: number, rpe: number | null) => void;
}

export function AISetSuggestionCard({ exerciseId, workoutSessionId, onAccept }: Props) {
  const { suggestion, isLoading, error, refetch, dismissed, dismiss, reset } = useAISetSuggestion(
    exerciseId,
    workoutSessionId
  );
  const [accepted, setAccepted] = useState(false);

  if (dismissed) return null;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary animate-pulse" />
        <Skeleton className="h-4 flex-1" />
      </div>
    );
  }

  if (error || !suggestion) return null;

  if (accepted) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/10 p-2.5 flex items-center gap-2 text-xs text-success">
        <Check className="h-3.5 w-3.5" />
        <span>Förslag använt — justera vid behov innan du sparar.</span>
      </div>
    );
  }

  const handleAccept = () => {
    onAccept(suggestion.weight_kg, suggestion.reps, suggestion.rpe);
    setAccepted(true);
  };

  const confidenceLabel = {
    high: "Hög säkerhet",
    medium: "Mellan säkerhet",
    low: "Låg säkerhet",
  }[suggestion.confidence];

  return (
    <div
      className={cn(
        "rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2.5",
        "animate-slide-in-bottom"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          AI-förslag nästa set
        </div>
        <span className="text-[10px] text-muted-foreground">{confidenceLabel}</span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-xl font-semibold tabular-nums">
          {suggestion.weight_kg === 0 ? "BW" : suggestion.weight_kg}
          {suggestion.weight_kg !== 0 && <span className="text-xs text-muted-foreground ml-1">kg</span>}
        </span>
        <span className="text-muted-foreground">×</span>
        <span className="text-xl font-semibold tabular-nums">{suggestion.reps}</span>
        <span className="text-xs text-muted-foreground">reps</span>
        {suggestion.rpe != null && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/15 ml-1">
            RPE {suggestion.rpe}
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground leading-snug">{suggestion.rationale}</p>

      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" onClick={handleAccept} className="h-8 flex-1">
          <Check className="h-3.5 w-3.5 mr-1" />
          Använd
        </Button>
        <Button size="sm" variant="ghost" onClick={dismiss} className="h-8">
          <X className="h-3.5 w-3.5 mr-1" />
          Avfärda
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => {
            reset();
            refetch();
          }}
          className="h-8 w-8"
          aria-label="Generera nytt förslag"
        >
          <RotateCw className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
