import { useState } from 'react';
import { Target, Plus, Trash2, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { format, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';
import { UseMutationResult } from '@tanstack/react-query';

interface GoalWithProgress {
  id: string;
  target_weight_kg: number | null;
  target_reps: number | null;
  target_date: string | null;
  achieved: boolean;
  notes: string | null;
  currentBest: number;
  progress: number;
  remaining: number;
}

interface ExerciseGoalsProps {
  goals: GoalWithProgress[];
  addGoal: UseMutationResult<void, Error, {
    target_weight_kg: number;
    target_reps?: number;
    target_date?: string;
    notes?: string;
  }, unknown>;
  deleteGoal: UseMutationResult<void, Error, string, unknown>;
}

export function ExerciseGoals({ goals, addGoal, deleteGoal }: ExerciseGoalsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [targetWeight, setTargetWeight] = useState('');
  const [targetReps, setTargetReps] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetWeight) return;

    await addGoal.mutateAsync({
      target_weight_kg: parseFloat(targetWeight),
      target_reps: targetReps ? parseInt(targetReps) : undefined,
      target_date: targetDate || undefined,
      notes: notes || undefined,
    });

    setTargetWeight('');
    setTargetReps('');
    setTargetDate('');
    setNotes('');
    setIsOpen(false);
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Target className="h-4 w-4" />
            Målsättningar
          </CardTitle>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nytt mål</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="target-weight" className="text-xs">
                      Målvikt (kg) *
                    </Label>
                    <Input
                      id="target-weight"
                      type="number"
                      inputMode="decimal"
                      placeholder="100"
                      value={targetWeight}
                      onChange={(e) => setTargetWeight(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="target-reps" className="text-xs">
                      Reps (valfritt)
                    </Label>
                    <Input
                      id="target-reps"
                      type="number"
                      inputMode="numeric"
                      placeholder="1"
                      value={targetReps}
                      onChange={(e) => setTargetReps(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="target-date" className="text-xs">
                    Måldatum (valfritt)
                  </Label>
                  <Input
                    id="target-date"
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="notes" className="text-xs">
                    Anteckningar (valfritt)
                  </Label>
                  <Input
                    id="notes"
                    placeholder="T.ex. '1RM mål för tävling'"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={addGoal.isPending}>
                  {addGoal.isPending ? 'Sparar...' : 'Spara mål'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {goals.length > 0 ? (
          <div className="space-y-3">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className={`p-3 rounded-lg border ${
                  goal.achieved
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-muted/30 border-border/50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">
                        {goal.target_weight_kg}kg
                      </span>
                      {goal.target_reps && (
                        <span className="text-muted-foreground">
                          × {goal.target_reps} reps
                        </span>
                      )}
                      {goal.achieved && (
                        <Badge variant="default" className="bg-green-500 text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          Uppnått
                        </Badge>
                      )}
                    </div>
                    {goal.target_date && (
                      <p className="text-xs text-muted-foreground">
                        Mål: {format(parseISO(goal.target_date), 'd MMMM yyyy', { locale: sv })}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteGoal.mutate(goal.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {!goal.achieved && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        Nuvarande: {goal.currentBest}kg
                      </span>
                      <span className="font-medium">
                        {goal.progress.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                    {goal.remaining > 0 && (
                      <p className="text-xs text-muted-foreground text-right">
                        {goal.remaining.toFixed(1)}kg kvar
                      </p>
                    )}
                  </div>
                )}

                {goal.notes && (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    {goal.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Inga mål satta ännu</p>
            <p className="text-xs">Klicka + för att lägga till ett mål</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
