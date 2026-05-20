import { useState, useEffect } from 'react';

interface WorkoutTimerProps {
  startedAt: string;
  className?: string;
  isPaused?: boolean;
  pausedAt?: number | null;
  totalPausedMs?: number;
}

export function WorkoutTimer({
  startedAt,
  className,
  isPaused = false,
  pausedAt = null,
  totalPausedMs = 0,
}: WorkoutTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startTime = new Date(startedAt).getTime();

    const updateElapsed = () => {
      const reference = isPaused && pausedAt ? pausedAt : Date.now();
      const ms = reference - startTime - totalPausedMs;
      setElapsed(Math.max(0, Math.floor(ms / 1000)));
    };

    updateElapsed();
    if (isPaused) return; // frozen while paused
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [startedAt, isPaused, pausedAt, totalPausedMs]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`timer-display text-3xl font-bold text-primary ${className}`}>
      {formatTime(elapsed)}
    </div>
  );
}
