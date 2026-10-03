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
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
      <Select
        value={filters.workoutType}
        onValueChange={(value) => onFiltersChange({ ...filters, workoutType: value as WorkoutType | 'all' })}
      >
        <SelectTrigger className="h-9 min-w-0 px-2.5 text-xs rounded-full [&>span]:truncate">
          <SelectValue placeholder="Passtyp" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alla pass</SelectItem>
          {Object.entries(WORKOUT_TYPE_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.muscleGroup}
        onValueChange={(value) => onFiltersChange({ ...filters, muscleGroup: value as MuscleGroup | 'all' })}
      >
        <SelectTrigger className="h-9 min-w-0 px-2.5 text-xs rounded-full [&>span]:truncate">
          <SelectValue placeholder="Muskelgrupp" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Muskler</SelectItem>
          {Object.entries(MUSCLE_GROUP_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={String(filters.rating)}
        onValueChange={(value) => onFiltersChange({ ...filters, rating: value === 'all' ? 'all' : Number(value) })}
      >
        <SelectTrigger className="h-9 min-w-0 px-2.5 text-xs rounded-full [&>span]:truncate">
          <SelectValue placeholder="Betyg" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Betyg</SelectItem>
          {[5, 4, 3, 2, 1].map((rating) => (
            <SelectItem key={rating} value={String(rating)}>
              {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      </div>
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-8 px-2 text-xs text-muted-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Rensa
        </Button>
      )}
    </div>
  );
}
