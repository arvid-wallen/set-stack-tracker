import { useState, useEffect } from 'react';
import { Check, X, Flame, User, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ExerciseSet } from '@/types/workout';

interface SetRowProps {
  set?: ExerciseSet;
  setNumber: number;
  isNew?: boolean;
  previousSet?: { weight_kg: number | null; reps: number | null };
  onSave: (data: { weight_kg: number; reps: number; is_warmup: boolean; is_bodyweight: boolean; rpe?: number; rir?: number }) => void;
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
  const [rpe, setRpe] = useState(set?.rpe?.toString() || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSaved, setIsSaved] = useState(!isNew);
  const [showSaveAnimation, setShowSaveAnimation] = useState(false);

  // Pre-fill from previous set for new rows
  useEffect(() => {
    if (isNew && previousSet && !weight && !reps) {
      if (previousSet.weight_kg) setWeight(previousSet.weight_kg.toString());
      if (previousSet.reps) setReps(previousSet.reps.toString());
    }
  }, [isNew, previousSet]);

  const handleSave = () => {
    if (!isBodyweight && !weight) return;
    if (!reps) return;

    // Show save animation
    setShowSaveAnimation(true);
    setTimeout(() => setShowSaveAnimation(false), 300);

    onSave({
      weight_kg: isBodyweight ? 0 : parseFloat(weight),
      reps: parseInt(reps),
      is_warmup: isWarmup,
      is_bodyweight: isBodyweight,
      rpe: rpe ? parseFloat(rpe) : undefined,
    });

    setIsSaved(true);
    onStartRest?.();
  };

  const toggleBodyweight = () => {
    setIsBodyweight(!isBodyweight);
    if (!isBodyweight) {
      setWeight('0');
    } else {
      setWeight('');
    }
  };

  const canSave = (isBodyweight || (weight && parseFloat(weight) >= 0)) && reps && parseInt(reps) > 0;

  return (
    <div className={cn(
      "set-row transition-all duration-200",
      isWarmup && "bg-warning/5",
      isSaved && !isNew && "opacity-60",
      showSaveAnimation && "bg-success/20 scale-[1.02]"
    )}>
      {/* Set number / warmup icon */}
      <div className="w-8 flex items-center justify-center">
        {isWarmup ? (
          <Flame className="h-4 w-4 text-warning" />
        ) : (
          <span className="text-sm font-medium text-muted-foreground">{setNumber}</span>
        )}
      </div>

      {/* Previous set reference */}
      <div className="w-16 text-center">
        {previousSet && !isWarmup ? (
          <span className="text-xs text-muted-foreground">
            {previousSet.weight_kg ?? '-'}×{previousSet.reps ?? '-'}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </div>

      {/* Weight input */}
      <div className="flex-1">
        <Input
          type="number"
          inputMode="decimal"
          placeholder={isBodyweight ? "BW" : "kg"}
          value={isBodyweight ? '' : weight}
          onChange={(e) => setWeight(e.target.value)}
          disabled={isBodyweight || isSaved}
          className={cn(
            "input-gym",
            isBodyweight && "bg-accent text-accent-foreground"
          )}
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
            {/* Bodyweight toggle */}
            <Button
              size="icon"
              variant={isBodyweight ? "secondary" : "ghost"}
              className={cn(
                "h-10 w-10",
                isBodyweight && "bg-accent text-accent-foreground"
              )}
              onClick={toggleBodyweight}
              title="Kroppsvikt"
            >
              <User className="h-4 w-4" />
            </Button>
            
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

            {/* Advanced options toggle */}
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10"
              onClick={() => setShowAdvanced(!showAdvanced)}
              title="Fler alternativ"
            >
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            
            {/* Save button */}
            <Button
              size="icon"
              className={cn(
                "h-10 w-10 transition-all",
                canSave && "bg-success hover:bg-success/90"
              )}
              onClick={handleSave}
              disabled={!canSave}
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

      {/* Advanced options row (RPE) */}
      {showAdvanced && !isSaved && (
        <div className="w-full flex items-center gap-3 pt-2 pl-8">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">RPE:</span>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="6-10"
              value={rpe}
              onChange={(e) => setRpe(e.target.value)}
              className="input-gym w-16 h-10 text-sm"
              min={6}
              max={10}
              step={0.5}
            />
          </div>
        </div>
      )}
    </div>
  );
}
