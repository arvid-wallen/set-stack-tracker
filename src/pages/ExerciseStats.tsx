import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Dumbbell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/layout/BottomNav';
import { ExerciseSelector } from '@/components/stats/ExerciseSelector';
import { ExerciseProgressChart } from '@/components/stats/ExerciseProgressChart';
import { PersonalRecords } from '@/components/stats/PersonalRecords';
import { OneRMCalculator } from '@/components/stats/OneRMCalculator';
import { ExerciseGoals } from '@/components/stats/ExerciseGoals';
import { useExerciseStats } from '@/hooks/useExerciseStats';
import { useExercises } from '@/hooks/useExercises';
import { Skeleton } from '@/components/ui/skeleton';
import { MUSCLE_GROUP_LABELS } from '@/types/workout';
import { Badge } from '@/components/ui/badge';

export default function ExerciseStats() {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const { exercises } = useExercises();
  const { history, personalRecords, goals, isLoading, addGoal, deleteGoal } = useExerciseStats(selectedExerciseId);

  const selectedExercise = exercises?.find((e) => e.id === selectedExerciseId);
  const targetWeight = goals.find((g) => !g.achieved)?.target_weight_kg || undefined;

  return (
    <>
      <Helmet>
        <title>Övningsstatistik - Gymloggen</title>
        <meta name="description" content="Se detaljerad statistik per övning" />
      </Helmet>

      <div className="min-h-screen bg-background pb-20">
        <div className="px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/stats">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Övningsstatistik</h1>
              <p className="text-sm text-muted-foreground">
                Välj övning för att se progression
              </p>
            </div>
          </div>

          {/* Exercise Selector */}
          {!selectedExerciseId ? (
            <ExerciseSelector
              selectedId={selectedExerciseId}
              onSelect={setSelectedExerciseId}
            />
          ) : (
            <>
              {/* Selected Exercise Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Dumbbell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">{selectedExercise?.name}</h2>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {selectedExercise?.muscle_groups.map((mg) => (
                        <Badge key={mg} variant="secondary" className="text-xs">
                          {MUSCLE_GROUP_LABELS[mg]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedExerciseId(null)}
                >
                  Byt övning
                </Button>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-[250px]" />
                  <Skeleton className="h-[200px]" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Progress Chart */}
                  <ExerciseProgressChart 
                    data={history} 
                    targetWeight={targetWeight}
                  />

                  {/* Personal Records */}
                  <PersonalRecords records={personalRecords} />

                  {/* Goals */}
                  <ExerciseGoals
                    goals={goals}
                    addGoal={addGoal}
                    deleteGoal={deleteGoal}
                  />

                  {/* 1RM Calculator */}
                  <OneRMCalculator />
                </div>
              )}
            </>
          )}
        </div>

        <BottomNav />
      </div>
    </>
  );
}
