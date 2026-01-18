import { useState, useEffect } from 'react';
import { Star, Save, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { DurationInput } from '@/components/ui/duration-input';

interface EndWorkoutSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (rating: number, notes: string, customDuration?: number, saveAsTemplate?: { name: string; folder?: string; isFavorite: boolean }) => void;
  totalSets: number;
  durationSeconds: number;
  workoutType: string;
  exerciseCount: number;
}

export function EndWorkoutSheet({ 
  isOpen, 
  onClose, 
  onConfirm, 
  totalSets,
  durationSeconds,
  workoutType,
  exerciseCount
}: EndWorkoutSheetProps) {
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateFolder, setTemplateFolder] = useState('');
  const [templateFavorite, setTemplateFavorite] = useState(false);
  const [editedDuration, setEditedDuration] = useState(durationSeconds);
  const [isEditingDuration, setIsEditingDuration] = useState(false);

  // Update edited duration when durationSeconds prop changes
  useEffect(() => {
    setEditedDuration(durationSeconds);
  }, [durationSeconds]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
  };

  const handleConfirm = () => {
    const templateData = saveAsTemplate && templateName.trim() 
      ? { name: templateName.trim(), folder: templateFolder.trim() || undefined, isFavorite: templateFavorite }
      : undefined;
    
    // Only pass custom duration if it was edited
    const customDuration = editedDuration !== durationSeconds ? editedDuration : undefined;
    onConfirm(rating || 3, notes, customDuration, templateData);
  };

  const handleClose = () => {
    // Reset template state when closing
    setSaveAsTemplate(false);
    setTemplateName('');
    setTemplateFolder('');
    setTemplateFavorite(false);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-auto max-h-[90vh] rounded-t-3xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>Avsluta pass</SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            {totalSets} set på{' '}
            {isEditingDuration ? (
              <DurationInput 
                value={editedDuration} 
                onChange={setEditedDuration}
              />
            ) : (
              <button 
                onClick={() => setIsEditingDuration(true)}
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                {formatDuration(editedDuration)}
                <Pencil className="h-3 w-3" />
              </button>
            )}
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
              className="min-h-[80px]"
            />
          </div>

          {/* Save as template */}
          {exerciseCount > 0 && (
            <div className="space-y-4 p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="saveTemplate" className="font-medium">
                    Spara som mall
                  </Label>
                </div>
                <Switch
                  id="saveTemplate"
                  checked={saveAsTemplate}
                  onCheckedChange={setSaveAsTemplate}
                />
              </div>

              {saveAsTemplate && (
                <div className="space-y-3 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="templateName" className="text-sm">Namn på rutin *</Label>
                    <Input
                      id="templateName"
                      placeholder={`${workoutType} rutin`}
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="h-10"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="templateFolder" className="text-sm">Mapp (valfritt)</Label>
                    <Input
                      id="templateFolder"
                      placeholder="T.ex. PPL Split"
                      value={templateFolder}
                      onChange={(e) => setTemplateFolder(e.target.value)}
                      className="h-10"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Label htmlFor="templateFavorite" className="text-sm">
                      Lägg till som favorit
                    </Label>
                    <Switch
                      id="templateFavorite"
                      checked={templateFavorite}
                      onCheckedChange={setTemplateFavorite}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 h-12"
              onClick={handleClose}
            >
              Fortsätt träna
            </Button>
            <Button 
              className="flex-1 h-12"
              onClick={handleConfirm}
              disabled={saveAsTemplate && !templateName.trim()}
            >
              Spara pass
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
