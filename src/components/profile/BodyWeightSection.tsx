import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Scale, TrendingDown, TrendingUp, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useBodyWeight } from '@/hooks/useBodyWeight';

export function BodyWeightSection() {
  const { entries, latest, change, isLoading, logWeight, deleteWeight } = useBodyWeight();
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const chartData = [...entries]
    .reverse()
    .slice(-60)
    .map((e) => ({
      date: format(parseISO(e.logged_at), 'd MMM', { locale: sv }),
      weight: e.weight_kg,
    }));

  const handleSave = async () => {
    const weight = Number(value.replace(',', '.'));
    if (!weight || weight <= 0) return;
    await logWeight.mutateAsync({ weight_kg: weight, logged_at: date });
    setValue('');
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Scale className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <h2 className="font-heading text-lg">Kroppsvikt</h2>
      </div>

      <Card className="p-4 space-y-4">
        {isLoading ? (
          <Skeleton className="h-24 rounded-xl" />
        ) : (
          <>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-semibold">
                {latest ? `${latest.weight_kg} kg` : '—'}
              </span>
              {change !== null && change !== 0 && (
                <span
                  className={`flex items-center gap-1 text-sm ${
                    change < 0 ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {change < 0 ? (
                    <TrendingDown className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <TrendingUp className="h-4 w-4" aria-hidden="true" />
                  )}
                  {change > 0 ? '+' : ''}
                  {change} kg
                </span>
              )}
            </div>

            {chartData.length > 1 && (
              <div className="h-32 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" hide />
                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 12,
                      }}
                      formatter={(v: number) => [`${v} kg`, 'Vikt']}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
              <div className="space-y-1">
                <Label htmlFor="bw-value" className="text-xs text-muted-foreground">
                  Vikt (kg)
                </Label>
                <Input
                  id="bw-value"
                  inputMode="decimal"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="82.5"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bw-date" className="text-xs text-muted-foreground">
                  Datum
                </Label>
                <Input
                  id="bw-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <Button onClick={handleSave} disabled={!value || logWeight.isPending}>
                Spara
              </Button>
            </div>

            {entries.length > 0 && (
              <ul className="divide-y divide-border">
                {entries.slice(0, 5).map((e) => (
                  <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-muted-foreground">
                      {format(parseISO(e.logged_at), 'd MMM yyyy', { locale: sv })}
                    </span>
                    <span className="flex items-center gap-2">
                      {e.weight_kg} kg
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        aria-label="Ta bort viktinlägg"
                        onClick={() => deleteWeight.mutate(e.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Card>
    </section>
  );
}
