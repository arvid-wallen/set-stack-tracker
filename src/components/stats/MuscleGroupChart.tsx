import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { MuscleGroup } from '@/types/workout';

interface MuscleGroupChartProps {
  data: Array<{
    muscleGroup: MuscleGroup;
    label: string;
    sets: number;
    volume: number;
    percentage: number;
    color: string;
  }>;
}

export function MuscleGroupChart({ data }: MuscleGroupChartProps) {
  const topGroups = data.slice(0, 6);

  const formatVolume = (volume: number) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}t`;
    }
    return `${volume.toFixed(0)}kg`;
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Muskelgrupper
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="space-y-4">
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topGroups}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="sets"
                    nameKey="label"
                  >
                    {topGroups.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number, name: string) => [`${value} set`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {topGroups.map((group) => (
                <div key={group.muscleGroup} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="text-muted-foreground">{group.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{group.sets} set</span>
                      <span className="text-muted-foreground">
                        {formatVolume(group.volume)}
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={group.percentage}
                    className="h-1"
                    style={{ 
                      '--progress-background': group.color 
                    } as React.CSSProperties}
                  />
                </div>
              ))}
            </div>
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
