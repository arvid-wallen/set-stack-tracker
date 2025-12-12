import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

interface ExerciseProgressChartProps {
  data: Array<{
    date: string;
    dateLabel: string;
    bestWeight: number;
    estimated1RM: number;
    totalVolume: number;
  }>;
  targetWeight?: number;
}

type ChartMode = 'weight' | '1rm' | 'volume';

export function ExerciseProgressChart({ data, targetWeight }: ExerciseProgressChartProps) {
  const [mode, setMode] = useState<ChartMode>('weight');

  const dataKey = mode === 'weight' ? 'bestWeight' : mode === '1rm' ? 'estimated1RM' : 'totalVolume';
  const label = mode === 'weight' ? 'Vikt (kg)' : mode === '1rm' ? 'Est. 1RM (kg)' : 'Volym (kg)';

  const formatValue = (value: number) => {
    if (mode === 'volume' && value >= 1000) {
      return `${(value / 1000).toFixed(1)}t`;
    }
    return `${value}kg`;
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Progression
          </CardTitle>
          <Tabs value={mode} onValueChange={(v) => setMode(v as ChartMode)}>
            <TabsList className="h-7">
              <TabsTrigger value="weight" className="text-xs px-2 h-6">Vikt</TabsTrigger>
              <TabsTrigger value="1rm" className="text-xs px-2 h-6">1RM</TabsTrigger>
              <TabsTrigger value="volume" className="text-xs px-2 h-6">Volym</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `${v}`}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [formatValue(value), label]}
                />
                {targetWeight && mode === 'weight' && (
                  <ReferenceLine
                    y={targetWeight}
                    stroke="hsl(var(--chart-5))"
                    strokeDasharray="5 5"
                    label={{
                      value: `Mål: ${targetWeight}kg`,
                      position: 'right',
                      fill: 'hsl(var(--chart-5))',
                      fontSize: 10,
                    }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey={dataKey}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
            Ingen data ännu
          </div>
        )}
      </CardContent>
    </Card>
  );
}
