import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecovery, MuscleRecovery } from '@/hooks/useRecovery';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

function statusStyles(status: MuscleRecovery['status']) {
  switch (status) {
    case 'recent':
      return 'bg-warning/20 text-foreground border-warning/30';
    case 'recovering':
      return 'bg-primary/15 text-foreground border-primary/25';
    case 'fresh':
      return 'bg-success/20 text-foreground border-success/30';
    case 'untrained':
      return 'bg-muted text-muted-foreground border-border';
  }
}

function daysLabel(d: number | null) {
  if (d === null) return '—';
  if (d === 0) return 'idag';
  if (d === 1) return 'igår';
  return `${d}d`;
}

function VolumeTrend({ last, prev }: { last: number; prev: number }) {
  if (last === 0 && prev === 0) return null;
  if (prev === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-success">
        <TrendingUp className="h-3 w-3" aria-hidden="true" />
        ny
      </span>
    );
  }
  const diff = last - prev;
  if (Math.abs(diff) <= 1) {
    return (
      <span className="inline-flex items-center gap-0.5 text-muted-foreground">
        <Minus className="h-3 w-3" aria-hidden="true" />
      </span>
    );
  }
  if (diff > 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-success">
        <TrendingUp className="h-3 w-3" aria-hidden="true" />+{diff}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 text-destructive">
      <TrendingDown className="h-3 w-3" aria-hidden="true" />
      {diff}
    </span>
  );
}

export function MuscleRecoveryHeatmap() {
  const { groups, isLoading } = useRecovery();

  if (isLoading) {
    return <Skeleton className="h-[220px] rounded-2xl" />;
  }

  return (
    <Card className="rounded-2xl shadow-ios">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Återhämtning per muskelgrupp</CardTitle>
        <p className="text-xs text-muted-foreground">
          Dagar sedan senaste set · veckovolym jämfört med föregående vecka
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {groups.map((g) => (
            <div
              key={g.group}
              className={cn(
                'rounded-ios-md border px-3 py-2.5 flex flex-col gap-1',
                statusStyles(g.status)
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{g.label}</span>
                <span className="text-xs font-semibold tabular-nums">
                  {daysLabel(g.daysSince)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="tabular-nums">{g.setsLast7} set / 7d</span>
                <VolumeTrend last={g.setsLast7} prev={g.setsPrev7} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-warning/60" />
            tränat senaste 1 d
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-primary/60" />
            2–3 d sedan
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-success/60" />
            ≥4 d redo
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
            otränat 30 d
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
