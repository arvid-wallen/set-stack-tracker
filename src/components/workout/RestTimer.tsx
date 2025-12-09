import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RestTimerProps {
  initialSeconds?: number;
  onComplete?: () => void;
  onClose?: () => void;
  className?: string;
}

const PRESET_TIMES = [60, 90, 120, 180];

export function RestTimer({ 
  initialSeconds = 90, 
  onComplete, 
  onClose,
  className 
}: RestTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState(initialSeconds);

  useEffect(() => {
    if (!isRunning || seconds <= 0) return;

    const interval = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, seconds, onComplete]);

  const handleReset = (time: number) => {
    setSelectedPreset(time);
    setSeconds(time);
    setIsRunning(true);
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (seconds / selectedPreset) * 100;

  return (
    <div className={cn(
      "fixed bottom-20 left-4 right-4 glass rounded-2xl p-4 z-40 animate-slide-up",
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">Vila</span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="timer-display text-2xl font-bold min-w-[80px] text-right">
          {formatTime(seconds)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10"
          onClick={() => setIsRunning(!isRunning)}
        >
          {isRunning ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>

        <div className="flex gap-2 flex-1">
          {PRESET_TIMES.map(time => (
            <Button
              key={time}
              variant={selectedPreset === time ? "default" : "outline"}
              size="sm"
              className="flex-1 text-xs"
              onClick={() => handleReset(time)}
            >
              {time}s
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}