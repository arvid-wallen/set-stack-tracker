import { useState, useCallback } from 'react';
import { Check, Timer, MapPin, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardioLog, CardioType } from '@/types/workout';
import { cn } from '@/lib/utils';

interface CardioLogRowProps {
  cardioLog?: CardioLog;
  cardioType: CardioType;
  onSave: (data: Partial<CardioLog>) => void;
  onUpdate?: (data: Partial<CardioLog>) => void;
  onDelete?: () => void;
}

const QUICK_TIMES = [5, 10, 15, 20, 30, 45, 60];

export function CardioLogRow({
  cardioLog,
  cardioType,
  onSave,
  onUpdate,
  onDelete,
}: CardioLogRowProps) {
  const [minutes, setMinutes] = useState(() => 
    cardioLog?.duration_seconds ? Math.floor(cardioLog.duration_seconds / 60) : 0
  );
  const [seconds, setSeconds] = useState(() =>
    cardioLog?.duration_seconds ? cardioLog.duration_seconds % 60 : 0
  );
  const [distance, setDistance] = useState(() => 
    cardioLog?.distance_km?.toString() || ''
  );
  const [calories, setCalories] = useState(() =>
    cardioLog?.calories?.toString() || ''
  );
  const [isSaved, setIsSaved] = useState(!!cardioLog);

  const totalSeconds = minutes * 60 + seconds;
  const distanceNum = parseFloat(distance) || 0;

  // Calculate pace (min/km)
  const pace = distanceNum > 0 && totalSeconds > 0
    ? totalSeconds / 60 / distanceNum
    : null;

  const formatPace = (paceMinutes: number) => {
    const mins = Math.floor(paceMinutes);
    const secs = Math.round((paceMinutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')} /km`;
  };

  const handleSave = useCallback(() => {
    const data: Partial<CardioLog> = {
      cardio_type: cardioType,
      duration_seconds: totalSeconds > 0 ? totalSeconds : null,
      distance_km: distanceNum > 0 ? distanceNum : null,
      calories: calories ? parseInt(calories) : null,
    };

    if (cardioLog && onUpdate) {
      onUpdate(data);
    } else {
      onSave(data);
    }
    setIsSaved(true);
  }, [cardioType, totalSeconds, distanceNum, calories, cardioLog, onUpdate, onSave]);

  const handleQuickTime = (mins: number) => {
    setMinutes(mins);
    setSeconds(0);
  };

  const isValid = totalSeconds > 0 || distanceNum > 0;

  return (
    <div className="space-y-4 py-4">
      {/* Time input */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Timer className="h-4 w-4" />
          <span>Tid</span>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Min"
            value={minutes || ''}
            onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
            className="w-20 text-center text-lg font-mono"
          />
          <span className="text-muted-foreground">:</span>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Sek"
            value={seconds || ''}
            onChange={(e) => setSeconds(Math.min(59, parseInt(e.target.value) || 0))}
            className="w-20 text-center text-lg font-mono"
            max={59}
          />
        </div>
        {/* Quick time buttons */}
        <div className="flex flex-wrap gap-1">
          {QUICK_TIMES.map((mins) => (
            <Button
              key={mins}
              variant={minutes === mins && seconds === 0 ? "default" : "outline"}
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={() => handleQuickTime(mins)}
            >
              {mins}m
            </Button>
          ))}
        </div>
      </div>

      {/* Distance input */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>Distans</span>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="decimal"
            step="0.1"
            placeholder="0.0"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className="w-24 text-center text-lg font-mono"
          />
          <span className="text-muted-foreground">km</span>
        </div>
      </div>

      {/* Pace display */}
      {pace && (
        <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg px-3 py-2">
          <span className="text-muted-foreground">Tempo:</span>
          <span className="font-mono font-medium">{formatPace(pace)}</span>
        </div>
      )}

      {/* Calories input (optional) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Flame className="h-4 w-4" />
          <span>Kalorier (valfritt)</span>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            className="w-24 text-center text-lg font-mono"
          />
          <span className="text-muted-foreground">kcal</span>
        </div>
      </div>

      {/* Save button */}
      <Button
        onClick={handleSave}
        disabled={!isValid}
        className={cn(
          "w-full h-12",
          isSaved && "bg-green-600 hover:bg-green-700"
        )}
      >
        <Check className="h-5 w-5 mr-2" />
        {isSaved ? 'Uppdatera' : 'Spara cardio'}
      </Button>
    </div>
  );
}
