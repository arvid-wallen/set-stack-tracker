import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExerciseSearch } from '@/components/workout/ExerciseSearch';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { WorkoutType, WORKOUT_TYPE_LABELS, Exercise } from '@/types/workout';
import {
  PlannedWorkout,
  PlannedExerciseInput,
  usePlannedWorkouts,
} from '@/hooks/usePlannedWorkouts';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workout?: PlannedWorkout | null;
  defaultDate?: string;
}

type Row = PlannedExerciseInput & { key: string };

export function PlannedWorkoutSheet({ open, onOpenChange, workout, defaultDate }: Props) {
  const { savePlanned } = usePlannedWorkouts();
  const [date, setDate] = useState('');
  const [type, setType] = useState<WorkoutType>('push');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!open) return;
    setDate(workout?.planned_date ?? defaultDate ?? new Date().toISOString().slice(0, 10));
    setType((workout?.workout_type as WorkoutType) ?? 'push');
    setTitle(workout?.title ?? '');
    setNotes(workout?.notes ?? '');
    setRows(
      (workout?.exercises ?? []).map((e) => ({
        key: e.id,
        exercise_id: e.exercise_id,
        exercise_name: e.exercise_name,
        target_sets: e.target_sets,
        target_reps: e.target_reps,
        target_weight_kg: e.target_weight_kg,
        target_rpe: e.target_rpe ?? null,
        notes: e.notes,
      })),
    );
  }, [open, workout, defaultDate]);

  const addExercise = (exercise: Exercise) => {
    setRows((prev) => [
      ...prev,
      {
        key: `${exercise.id}-${Date.now()}`,
        exercise_id: exercise.id,
        exercise_name: exercise.name,
        target_sets: 3,
        target_reps: '8-10',
        target_weight_kg: null,
        target_rpe: null,
        notes: null,
      },
    ]);
  };

  const update = (key: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const handleSave = async () => {
    await savePlanned.mutateAsync({
      id: workout?.id,
      date,
      workout_type: type,
      title: title.trim() || null,
      notes: notes.trim() || null,
      exercises: rows,
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] flex flex-col">
        <SheetHeader className="text-left">
          <SheetTitle>{workout ? 'Redigera planerat pass' : 'Planera pass'}</SheetTitle>
          <SheetDescription>
            Sätt datum, typ och målvärden. Passet dyker upp i kalendern och kan startas direkt.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="planned-date">Datum</Label>
                <Input
                  id="planned-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="planned-type">Typ</Label>
                <Select value={type} onValueChange={(v) => setType(v as WorkoutType)}>
                  <SelectTrigger id="planned-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(WORKOUT_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="planned-title">Titel (valfritt)</Label>
              <Input
                id="planned-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="t.ex. Ben med Tina"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Övningar</Label>
                <ExerciseSearch
                  onSelect={addExercise}
                  trigger={
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Lägg till
                    </Button>
                  }
                />
              </div>

              {rows.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Inga övningar tillagda än.
                </p>
              )}

              {rows.map((row) => (
                <div key={row.key} className="rounded-xl border border-border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span className="flex-1 font-medium text-sm">{row.exercise_name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Ta bort ${row.exercise_name}`}
                      onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Set</Label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={row.target_sets ?? ''}
                        onChange={(e) =>
                          update(row.key, {
                            target_sets: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Reps</Label>
                      <Input
                        value={row.target_reps ?? ''}
                        placeholder="8-10"
                        onChange={(e) => update(row.key, { target_reps: e.target.value || null })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Vikt (kg)</Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={row.target_weight_kg ?? ''}
                        onChange={(e) =>
                          update(row.key, {
                            target_weight_kg: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="planned-notes">Anteckningar</Label>
              <Textarea
                id="planned-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-3 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={savePlanned.isPending || !date || rows.length === 0}
          >
            Spara
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
