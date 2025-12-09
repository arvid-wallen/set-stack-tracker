import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface EndWorkoutSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (rating: number, notes: string) => void;
  totalSets: number;
  duration: string;
}

export function EndWorkoutSheet({ 
  isOpen, 
  onClose, 
  onConfirm, 
  totalSets,
  duration 
}: EndWorkoutSheetProps) {
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    onConfirm(rating || 3, notes);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-auto rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle>Avsluta pass</SheetTitle>
          <SheetDescription>
            {totalSets} set på {duration}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 pb-8">
          {/* Rating */}
          <div>
            <label className="text-sm font-medium mb-3 block">
              Hur var passet?
            </label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className="p-2 transition-transform hover:scale-110 active:scale-95"
                  onClick={() => setRating(star)}
                >
                  <Star 
                    className={cn(
                      "h-10 w-10 transition-colors",
                      star <= rating 
                        ? "text-warning fill-warning" 
                        : "text-muted-foreground"
                    )} 
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Anteckningar (valfritt)
            </label>
            <Textarea
              placeholder="Hur kändes det? Energi, sömn, stress..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 h-12"
              onClick={onClose}
            >
              Fortsätt träna
            </Button>
            <Button 
              className="flex-1 h-12"
              onClick={handleConfirm}
            >
              Spara pass
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}