import { format, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';
import { History } from 'lucide-react';
import { useRecentExerciseSessions } from '@/hooks/useRecentExerciseSessions';

interface Props {
  exerciseId: string;
  currentSessionId: string;
  onOpenFull: () => void;
}

export function RecentHistoryStrip({ exerciseId, currentSessionId, onOpenFull }: Props) {
  const { data, isLoading } = useRecentExerciseSessions(exerciseId, currentSessionId, 3);

  if (isLoading) return <div className="h-12 rounded-xl bg-muted/40 animate-pulse" />;
  if (!data || data.length === 0) {
    return <p className="text-xs text-muted-foreground px-1">Första gången du kör den här övningen</p>;
  }

  return (
    <button
      type="button"
      onClick={onOpenFull}
      className="w-full text-left rounded-xl bg-muted/40 border border-border/40 px-3 py-2 space-y-1.5 active:scale-[0.99] transition-transform"
      aria-label="Senaste passen, visa full historik"
    >
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        <History className="h-3 w-3" aria-hidden="true" />
        Senaste passen
      </div>
      {data.map((s, i) => (
        <div key={s.date} className="flex items-baseline gap-2 min-w-0">
          <span className="text-xs text-muted-foreground w-14 shrink-0">
            {format(parseISO(s.date), 'd MMM', { locale: sv })}
          </span>
          <span className={`text-sm font-mono truncate ${i === 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
            {s.sets.map((x) => `${x.weight_kg ?? 0}×${x.reps ?? 0}`).join('  ')}
          </span>
        </div>
      ))}
    </button>
  );
}
