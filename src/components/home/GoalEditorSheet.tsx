import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Dumbbell, Heart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GoalComposition } from '@/hooks/useProfile';

export type GoalView = 'week' | 'month';

interface GoalEditorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: GoalView;
  weeklyGoal: number;
  monthlyGoal: number;
  composition: GoalComposition;
  isSaving: boolean;
  onSave: (data: { weekly_goal: number; monthly_goal: number; goal_composition: GoalComposition }) => Promise<boolean>;
}

interface StepperProps {
  label: string;
  icon?: React.ReactNode;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  hint?: string;
}

function Stepper({ label, icon, value, min, max, onChange, hint }: StepperProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-3 min-w-0">
        {icon}
        <div className="min-w-0">
          <p className="font-medium text-sm">{label}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Minska ${label}`}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-8 text-center text-lg font-semibold tabular-nums">{value}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Öka ${label}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function GoalEditorSheet({
  open,
  onOpenChange,
  initialTab = 'week',
  weeklyGoal,
  monthlyGoal,
  composition,
  isSaving,
  onSave,
}: GoalEditorSheetProps) {
  const [tab, setTab] = useState<GoalView>(initialTab);
  const [wg, setWg] = useState(weeklyGoal);
  const [mg, setMg] = useState(monthlyGoal);
  const [strength, setStrength] = useState(composition.strength ?? 0);
  const [cardio, setCardio] = useState(composition.cardio ?? 0);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setWg(weeklyGoal);
      setMg(monthlyGoal);
      setStrength(composition.strength ?? 0);
      setCardio(composition.cardio ?? 0);
    }
  }, [open, initialTab, weeklyGoal, monthlyGoal, composition.strength, composition.cardio]);

  const total = tab === 'week' ? wg : mg;
  const compSum = strength + cardio;
  const remainder = Math.max(0, total - compSum);
  const overflow = compSum > total;
  const maxComp = tab === 'week' ? 14 : 60;

  const handleSave = async () => {
    const success = await onSave({
      weekly_goal: wg,
      monthly_goal: mg,
      goal_composition: { strength, cardio },
    });
    if (success) onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Redigera mål</SheetTitle>
          <SheetDescription>
            Sätt antal pass och fördela mellan styrka och kondition.
          </SheetDescription>
        </SheetHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as GoalView)} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="week">Vecka</TabsTrigger>
            <TabsTrigger value="month">Månad</TabsTrigger>
          </TabsList>

          <TabsContent value="week" className="mt-5 space-y-1">
            <Stepper
              label="Totalt antal pass per vecka"
              value={wg}
              min={1}
              max={14}
              onChange={setWg}
            />
          </TabsContent>

          <TabsContent value="month" className="mt-5 space-y-1">
            <Stepper
              label="Totalt antal pass per månad"
              value={mg}
              min={1}
              max={60}
              onChange={setMg}
            />
          </TabsContent>
        </Tabs>

        <div className="mt-6 pt-5 border-t">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">
            Sammansättning
          </p>
          <Stepper
            label="Styrka"
            icon={<Dumbbell className="h-4 w-4 text-primary" aria-hidden="true" />}
            value={strength}
            min={0}
            max={maxComp}
            onChange={setStrength}
          />
          <Stepper
            label="Kondition"
            icon={<Heart className="h-4 w-4 text-primary" aria-hidden="true" />}
            value={cardio}
            min={0}
            max={maxComp}
            onChange={setCardio}
          />

          <div className={cn(
            "mt-3 text-xs px-3 py-2 rounded-lg",
            overflow ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
          )}>
            {overflow
              ? `Sammansättning (${compSum}) överstiger totalen (${total}). Justera för att kunna spara.`
              : remainder > 0
                ? `${compSum}/${total} fördelade — ${remainder} pass av valfri typ kvar.`
                : compSum === 0
                  ? 'Lägg till styrka och/eller kondition om du vill specificera fördelning.'
                  : `Alla ${total} pass är fördelade.`}
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Avbryt
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={isSaving || overflow}
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Spara
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
