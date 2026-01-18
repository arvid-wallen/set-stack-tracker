import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DurationInputProps {
  value: number; // seconds
  onChange: (seconds: number) => void;
  className?: string;
}

export function DurationInput({ value, onChange, className }: DurationInputProps) {
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);

  const handleHoursChange = (newHours: number) => {
    const clampedHours = Math.max(0, Math.min(23, newHours || 0));
    onChange(clampedHours * 3600 + minutes * 60);
  };

  const handleMinutesChange = (newMinutes: number) => {
    const clampedMinutes = Math.max(0, Math.min(59, newMinutes || 0));
    onChange(hours * 3600 + clampedMinutes * 60);
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min={0}
            max={23}
            value={hours}
            onChange={(e) => handleHoursChange(parseInt(e.target.value))}
            className="w-16 h-10 text-center font-mono"
          />
          <Label className="text-sm text-muted-foreground">h</Label>
        </div>
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min={0}
            max={59}
            value={minutes}
            onChange={(e) => handleMinutesChange(parseInt(e.target.value))}
            className="w-16 h-10 text-center font-mono"
          />
          <Label className="text-sm text-muted-foreground">min</Label>
        </div>
      </div>
    </div>
  );
}
