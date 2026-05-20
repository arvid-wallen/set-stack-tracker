import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ExerciseProgressChart } from '@/components/stats/ExerciseProgressChart';
import { PersonalRecords } from '@/components/stats/PersonalRecords';
import { useExerciseStats } from '@/hooks/useExerciseStats';
import { Skeleton } from '@/components/ui/skeleton';
import { Dumbbell, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';

interface ExerciseHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseId: string | null;
  exerciseName: string;
}

export function ExerciseHistorySheet({
  open,
  onOpenChange,
  exerciseId,
  exerciseName,
}: ExerciseHistorySheetProps) {
  const { history, personalRecords, isLoading } = useExerciseStats(open ? exerciseId : null);

  const recent = [...history].reverse().slice(0, 10);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92vh] p-0 rounded-t-3xl flex flex-col safe-bottom"
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/30 text-left">
          <SheetTitle className="text-lg font-heading flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            {exerciseName}
          </SheetTitle>
          <p className="text-xs text-muted-foreground">Historik & trend</p>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-5 space-y-5">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-[240px] rounded-2xl" />
                <Skeleton className="h-[160px] rounded-2xl" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Dumbbell className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Ingen historik ännu</p>
                <p className="text-xs mt-1 opacity-70">
                  Logga övningen för att se trend här
                </p>
              </div>
            ) : (
              <>
                <ExerciseProgressChart data={history} />

                <PersonalRecords records={personalRecords} />

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">
                    Senaste pass
                  </h3>
                  <div className="space-y-2">
                    {recent.map((session, idx) => {
                      const prev = recent[idx + 1];
                      let trend: 'up' | 'down' | 'flat' = 'flat';
                      if (prev) {
                        if (session.bestWeight > prev.bestWeight) trend = 'up';
                        else if (session.bestWeight < prev.bestWeight) trend = 'down';
                      }
                      const TrendIcon =
                        trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
                      const trendClass =
                        trend === 'up'
                          ? 'text-green-500'
                          : trend === 'down'
                          ? 'text-destructive'
                          : 'text-muted-foreground';

                      return (
                        <div
                          key={session.date}
                          className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/50"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium">
                              {format(parseISO(session.date), 'EEE d MMM', { locale: sv })}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {session.sets.length} set · vol{' '}
                              {session.totalVolume >= 1000
                                ? `${(session.totalVolume / 1000).toFixed(1)}t`
                                : `${session.totalVolume}kg`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="secondary" className="rounded-full font-mono">
                              {session.bestWeight}kg × {session.bestReps}
                            </Badge>
                            <TrendIcon className={`h-4 w-4 ${trendClass}`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
