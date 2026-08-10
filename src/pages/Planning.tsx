import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarPlus, Pencil, Play, Sparkles, Trash2 } from 'lucide-react';
import { usePlannedWorkouts, PlannedWorkout } from '@/hooks/usePlannedWorkouts';
import { useWorkout } from '@/hooks/useWorkout';
import { WORKOUT_TYPE_LABELS } from '@/types/workout';
import { PlannedWorkoutSheet } from '@/components/planning/PlannedWorkoutSheet';

function dateLabel(date: string | null) {
  if (!date) return 'Utan datum';
  const d = parseISO(date);
  if (isToday(d)) return 'Idag';
  if (isTomorrow(d)) return 'Imorgon';
  return format(d, 'EEEE d MMM', { locale: sv });
}

export default function Planning() {
  const { plannedWorkouts, isLoading, deletePlanned } = usePlannedWorkouts();
  const { activeWorkout, startPlannedWorkout } = useWorkout();
  const [editing, setEditing] = useState<PlannedWorkout | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const openNew = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  const openEdit = (workout: PlannedWorkout) => {
    setEditing(workout);
    setSheetOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>Planerade pass | GymBro3000</title>
        <meta name="description" content="Planera kommande träningspass med mål för set, reps och vikt." />
      </Helmet>

      <div className="min-h-screen bg-background pb-32">
        <header className="ios-nav-bar sticky top-0 z-30">
          <div className="px-5 py-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold">Planerat</h1>
            <Button size="sm" className="gap-1.5 rounded-ios-md" onClick={openNew}>
              <CalendarPlus className="h-4 w-4" aria-hidden="true" />
              Nytt pass
            </Button>
          </div>
        </header>

        <div className="px-5 py-4 space-y-3">
          {isLoading && (
            <>
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
            </>
          )}

          {!isLoading && plannedWorkouts.length === 0 && (
            <Card className="p-6 text-center space-y-2">
              <p className="font-medium">Inga planerade pass</p>
              <p className="text-sm text-muted-foreground">
                Planera själv, eller låt din AI-coach lägga in pass via MCP-kopplingen.
              </p>
              <Button className="mt-2" onClick={openNew}>
                Planera ett pass
              </Button>
            </Card>
          )}

          {plannedWorkouts.map((workout) => (
            <Card key={workout.id} className="p-4 space-y-3 animate-fade-in">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {dateLabel(workout.planned_date)}
                  </p>
                  <h2 className="font-heading text-lg truncate">
                    {workout.title || WORKOUT_TYPE_LABELS[workout.workout_type]}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="secondary">{WORKOUT_TYPE_LABELS[workout.workout_type]}</Badge>
                    <Badge variant="outline">{workout.exercises.length} övningar</Badge>
                    {workout.source === 'mcp' && (
                      <Badge variant="outline" className="gap-1">
                        <Sparkles className="h-3 w-3" aria-hidden="true" />
                        Från coach
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Redigera planerat pass"
                    onClick={() => openEdit(workout)}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Ta bort planerat pass"
                    onClick={() => deletePlanned.mutate(workout.id)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <ul className="space-y-1">
                {workout.exercises.map((e) => (
                  <li key={e.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{e.exercise_name}</span>
                    <span className="text-muted-foreground shrink-0 ml-3">
                      {[
                        e.target_sets ? `${e.target_sets} set` : null,
                        e.target_reps ? `${e.target_reps} reps` : null,
                        e.target_weight_kg ? `${e.target_weight_kg} kg` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </li>
                ))}
              </ul>

              {workout.notes && (
                <p className="text-sm text-muted-foreground">{workout.notes}</p>
              )}

              <Button
                className="w-full gap-2 active:scale-[0.98] transition-transform"
                disabled={!!activeWorkout}
                onClick={() => startPlannedWorkout(workout.id)}
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                {activeWorkout ? 'Avsluta pågående pass först' : 'Starta passet'}
              </Button>
            </Card>
          ))}
        </div>

        <PlannedWorkoutSheet open={sheetOpen} onOpenChange={setSheetOpen} workout={editing} />
        <BottomNav />
      </div>
    </>
  );
}
