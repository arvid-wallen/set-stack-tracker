import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { useImportWorkouts, ParsedWorkout } from '@/hooks/useImportWorkouts';
import { ImportPreview } from './ImportPreview';

interface ImportWorkoutSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportWorkoutSheet({ open, onOpenChange }: ImportWorkoutSheetProps) {
  const [text, setText] = useState('');
  const [step, setStep] = useState<'input' | 'preview' | 'done'>('input');
  const { 
    isParsing, 
    isImporting, 
    parsedWorkouts, 
    parseWorkoutNotes, 
    importWorkouts,
    updateParsedWorkout,
    removeParsedWorkout,
    clearParsedWorkouts 
  } = useImportWorkouts();

  const handleParse = async () => {
    const result = await parseWorkoutNotes(text);
    if (result && result.length > 0) {
      setStep('preview');
    }
  };

  const handleImport = async () => {
    const success = await importWorkouts(parsedWorkouts);
    if (success) {
      setStep('done');
      setTimeout(() => {
        handleClose();
      }, 2000);
    }
  };

  const handleClose = () => {
    setText('');
    setStep('input');
    clearParsedWorkouts();
    onOpenChange(false);
  };

  const handleBack = () => {
    setStep('input');
    clearParsedWorkouts();
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Importera träningspass
          </SheetTitle>
          <SheetDescription>
            {step === 'input' && 'Klistra in dina gamla träningsanteckningar så tolkar AI:n dem'}
            {step === 'preview' && 'Granska och korrigera innan import'}
            {step === 'done' && 'Import klar!'}
          </SheetDescription>
        </SheetHeader>

        {step === 'input' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Exempel på format
              </h4>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
{`15 jan 2024 - Bröstpass
Bänkpress:
  60kg x 10 (uppv)
  80kg x 8
  85kg x 6
  85kg x 6

Incline hantelpress:
  30kg x 10
  32kg x 8
  32kg x 8

Cable flyes:
  15kg x 12 x 3 set`}
              </pre>
            </div>

            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Klistra in dina träningsanteckningar här..."
              className="min-h-[300px] font-mono text-sm"
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Avbryt
              </Button>
              <Button
                onClick={handleParse}
                disabled={!text.trim() || isParsing}
                className="flex-1"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Tolkar...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Tolka med AI
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <ImportPreview
              workouts={parsedWorkouts}
              onUpdateWorkout={updateParsedWorkout}
              onRemoveWorkout={removeParsedWorkout}
            />

            <div className="flex gap-2 sticky bottom-0 bg-background pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                Tillbaka
              </Button>
              <Button
                onClick={handleImport}
                disabled={parsedWorkouts.length === 0 || isImporting}
                className="flex-1"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importerar...
                  </>
                ) : (
                  <>
                    Importera {parsedWorkouts.length} pass
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="p-4 rounded-full bg-green-500/10">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold">Import klar!</h3>
            <p className="text-muted-foreground text-center">
              Dina träningspass har importerats till historiken
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
