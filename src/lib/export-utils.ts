import { WorkoutWithDetails } from '@/hooks/useWorkoutHistory';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { WORKOUT_TYPE_LABELS, MUSCLE_GROUP_LABELS } from '@/types/workout';

interface ExportRow {
  datum: string;
  passTyp: string;
  varaktighet: string;
  betyg: string;
  övning: string;
  muskelgrupper: string;
  setNummer: string;
  viktKg: string;
  reps: string;
  warmup: string;
  kroppsvikt: string;
  cardioTid: string;
  cardioDistans: string;
  cardioKalorier: string;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

export function workoutsToRows(workouts: WorkoutWithDetails[]): ExportRow[] {
  const rows: ExportRow[] = [];

  for (const workout of workouts) {
    const baseData = {
      datum: format(new Date(workout.started_at), 'yyyy-MM-dd HH:mm', { locale: sv }),
      passTyp: workout.custom_type_name || WORKOUT_TYPE_LABELS[workout.workout_type],
      varaktighet: formatDuration(workout.duration_seconds),
      betyg: workout.rating ? `${workout.rating}/5` : '',
    };

    for (const exercise of workout.exercises) {
      const exerciseData = {
        övning: exercise.exercise_name,
        muskelgrupper: exercise.muscle_groups.map(mg => MUSCLE_GROUP_LABELS[mg]).join(', '),
      };

      if (exercise.is_cardio && exercise.cardio_log) {
        rows.push({
          ...baseData,
          ...exerciseData,
          setNummer: '',
          viktKg: '',
          reps: '',
          warmup: '',
          kroppsvikt: '',
          cardioTid: exercise.cardio_log.duration_seconds 
            ? `${Math.floor(exercise.cardio_log.duration_seconds / 60)} min` 
            : '',
          cardioDistans: exercise.cardio_log.distance_km 
            ? `${exercise.cardio_log.distance_km} km` 
            : '',
          cardioKalorier: exercise.cardio_log.calories?.toString() || '',
        });
      } else if (exercise.sets.length > 0) {
        for (const set of exercise.sets) {
          rows.push({
            ...baseData,
            ...exerciseData,
            setNummer: set.set_number.toString(),
            viktKg: set.weight_kg?.toString() || '',
            reps: set.reps?.toString() || '',
            warmup: set.is_warmup ? 'Ja' : 'Nej',
            kroppsvikt: set.is_bodyweight ? 'Ja' : 'Nej',
            cardioTid: '',
            cardioDistans: '',
            cardioKalorier: '',
          });
        }
      } else {
        // Exercise with no sets
        rows.push({
          ...baseData,
          ...exerciseData,
          setNummer: '',
          viktKg: '',
          reps: '',
          warmup: '',
          kroppsvikt: '',
          cardioTid: '',
          cardioDistans: '',
          cardioKalorier: '',
        });
      }
    }

    // Workout with no exercises
    if (workout.exercises.length === 0) {
      rows.push({
        ...baseData,
        övning: '',
        muskelgrupper: '',
        setNummer: '',
        viktKg: '',
        reps: '',
        warmup: '',
        kroppsvikt: '',
        cardioTid: '',
        cardioDistans: '',
        cardioKalorier: '',
      });
    }
  }

  return rows;
}

const CSV_HEADERS = [
  'Datum',
  'Pass-typ',
  'Varaktighet',
  'Betyg',
  'Övning',
  'Muskelgrupper',
  'Set',
  'Vikt (kg)',
  'Reps',
  'Warmup',
  'Kroppsvikt',
  'Cardio tid',
  'Cardio distans',
  'Cardio kalorier',
];

function escapeCSVValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function rowsToCSV(rows: ExportRow[]): string {
  const headerLine = CSV_HEADERS.map(escapeCSVValue).join(',');
  
  const dataLines = rows.map(row => [
    row.datum,
    row.passTyp,
    row.varaktighet,
    row.betyg,
    row.övning,
    row.muskelgrupper,
    row.setNummer,
    row.viktKg,
    row.reps,
    row.warmup,
    row.kroppsvikt,
    row.cardioTid,
    row.cardioDistans,
    row.cardioKalorier,
  ].map(escapeCSVValue).join(','));

  // BOM for Excel compatibility with Swedish characters
  const BOM = '\uFEFF';
  return BOM + [headerLine, ...dataLines].join('\n');
}

export function exportToCSV(workouts: WorkoutWithDetails[], filename?: string): void {
  const rows = workoutsToRows(workouts);
  const csvContent = rowsToCSV(rows);
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `gymloggen-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
