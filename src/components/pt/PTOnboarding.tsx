import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Target,
  Dumbbell,
  Clock,
  AlertCircle,
  Sparkles,
  Calendar,
  User as UserIcon,
  PartyPopper,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { PTProfileInput } from '@/hooks/usePTProfile';
import { TRAINING_SPLIT_OPTIONS, TrainingSplitId } from '@/lib/training-splits';
import { useAuth } from '@/hooks/useAuth';
import { celebrate } from '@/lib/celebrate';

interface PTOnboardingProps {
  /** Called when the user finalises the profile (before the celebration screen). */
  onComplete: (data: PTProfileInput) => void | Promise<void>;
  /** Called after the user dismisses the celebration step. */
  onFinish?: () => void;
}

const GOALS = [
  { id: 'muscle_gain', label: 'Bygga muskler', emoji: '💪' },
  { id: 'fat_loss', label: 'Gå ner i vikt', emoji: '🔥' },
  { id: 'strength', label: 'Öka styrka', emoji: '🏋️' },
  { id: 'health', label: 'Allmän hälsa', emoji: '❤️' },
  { id: 'endurance', label: 'Bättre kondition', emoji: '🏃' },
];

const GENDERS = [
  { id: 'male', label: 'Man', emoji: '👨' },
  { id: 'female', label: 'Kvinna', emoji: '👩' },
  { id: 'other', label: 'Annat', emoji: '🌟' },
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

// Step indices
const STEP_WELCOME = 0;
const STEP_ABOUT = 1;
const STEP_GOALS = 2;
const STEP_EXPERIENCE = 3;
const STEP_EQUIPMENT = 4;
const STEP_TIME = 5;
const STEP_SPLIT = 6;
const STEP_INJURIES = 7;
const STEP_DONE = 8;
const QUESTION_STEPS = [STEP_ABOUT, STEP_GOALS, STEP_EXPERIENCE, STEP_EQUIPMENT, STEP_TIME, STEP_SPLIT, STEP_INJURIES];

export function PTOnboarding({ onComplete, onFinish }: PTOnboardingProps) {
  const { profile } = useAuth();
  const firstName = profile?.first_name?.split(' ')[0] || 'du';

  const [step, setStep] = useState<number>(STEP_WELCOME);

  // About you
  const [gender, setGender] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');

  // Training prefs
  const [goals, setGoals] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<string>('');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [duration, setDuration] = useState<number>(60);
  const [daysPerWeek, setDaysPerWeek] = useState<number>(4);
  const [trainingSplit, setTrainingSplit] = useState<TrainingSplitId>('custom');
  const [injuries, setInjuries] = useState('');
  const [saving, setSaving] = useState(false);

  // Fire confetti once we reach the done step
  useEffect(() => {
    if (step === STEP_DONE) {
      // Slight delay so the screen has time to mount
      const t = setTimeout(() => celebrate(), 200);
      return () => clearTimeout(t);
    }
  }, [step]);

  const canProceed = () => {
    switch (step) {
      case STEP_WELCOME:
        return true;
      case STEP_ABOUT:
        return !!gender; // age/height/weight optional
      case STEP_GOALS:
        return goals.length > 0;
      case STEP_EXPERIENCE:
        return !!experienceLevel;
      case STEP_EQUIPMENT:
        return equipment.length > 0;
      case STEP_TIME:
        return true;
      case STEP_SPLIT:
        return !!trainingSplit;
      case STEP_INJURIES:
        return true;
      default:
        return false;
    }
  };

  const buildPayload = (): PTProfileInput => ({
    gender: gender || null,
    age: age ? Math.max(0, Math.min(120, parseInt(age, 10))) : null,
    height_cm: height ? Math.max(0, Math.min(260, parseFloat(height))) : null,
    weight_kg: weight ? Math.max(0, Math.min(400, parseFloat(weight))) : null,
    goals,
    experience_level: experienceLevel,
    available_equipment: equipment,
    preferred_workout_duration: duration,
    training_days_per_week: daysPerWeek,
    training_split: trainingSplit,
    injuries: injuries.trim() || null,
  });

  const handleSaveAndCelebrate = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onComplete(buildPayload());
      setStep(STEP_DONE);
    } finally {
      setSaving(false);
    }
  };

  const toggleGoal = (goalId: string) => {
    setGoals((prev) => (prev.includes(goalId) ? prev.filter((g) => g !== goalId) : [...prev, goalId]));
  };

  const toggleEquipment = (equipId: string) => {
    setEquipment((prev) => (prev.includes(equipId) ? prev.filter((e) => e !== equipId) : [...prev, equipId]));
  };

  const questionIndex = QUESTION_STEPS.indexOf(step); // -1 on welcome / done
  const showProgress = questionIndex >= 0;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Progress indicator */}
      {showProgress && (
        <div className="px-4 pt-4 pb-2 animate-fade-in">
          <div className="flex items-center gap-1 mb-2">
            {QUESTION_STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1 flex-1 rounded-full transition-all duration-500',
                  i <= questionIndex ? 'bg-primary' : 'bg-muted'
                )}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Steg {questionIndex + 1} av {QUESTION_STEPS.length}
          </p>
        </div>
      )}

      {/* Content (re-mounts per step → animates in) */}
      <div key={step} className="flex-1 overflow-y-auto px-4 py-4 animate-fade-in">
        {step === STEP_WELCOME && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-8">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/30 blur-2xl animate-pulse" />
              <div className="relative h-24 w-24 rounded-full bg-primary flex items-center justify-center animate-scale-in">
                <Sparkles className="h-12 w-12 text-primary-foreground" />
              </div>
            </div>
            <div className="space-y-3 animate-fade-in" style={{ animationDelay: '120ms' }}>
              <h2 className="font-display text-3xl font-bold leading-tight">
                Hej {firstName}!<br />Välkommen till Haus 👋
              </h2>
              <p className="text-muted-foreground max-w-xs mx-auto">
                Vi sätter upp din profil på en minut så vi kan föreslå rätt pass åt dig.
              </p>
            </div>
            <Button size="lg" className="h-12 px-8 mt-4 animate-fade-in" style={{ animationDelay: '240ms' }} onClick={() => setStep(STEP_ABOUT)}>
              Kör igång
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {step === STEP_ABOUT && (
          <div className="space-y-5">
            <div className="text-center mb-4">
              <span className="text-4xl mb-2 block">👤</span>
              <h2 className="text-xl font-semibold">Berätta lite om dig</h2>
              <p className="text-sm text-muted-foreground mt-1">Bara kön är obligatoriskt</p>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Kön</Label>
              <div className="grid grid-cols-3 gap-2">
                {GENDERS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGender(g.id)}
                    className={cn(
                      'p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1',
                      gender === g.id ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border hover:border-primary/50'
                    )}
                  >
                    <span className="text-2xl">{g.emoji}</span>
                    <span className="text-sm font-medium">{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="age" className="text-sm font-medium mb-1.5 block">Ålder</Label>
                <Input id="age" type="number" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} placeholder="30" />
              </div>
              <div>
                <Label htmlFor="height" className="text-sm font-medium mb-1.5 block">Längd (cm)</Label>
                <Input id="height" type="number" inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="180" />
              </div>
              <div>
                <Label htmlFor="weight" className="text-sm font-medium mb-1.5 block">Vikt (kg)</Label>
                <Input id="weight" type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="75" />
              </div>
            </div>
          </div>
        )}

        {step === STEP_GOALS && (
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
                    'w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 press-feedback',
                    goals.includes(goal.id) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  )}
                >
                  <span className="text-2xl">{goal.emoji}</span>
                  <span className="font-medium">{goal.label}</span>
                  {goals.includes(goal.id) && (
                    <div className="ml-auto h-5 w-5 rounded-full bg-primary flex items-center justify-center animate-scale-in">
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

        {step === STEP_EXPERIENCE && (
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
                      'w-full p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3',
                      experienceLevel === level.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    )}
                  >
                    <RadioGroupItem value={level.id} className="sr-only" />
                    <div className={cn('h-5 w-5 rounded-full border-2 flex items-center justify-center', experienceLevel === level.id ? 'border-primary bg-primary' : 'border-muted-foreground')}>
                      {experienceLevel === level.id && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
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

        {step === STEP_EQUIPMENT && (
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
                  className={cn('w-full p-4 rounded-xl border-2 text-left transition-all', equipment.includes(equip.id) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50')}
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

        {step === STEP_TIME && (
          <div className="space-y-6">
            <div className="text-center mb-2">
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
                    className={cn('flex-1 py-3 rounded-xl border-2 font-medium transition-all', duration === d ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/50')}
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
                    className={cn('flex-1 py-3 rounded-xl border-2 font-medium transition-all', daysPerWeek === d ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/50')}
                  >
                    {d === 6 ? '6+' : d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === STEP_SPLIT && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <span className="text-4xl mb-2 block">🗓️</span>
              <h2 className="text-xl font-semibold">Vilken split kör du?</h2>
              <p className="text-sm text-muted-foreground mt-1">Vi använder den för att föreslå nästa pass automatiskt</p>
            </div>
            <div className="space-y-2">
              {TRAINING_SPLIT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setTrainingSplit(opt.id)}
                  className={cn('w-full p-3 rounded-xl border-2 text-left transition-all', trainingSplit === opt.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50')}
                >
                  <p className="font-medium text-sm">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === STEP_INJURIES && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <span className="text-4xl mb-2 block">🩺</span>
              <h2 className="text-xl font-semibold">Något vi bör ta hänsyn till?</h2>
              <p className="text-sm text-muted-foreground mt-1">Helt valfritt</p>
            </div>
            <div>
              <Label htmlFor="injuries" className="text-sm font-medium mb-2 block">Skador eller begränsningar</Label>
              <Textarea id="injuries" value={injuries} onChange={(e) => setInjuries(e.target.value)} placeholder="T.ex. ont i axeln, dåliga knän, ryggproblem..." className="min-h-[120px] resize-none" />
              <p className="text-xs text-muted-foreground mt-2">Lämna tomt om du inte har några begränsningar</p>
            </div>
          </div>
        )}

        {step === STEP_DONE && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-8">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/40 blur-3xl animate-pulse" />
              <div className="relative h-28 w-28 rounded-full bg-primary flex items-center justify-center animate-scale-in">
                <PartyPopper className="h-14 w-14 text-primary-foreground" />
              </div>
            </div>
            <div className="space-y-3 animate-fade-in" style={{ animationDelay: '120ms' }}>
              <h2 className="font-display text-3xl font-bold leading-tight">Klart, {firstName}!</h2>
              <p className="text-muted-foreground max-w-xs mx-auto">
                Din profil är sparad. Vi visar dig en snabb rundtur i appen.
              </p>
            </div>
            <Button
              size="lg"
              className="h-12 px-8 mt-4 animate-fade-in"
              style={{ animationDelay: '240ms' }}
              onClick={() => onFinish?.()}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Visa mig runt
            </Button>
          </div>
        )}
      </div>

      {/* Navigation (hidden on welcome + done) */}
      {showProgress && (
        <div className="p-4 border-t bg-background/95 backdrop-blur-sm">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep((s) => Math.max(STEP_WELCOME, s - 1))} className="flex-1">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Tillbaka
            </Button>

            {step < STEP_INJURIES ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()} className="flex-1">
                Nästa
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSaveAndCelebrate} disabled={saving} className="flex-1">
                <Sparkles className="h-4 w-4 mr-2" />
                {saving ? 'Sparar…' : 'Spara profil'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
