import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Exercise, MuscleGroup, EquipmentType, MUSCLE_GROUP_LABELS, EQUIPMENT_TYPE_LABELS } from '@/types/workout';

interface CreateExerciseSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (exercise: Partial<Exercise>) => Promise<unknown>;
}

const ALL_MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'quads', 'hamstrings', 'glutes', 'calves', 'core', 'full_body'
];

const ALL_EQUIPMENT: EquipmentType[] = [
  'barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell', 'bands', 'cardio_machine', 'other'
];

export function CreateExerciseSheet({ isOpen, onClose, onSubmit }: CreateExerciseSheetProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleGroup[]>([]);
  const [equipmentType, setEquipmentType] = useState<EquipmentType>('bodyweight');
  const [isCardio, setIsCardio] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleMuscle = (muscle: MuscleGroup) => {
    setSelectedMuscles(prev => 
      prev.includes(muscle) 
        ? prev.filter(m => m !== muscle)
        : [...prev, muscle]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim() || selectedMuscles.length === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        muscle_groups: selectedMuscles,
        equipment_type: equipmentType,
        is_cardio: isCardio,
      });
      
      // Reset form
      setName('');
      setDescription('');
      setSelectedMuscles([]);
      setEquipmentType('bodyweight');
      setIsCardio(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = name.trim() && selectedMuscles.length > 0;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle>Skapa egen övning</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-180px)] pb-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Namn *</Label>
            <Input
              id="name"
              placeholder="T.ex. Bänkpress med hantlar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Beskrivning</Label>
            <Textarea
              id="description"
              placeholder="Beskriv hur övningen utförs..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Muscle groups */}
          <div className="space-y-2">
            <Label>Muskelgrupper *</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_MUSCLE_GROUPS.map(muscle => (
                <Badge
                  key={muscle}
                  variant={selectedMuscles.includes(muscle) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleMuscle(muscle)}
                >
                  {MUSCLE_GROUP_LABELS[muscle]}
                </Badge>
              ))}
            </div>
          </div>

          {/* Equipment type */}
          <div className="space-y-2">
            <Label>Utrustning</Label>
            <Select value={equipmentType} onValueChange={(v) => setEquipmentType(v as EquipmentType)}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_EQUIPMENT.map(eq => (
                  <SelectItem key={eq} value={eq}>
                    {EQUIPMENT_TYPE_LABELS[eq]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cardio toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div>
              <Label htmlFor="isCardio" className="font-medium">Cardio-övning</Label>
              <p className="text-sm text-muted-foreground">
                Aktivera för löpning, cykling etc.
              </p>
            </div>
            <Switch
              id="isCardio"
              checked={isCardio}
              onCheckedChange={setIsCardio}
            />
          </div>
        </div>

        <SheetFooter className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t border-border">
          <div className="flex gap-3 w-full">
            <Button variant="outline" onClick={onClose} className="flex-1 h-12">
              Avbryt
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!isValid || isSubmitting}
              className="flex-1 h-12"
            >
              {isSubmitting ? 'Skapar...' : 'Skapa övning'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
