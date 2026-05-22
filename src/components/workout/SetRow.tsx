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
  prefill?: { weight_kg: number; reps: number; rpe?: number | null };
  onSave: (data: { weight_kg: number; reps: number; is_warmup: boolean; is_bodyweight: boolean; rpe?: number | null }) => void;
  onDelete?: () => void;
  onStartRest?: () => void;
}

export function SetRow({
  set,
  setNumber,
  isNew = false,
  previousSet,
  prefill,
  onSave,
  onDelete,
  onStartRest,
}: SetRowProps) {
  const [weight, setWeight] = useState(set?.weight_kg?.toString() || '');
  const [reps, setReps] = useState(set?.reps?.toString() || '');
  const [isWarmup, setIsWarmup] = useState(set?.is_warmup || false);
  const [isBodyweight, setIsBodyweight] = useState(set?.is_bodyweight || false);
  const [rpe, setRpe] = useState<number | null>(set?.rpe ?? null);
  const [isEditing, setIsEditing] = useState(isNew);
  const [showSaveAnimation, setShowSaveAnimation] = useState(false);

  // Imperative prefill (e.g. user accepted AI suggestion). No auto-prefill from previousSet.
  useEffect(() => {
    if (isNew && prefill) {
      if (prefill.weight_kg === 0) {
        setIsBodyweight(true);
        setWeight('');
      } else {
        setWeight(prefill.weight_kg.toString());
      }
      setReps(prefill.reps.toString());
      if (prefill.rpe != null) setRpe(prefill.rpe);
    }
  }, [isNew, prefill]);

  // Sync state when set prop changes (for editing existing sets)
  useEffect(() => {
    if (set && !isNew) {
      setWeight(set.weight_kg?.toString() || '');
      setReps(set.reps?.toString() || '');
      setIsWarmup(set.is_warmup || false);
      setIsBodyweight(set.is_bodyweight || false);
      setRpe(set.rpe ?? null);
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
      rpe: isWarmup ? null : rpe,
    });

    setIsEditing(false);
    onStartRest?.();
  };

  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
    if (set) {
      setWeight(set.weight_kg?.toString() || '');
      setReps(set.reps?.toString() || '');
      setIsWarmup(set.is_warmup || false);
      setIsBodyweight(set.is_bodyweight || false);
    }
    setIsEditing(false);
  };

  const canSave = (isBodyweight || (weight && parseFloat(weight) >= 0)) && reps && parseInt(reps) > 0;

  // ---------- Saved set display (compact, clickable to edit) ----------
  if (!isEditing && !isNew) {
    return (
      <button
        type="button"
        onClick={handleEdit}
        className={cn(
          'w-full flex items-center gap-3 py-2.5 px-2 rounded-xl text-left',
          'transition-colors duration-150 active:bg-accent/60 hover:bg-accent/30 active:scale-[0.99]',
          isWarmup && 'bg-warning/5',
          showSaveAnimation && 'animate-success-flash'
        )}
      >
        <div className="w-7 h-7 flex items-center justify-center shrink-0 rounded-full bg-muted/60">
          {isWarmup ? (
            <Flame className="h-3.5 w-3.5 text-warning" />
          ) : (
            <span className="text-xs font-semibold text-muted-foreground">{setNumber}</span>
          )}
        </div>

        <div className="flex-1 flex items-baseline gap-2 min-w-0">
          <span className="text-base font-semibold tabular-nums">
            {isBodyweight ? 'BW' : `${weight || '-'}`}
            {!isBodyweight && weight && <span className="text-xs text-muted-foreground ml-0.5">kg</span>}
          </span>
          <span className="text-muted-foreground/60">×</span>
          <span className="text-base font-semibold tabular-nums">{reps || '-'}</span>
          <span className="text-xs text-muted-foreground">reps</span>
          {rpe != null && !isWarmup && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/15 text-foreground/80 ml-1">
              RPE {rpe}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          className="h-9 w-9 flex items-center justify-center rounded-full text-muted-foreground/60 active:bg-destructive/10 active:text-destructive shrink-0 transition-colors active:scale-90"
          aria-label="Ta bort set"
        >
          <X className="h-4 w-4" />
        </button>
      </button>
    );
  }

  // ---------- Editing / New set form ----------
  return (
    <div
      className={cn(
        'rounded-xl p-2 transition-all',
        isNew && 'animate-slide-in-bottom',
        isWarmup && 'bg-warning/5',
        showSaveAnimation && 'animate-success-flash'
      )}
    >
      {/* Hint row: previous set */}
      {isNew && previousSet && !isWarmup && (previousSet.weight_kg || previousSet.reps) && (
        <p className="text-[11px] text-muted-foreground px-1 mb-1.5">
          Förra: <span className="font-medium text-foreground/70">{previousSet.weight_kg ?? '-'}kg × {previousSet.reps ?? '-'}</span>
        </p>
      )}

      {/* Main input row */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 flex items-center justify-center shrink-0 rounded-full bg-muted/60">
          {isWarmup ? (
            <Flame className="h-3.5 w-3.5 text-warning" />
          ) : (
            <span className="text-xs font-semibold text-muted-foreground">{setNumber}</span>
          )}
        </div>

        {/* Weight */}
        <div className="flex-1 min-w-0 relative">
          <Input
            type="number"
            inputMode="decimal"
            placeholder={isBodyweight ? 'BW' : 'kg'}
            value={isBodyweight ? '' : weight}
            onChange={(e) => setWeight(e.target.value)}
            disabled={isBodyweight}
            onFocus={(e) => e.target.select()}
            className={cn(
              'h-12 text-center text-lg font-semibold tabular-nums bg-muted/70 border-0 rounded-xl focus:ring-2 focus:ring-primary',
              isBodyweight && 'bg-accent/60 text-accent-foreground'
            )}
          />
        </div>

        <span className="text-muted-foreground/50 font-medium">×</span>

        {/* Reps */}
        <div className="flex-1 min-w-0">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="reps"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            onFocus={(e) => e.target.select()}
            className="h-12 text-center text-lg font-semibold tabular-nums bg-muted/70 border-0 rounded-xl focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Save (large, thumb-friendly) */}
        <Button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className={cn(
            'h-12 w-12 p-0 rounded-xl shrink-0 transition-all duration-200 active:scale-90',
            canSave
              ? 'bg-success hover:bg-success/90 text-white shadow-sm animate-soft-glow'
              : 'bg-muted text-muted-foreground'
          )}
          aria-label="Spara set"
        >
          <Check className={cn('h-5 w-5', showSaveAnimation && 'animate-check-draw')} />
        </Button>
      </div>

      {/* Secondary toggles (chips) */}
      <div className="flex items-center gap-1.5 mt-2 px-1">
        <button
          type="button"
          onClick={() => setIsWarmup(!isWarmup)}
          className={cn(
            'h-7 px-2.5 rounded-full text-[11px] font-medium flex items-center gap-1 transition-colors',
            isWarmup
              ? 'bg-warning/20 text-warning'
              : 'bg-muted/50 text-muted-foreground active:bg-muted'
          )}
        >
          <Flame className={cn('h-3 w-3', isWarmup && 'fill-warning')} />
          Uppvärmning
        </button>

        <button
          type="button"
          onClick={() => setIsBodyweight(!isBodyweight)}
          className={cn(
            'h-7 px-2.5 rounded-full text-[11px] font-bold transition-colors',
            isBodyweight
              ? 'bg-accent text-accent-foreground'
              : 'bg-muted/50 text-muted-foreground active:bg-muted'
          )}
        >
          BW
        </button>

        <div className="flex-1" />

        {!isNew && (
          <button
            type="button"
            onClick={handleCancel}
            className="h-7 px-2.5 rounded-full text-[11px] font-medium bg-muted/50 text-muted-foreground active:bg-muted flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Avbryt
          </button>
        )}
      </div>

      {/* RPE chip row (hidden for warmup sets) */}
      {!isWarmup && (
        <div className="flex items-center gap-1.5 mt-2 px-1 overflow-x-auto">
          <span className="text-[10px] font-medium text-muted-foreground/70 shrink-0 mr-0.5">RPE</span>
          {[6, 7, 8, 9, 10].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRpe(rpe === value ? null : value)}
              aria-label={`RPE ${value}`}
              className={cn(
                'h-7 min-w-[28px] px-2 rounded-full text-[11px] font-semibold tabular-nums transition-colors shrink-0',
                rpe === value
                  ? 'bg-primary/25 text-foreground ring-1 ring-primary/40'
                  : 'bg-muted/40 text-muted-foreground/70 active:bg-muted'
              )}
            >
              {value}
            </button>
          ))}
          {rpe != null && (
            <button
              type="button"
              onClick={() => setRpe(null)}
              className="h-7 px-2 rounded-full text-[10px] text-muted-foreground/60 active:bg-muted shrink-0"
              aria-label="Rensa RPE"
            >
              Rensa
            </button>
          )}
        </div>
      )}
    </div>
  );
}
