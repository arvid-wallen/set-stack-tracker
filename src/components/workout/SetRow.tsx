import { useState } from 'react';
import { Check, X, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ExerciseSet } from '@/types/workout';

interface SetRowProps {
  set?: ExerciseSet;
  setNumber: number;
  isNew?: boolean;
  previousSet?: { weight_kg: number | null; reps: number | null };
  onSave: (data: { weight_kg: number; reps: number; is_warmup: boolean; is_bodyweight: boolean }) => void;
  onDelete?: () => void;
  onStartRest?: () => void;
}

export function SetRow({ 
  set, 
  setNumber, 
  isNew = false, 
  previousSet,
  onSave, 
  onDelete,
  onStartRest,
}: SetRowProps) {
  const [weight, setWeight] = useState(set?.weight_kg?.toString() || previousSet?.weight_kg?.toString() || '');
  const [reps, setReps] = useState(set?.reps?.toString() || previousSet?.reps?.toString() || '');
  const [isWarmup, setIsWarmup] = useState(set?.is_warmup || false);
  const [isBodyweight, setIsBodyweight] = useState(set?.is_bodyweight || false);
  const [isSaved, setIsSaved] = useState(!isNew);

  const handleSave = () => {
    if (!weight && !isBodyweight) return;
    if (!reps) return;

    onSave({
      weight_kg: isBodyweight ? 0 : parseFloat(weight),
      reps: parseInt(reps),
      is_warmup: isWarmup,
      is_bodyweight: isBodyweight,
    });

    setIsSaved(true);
    onStartRest?.();
  };

  return (
    <div className={cn(
      "set-row",
      isWarmup && "bg-warning/5",
      isSaved && !isNew && "opacity-70"
    )}>
      {/* Set number */}
      <div className="w-8 flex items-center justify-center">
        {isWarmup ? (
          <Flame className="h-4 w-4 text-warning" />
        ) : (
          <span className="text-sm font-medium text-muted-foreground">{setNumber}</span>
        )}
      </div>

      {/* Previous */}
      {previousSet && !isWarmup && (
        <div className="w-16 text-xs text-muted-foreground text-center">
          {previousSet.weight_kg || '-'}×{previousSet.reps || '-'}
        </div>
      )}

      {/* Weight input */}
      <div className="flex-1">
        <Input
          type="number"
          inputMode="decimal"
          placeholder="kg"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          disabled={isBodyweight || isSaved}
          className="input-gym"
        />
      </div>

      {/* Reps input */}
      <div className="flex-1">
        <Input
          type="number"
          inputMode="numeric"
          placeholder="reps"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          disabled={isSaved}
          className="input-gym"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-1">
        {!isSaved ? (
          <>
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10"
              onClick={() => setIsWarmup(!isWarmup)}
            >
              <Flame className={cn("h-4 w-4", isWarmup && "text-warning fill-warning")} />
            </Button>
            <Button
              size="icon"
              className="h-10 w-10"
              onClick={handleSave}
              disabled={(!weight && !isBodyweight) || !reps}
            >
              <Check className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}