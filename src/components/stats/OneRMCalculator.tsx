import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { calculate1RM } from '@/hooks/useExerciseStats';

export function OneRMCalculator() {
  const [weight, setWeight] = useState<string>('');
  const [reps, setReps] = useState<string>('');

  const weightNum = parseFloat(weight) || 0;
  const repsNum = parseInt(reps) || 0;
  const estimated1RM = calculate1RM(weightNum, repsNum);

  // Calculate percentages for rep ranges
  const repPercentages = [
    { reps: 1, percentage: 100 },
    { reps: 2, percentage: 95 },
    { reps: 3, percentage: 93 },
    { reps: 4, percentage: 90 },
    { reps: 5, percentage: 87 },
    { reps: 6, percentage: 85 },
    { reps: 8, percentage: 80 },
    { reps: 10, percentage: 75 },
    { reps: 12, percentage: 70 },
  ];

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          1RM-kalkylator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="weight" className="text-xs">Vikt (kg)</Label>
            <Input
              id="weight"
              type="number"
              inputMode="decimal"
              placeholder="80"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reps" className="text-xs">Reps</Label>
            <Input
              id="reps"
              type="number"
              inputMode="numeric"
              placeholder="5"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="h-10"
            />
          </div>
        </div>

        {estimated1RM > 0 && (
          <div className="space-y-3">
            <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs text-muted-foreground mb-1">Estimerat 1RM</p>
              <p className="text-3xl font-bold text-primary">{estimated1RM} kg</p>
              <p className="text-xs text-muted-foreground mt-1">
                Baserat på Epley-formeln
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground mb-2">Rep-tabell</p>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {repPercentages.map(({ reps, percentage }) => {
                  const targetWeight = Math.round(estimated1RM * (percentage / 100));
                  return (
                    <div
                      key={reps}
                      className="flex justify-between p-2 rounded bg-muted/30"
                    >
                      <span className="text-muted-foreground">{reps} rep</span>
                      <span className="font-medium">{targetWeight}kg</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
