import { useState } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  Footprints, 
  Activity, 
  Heart, 
  User, 
  Dumbbell,
  ChevronRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { WorkoutType, WORKOUT_TYPE_LABELS } from '@/types/workout';
import { cn } from '@/lib/utils';

interface WorkoutTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: WorkoutType, customName?: string) => void;
}

const WORKOUT_TYPES: { type: WorkoutType; icon: React.ReactNode; color: string }[] = [
  { type: 'push', icon: <ArrowUp className="h-6 w-6" />, color: 'text-red-500' },
  { type: 'pull', icon: <ArrowDown className="h-6 w-6" />, color: 'text-blue-500' },
  { type: 'legs', icon: <Footprints className="h-6 w-6" />, color: 'text-green-500' },
  { type: 'upper', icon: <User className="h-6 w-6" />, color: 'text-purple-500' },
  { type: 'lower', icon: <Footprints className="h-6 w-6" />, color: 'text-orange-500' },
  { type: 'full_body', icon: <Activity className="h-6 w-6" />, color: 'text-yellow-500' },
  { type: 'cardio', icon: <Heart className="h-6 w-6" />, color: 'text-pink-500' },
  { type: 'custom', icon: <Dumbbell className="h-6 w-6" />, color: 'text-muted-foreground' },
];

export function WorkoutTypeSelector({ isOpen, onClose, onSelect }: WorkoutTypeSelectorProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');

  const handleSelect = (type: WorkoutType) => {
    if (type === 'custom') {
      setShowCustomInput(true);
    } else {
      onSelect(type);
      onClose();
    }
  };

  const handleCustomSubmit = () => {
    onSelect('custom', customName || 'Anpassat pass');
    setShowCustomInput(false);
    setCustomName('');
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-auto rounded-t-3xl">
        <SheetHeader className="pb-6">
          <SheetTitle>
            {showCustomInput ? 'Namnge ditt pass' : 'Välj passtyp'}
          </SheetTitle>
        </SheetHeader>

        {showCustomInput ? (
          <div className="space-y-4 pb-8">
            <Input
              placeholder="T.ex. Bröst & Triceps"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="h-14 text-lg"
              autoFocus
            />
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 h-12"
                onClick={() => setShowCustomInput(false)}
              >
                Tillbaka
              </Button>
              <Button 
                className="flex-1 h-12"
                onClick={handleCustomSubmit}
              >
                Starta pass
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-8">
            {WORKOUT_TYPES.map(({ type, icon, color }) => (
              <button
                key={type}
                className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all active:scale-[0.98]"
                onClick={() => handleSelect(type)}
              >
                <div className={cn("shrink-0", color)}>
                  {icon}
                </div>
                <span className="font-medium flex-1 text-left">
                  {WORKOUT_TYPE_LABELS[type]}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}