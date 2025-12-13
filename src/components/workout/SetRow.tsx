import { useState, useEffect } from 'react';
import { Check, X, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ExerciseSet } from '@/types/workout';

interface SetRowProps {
  set?: ExerciseSet;
  setNumber: number;
  isNew?: boolean;
  previousSet?: { weight_kg: number | null; reps: number | null };
  onSave: (data: { weight_kg: number; reps: number; is_warmup: boolean; is_bodyweight: boolean; rpe?: number }) => void;
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
  const [weight, setWeight] = useState(set?.weight_kg?.toString() || '');
  const [reps, setReps] = useState(set?.reps?.toString() || '');
  const [isWarmup, setIsWarmup] = useState(set?.is_warmup || false);
  const [isBodyweight, setIsBodyweight] = useState(set?.is_bodyweight || false);
  const [isEditing, setIsEditing] = useState(isNew);
  const [showSaveAnimation, setShowSaveAnimation] = useState(false);

  // Pre-fill from previous set for new rows
  useEffect(() => {
    if (isNew && previousSet && !weight && !reps) {
      if (previousSet.weight_kg) setWeight(previousSet.weight_kg.toString());
      if (previousSet.reps) setReps(previousSet.reps.toString());
    }
  }, [isNew, previousSet]);

  // Sync state when set prop changes (for editing existing sets)
  useEffect(() => {
    if (set && !isNew) {
      setWeight(set.weight_kg?.toString() || '');
      setReps(set.reps?.toString() || '');
      setIsWarmup(set.is_warmup || false);
      setIsBodyweight(set.is_bodyweight || false);
    }
  }, [set, isNew]);

  const handleSave = () => {
    if (!isBodyweight && !weight) return;
    if (!reps) return;

    setShowSaveAnimation(true);
    setTimeout(() => setShowSaveAnimation(false), 300);

    onSave({
      weight_kg: isBodyweight ? 0 : parseFloat(weight),
      reps: parseInt(reps),
      is_warmup: isWarmup,
      is_bodyweight: isBodyweight,
    });

    setIsEditing(false);
    onStartRest?.();
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (set) {
      // Reset to original values
      setWeight(set.weight_kg?.toString() || '');
      setReps(set.reps?.toString() || '');
      setIsWarmup(set.is_warmup || false);
      setIsBodyweight(set.is_bodyweight || false);
    }
    setIsEditing(false);
  };

  const canSave = (isBodyweight || (weight && parseFloat(weight) >= 0)) && reps && parseInt(reps) > 0;

  // Saved set display (clickable to edit)
  if (!isEditing && !isNew) {
    return (
      <div 
        className={cn(
          "set-row cursor-pointer hover:bg-accent/50 transition-colors",
          isWarmup && "bg-warning/5",
          showSaveAnimation && "bg-success/20 scale-[1.02]"
        )}
        onClick={handleEdit}
      >
        {/* Set number / warmup icon */}
        <div className="w-8 flex items-center justify-center shrink-0">
          {isWarmup ? (
            <Flame className="h-4 w-4 text-warning" />
          ) : (
            <span className="text-sm font-medium text-muted-foreground">{setNumber}</span>
          )}
        </div>

        {/* Previous set reference */}
        <div className="w-14 text-center shrink-0">
          {previousSet && !isWarmup ? (
            <span className="text-xs text-muted-foreground">
              {previousSet.weight_kg ?? '-'}×{previousSet.reps ?? '-'}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </div>

        {/* Weight display */}
        <div className="flex-1 min-w-0">
          <div className="input-gym bg-muted/50 flex items-center justify-center text-sm">
            {isBodyweight ? 'BW' : (weight || '-')}
          </div>
        </div>

        {/* Reps display */}
        <div className="flex-1 min-w-0">
          <div className="input-gym bg-muted/50 flex items-center justify-center text-sm">
            {reps || '-'}
          </div>
        </div>

        {/* Delete button */}
        <div className="shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Editing / New set form
  return (
    <div className={cn(
      "set-row transition-all duration-200",
      isWarmup && "bg-warning/5",
      showSaveAnimation && "bg-success/20 scale-[1.02]"
    )}>
      {/* Set number / warmup icon */}
      <div className="w-8 flex items-center justify-center shrink-0">
        {isWarmup ? (
          <Flame className="h-4 w-4 text-warning" />
        ) : (
          <span className="text-sm font-medium text-muted-foreground">{setNumber}</span>
        )}
      </div>

      {/* Previous set reference */}
      <div className="w-14 text-center shrink-0">
        {previousSet && !isWarmup ? (
          <span className="text-xs text-muted-foreground">
            {previousSet.weight_kg ?? '-'}×{previousSet.reps ?? '-'}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </div>

      {/* Weight input */}
      <div className="flex-1 min-w-0">
        <Input
          type="number"
          inputMode="decimal"
          placeholder={isBodyweight ? "BW" : "kg"}
          value={isBodyweight ? '' : weight}
          onChange={(e) => setWeight(e.target.value)}
          disabled={isBodyweight}
          className={cn(
            "input-gym text-center",
            isBodyweight && "bg-accent text-accent-foreground"
          )}
          onFocus={(e) => e.target.select()}
        />
      </div>

      {/* Reps input */}
      <div className="flex-1 min-w-0">
        <Input
          type="number"
          inputMode="numeric"
          placeholder="reps"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          className="input-gym text-center"
          onFocus={(e) => e.target.select()}
        />
      </div>

      {/* Actions - compact on mobile */}
      <div className="flex gap-0.5 sm:gap-1 shrink-0">
        {/* Warmup toggle */}
        <Button
          size="icon"
          variant="ghost"
          className="h-10 w-10"
          onClick={() => setIsWarmup(!isWarmup)}
          title="Uppvärmning"
        >
          <Flame className={cn("h-4 w-4", isWarmup && "text-warning fill-warning")} />
        </Button>

        {/* Cancel button (only when editing existing set) */}
        {!isNew && (
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10"
            onClick={handleCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        
        {/* Save button */}
        <Button
          size="icon"
          className={cn(
            "h-10 w-10 transition-all",
            canSave ? "bg-success hover:bg-success/90" : "bg-muted"
          )}
          onClick={handleSave}
          disabled={!canSave}
        >
          <Check className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
