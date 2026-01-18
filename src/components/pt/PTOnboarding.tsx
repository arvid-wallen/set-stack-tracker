import { useState } from 'react';
import { ChevronLeft, ChevronRight, Target, Dumbbell, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { PTProfileInput } from '@/hooks/usePTProfile';

interface PTOnboardingProps {
  onComplete: (data: PTProfileInput) => void;
}

const GOALS = [
  { id: 'muscle_gain', label: 'Bygga muskler', emoji: '💪' },
  { id: 'fat_loss', label: 'Gå ner i vikt', emoji: '🔥' },
  { id: 'strength', label: 'Öka styrka', emoji: '🏋️' },
  { id: 'health', label: 'Allmän hälsa', emoji: '❤️' },
  { id: 'endurance', label: 'Bättre kondition', emoji: '🏃' },
];

const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Nybörjare', description: '0-1 års erfarenhet' },
  { id: 'intermediate', label: 'Mellanliggande', description: '1-3 års erfarenhet' },
  { id: 'advanced', label: 'Avancerad', description: '3+ års erfarenhet' },
];

const EQUIPMENT = [
  { id: 'full_gym', label: 'Komplett gym', description: 'Fria vikter, maskiner, kablar' },
  { id: 'home_gym', label: 'Hemmagym', description: 'Hantlar, skivstång, bänk' },
  { id: 'bodyweight', label: 'Kroppsvikt', description: 'Ingen utrustning behövs' },
  { id: 'resistance_bands', label: 'Gummiband', description: 'Motståndsband' },
];

const DURATION_OPTIONS = [30, 45, 60, 90];
const DAYS_OPTIONS = [2, 3, 4, 5, 6];

export function PTOnboarding({ onComplete }: PTOnboardingProps) {
  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<string>('');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [duration, setDuration] = useState<number>(60);
  const [daysPerWeek, setDaysPerWeek] = useState<number>(4);
  const [injuries, setInjuries] = useState('');

  const steps = [
    { title: 'Mål', icon: Target, emoji: '🎯' },
    { title: 'Erfarenhet', icon: Dumbbell, emoji: '💪' },
    { title: 'Utrustning', icon: Dumbbell, emoji: '🏋️' },
    { title: 'Tid', icon: Clock, emoji: '⏱️' },
    { title: 'Begränsningar', icon: AlertCircle, emoji: '🩺' },
  ];

  const canProceed = () => {
    switch (step) {
      case 0: return goals.length > 0;
      case 1: return !!experienceLevel;
      case 2: return equipment.length > 0;
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  };

  const handleComplete = () => {
    onComplete({
      goals,
      experience_level: experienceLevel,
      available_equipment: equipment,
      preferred_workout_duration: duration,
      training_days_per_week: daysPerWeek,
      injuries: injuries.trim() || null,
    });
  };

  const toggleGoal = (goalId: string) => {
    setGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId]
    );
  };

  const toggleEquipment = (equipId: string) => {
    setEquipment(prev => 
      prev.includes(equipId) 
        ? prev.filter(e => e !== equipId)
        : [...prev, equipId]
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Progress indicator */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-1 mb-2">
          {steps.map((s, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Steg {step + 1} av {steps.length}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {step === 0 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <span className="text-4xl mb-2 block">🎯</span>
              <h2 className="text-xl font-semibold">Vad är dina träningsmål?</h2>
              <p className="text-sm text-muted-foreground mt-1">Välj ett eller flera</p>
            </div>
            <div className="space-y-2">
              {GOALS.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => toggleGoal(goal.id)}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3",
                    goals.includes(goal.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <span className="text-2xl">{goal.emoji}</span>
                  <span className="font-medium">{goal.label}</span>
                  {goals.includes(goal.id) && (
                    <div className="ml-auto h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <span className="text-4xl mb-2 block">💪</span>
              <h2 className="text-xl font-semibold">Hur erfaren är du?</h2>
              <p className="text-sm text-muted-foreground mt-1">Välj din nivå</p>
            </div>
            <RadioGroup value={experienceLevel} onValueChange={setExperienceLevel}>
              <div className="space-y-2">
                {EXPERIENCE_LEVELS.map((level) => (
                  <label
                    key={level.id}
                    className={cn(
                      "w-full p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3",
                      experienceLevel === level.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <RadioGroupItem value={level.id} className="sr-only" />
                    <div className={cn(
                      "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                      experienceLevel === level.id ? "border-primary bg-primary" : "border-muted-foreground"
                    )}>
                      {experienceLevel === level.id && (
                        <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{level.label}</p>
                      <p className="text-sm text-muted-foreground">{level.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </RadioGroup>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <span className="text-4xl mb-2 block">🏋️</span>
              <h2 className="text-xl font-semibold">Vilken utrustning har du?</h2>
              <p className="text-sm text-muted-foreground mt-1">Välj alla som gäller</p>
            </div>
            <div className="space-y-2">
              {EQUIPMENT.map((equip) => (
                <button
                  key={equip.id}
                  onClick={() => toggleEquipment(equip.id)}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left transition-all",
                    equipment.includes(equip.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox checked={equipment.includes(equip.id)} />
                    <div>
                      <p className="font-medium">{equip.label}</p>
                      <p className="text-sm text-muted-foreground">{equip.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <span className="text-4xl mb-2 block">⏱️</span>
              <h2 className="text-xl font-semibold">Hur mycket tid har du?</h2>
            </div>

            <div>
              <Label className="text-sm font-medium mb-3 block">Tid per pass</Label>
              <div className="flex gap-2">
                {DURATION_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={cn(
                      "flex-1 py-3 rounded-xl border-2 font-medium transition-all",
                      duration === d
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {d === 90 ? '90+' : d} min
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-3 block">Dagar per vecka</Label>
              <div className="flex gap-2">
                {DAYS_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDaysPerWeek(d)}
                    className={cn(
                      "flex-1 py-3 rounded-xl border-2 font-medium transition-all",
                      daysPerWeek === d
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {d === 6 ? '6+' : d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <span className="text-4xl mb-2 block">🩺</span>
              <h2 className="text-xl font-semibold">Något vi bör ta hänsyn till?</h2>
              <p className="text-sm text-muted-foreground mt-1">Helt valfritt</p>
            </div>

            <div>
              <Label htmlFor="injuries" className="text-sm font-medium mb-2 block">
                Skador eller begränsningar
              </Label>
              <Textarea
                id="injuries"
                value={injuries}
                onChange={(e) => setInjuries(e.target.value)}
                placeholder="T.ex. ont i axeln, dåliga knän, ryggproblem..."
                className="min-h-[120px] resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Lämna tomt om du inte har några begränsningar
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="p-4 border-t bg-background/95 backdrop-blur-sm">
        <div className="flex gap-2">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={() => setStep(s => s - 1)}
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Tillbaka
            </Button>
          )}
          
          {step < steps.length - 1 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="flex-1"
            >
              Nästa
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              className="flex-1"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Starta chatten!
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
