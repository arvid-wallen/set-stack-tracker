import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { WorkoutHistoryFilters } from '@/hooks/useWorkoutHistory';
import { WORKOUT_TYPE_LABELS, MUSCLE_GROUP_LABELS, WorkoutType, MuscleGroup } from '@/types/workout';

interface HistoryFiltersProps {
  filters: WorkoutHistoryFilters;
  onFiltersChange: (filters: WorkoutHistoryFilters) => void;
  onClear: () => void;
}

export function HistoryFilters({ filters, onFiltersChange, onClear }: HistoryFiltersProps) {
  const hasActiveFilters = 
    filters.workoutType !== 'all' || 
    filters.muscleGroup !== 'all' || 
    filters.rating !== 'all';

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <Select
        value={filters.workoutType}
        onValueChange={(value) => onFiltersChange({ ...filters, workoutType: value as WorkoutType | 'all' })}
      >
        <SelectTrigger className="w-[120px] h-9 text-sm shrink-0">
          <SelectValue placeholder="Passtyp" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alla typer</SelectItem>
          {Object.entries(WORKOUT_TYPE_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.muscleGroup}
        onValueChange={(value) => onFiltersChange({ ...filters, muscleGroup: value as MuscleGroup | 'all' })}
      >
        <SelectTrigger className="w-[130px] h-9 text-sm shrink-0">
          <SelectValue placeholder="Muskelgrupp" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alla muskler</SelectItem>
          {Object.entries(MUSCLE_GROUP_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={String(filters.rating)}
        onValueChange={(value) => onFiltersChange({ ...filters, rating: value === 'all' ? 'all' : Number(value) })}
      >
        <SelectTrigger className="w-[100px] h-9 text-sm shrink-0">
          <SelectValue placeholder="Betyg" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alla betyg</SelectItem>
          {[5, 4, 3, 2, 1].map((rating) => (
            <SelectItem key={rating} value={String(rating)}>
              {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-9 px-2 shrink-0 text-muted-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Rensa
        </Button>
      )}
    </div>
  );
}
