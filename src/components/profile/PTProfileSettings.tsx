import { useState, useEffect } from 'react';
import { Bot, ChevronRight, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePTProfile, PTProfileInput } from '@/hooks/usePTProfile';
import { cn } from '@/lib/utils';

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
  { id: 'full_gym', label: 'Komplett gym' },
  { id: 'home_gym', label: 'Hemmagym' },
  { id: 'bodyweight', label: 'Kroppsvikt' },
  { id: 'resistance_bands', label: 'Gummiband' },
];

const DURATION_OPTIONS = [30, 45, 60, 90];
const DAYS_OPTIONS = [2, 3, 4, 5, 6];

export function PTProfileSettings() {
  const { ptProfile, updatePTProfile, isLoading, needsOnboarding } = usePTProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [goals, setGoals] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<string>('');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [duration, setDuration] = useState<number>(60);
  const [daysPerWeek, setDaysPerWeek] = useState<number>(4);
  const [injuries, setInjuries] = useState('');

  // Load profile data when opening
  useEffect(() => {
    if (ptProfile && isOpen) {
      setGoals(ptProfile.goals || []);
      setExperienceLevel(ptProfile.experience_level || '');
      setEquipment(ptProfile.available_equipment || []);
      setDuration(ptProfile.preferred_workout_duration || 60);
      setDaysPerWeek(ptProfile.training_days_per_week || 4);
      setInjuries(ptProfile.injuries || '');
    }
  }, [ptProfile, isOpen]);

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

  const handleSave = async () => {
    setIsSaving(true);
    await updatePTProfile({
      goals,
      experience_level: experienceLevel,
      available_equipment: equipment,
      preferred_workout_duration: duration,
      training_days_per_week: daysPerWeek,
      injuries: injuries.trim() || null,
    });
    setIsSaving(false);
    setIsOpen(false);
  };

  // Show different state if onboarding not completed
  const hasProfile = ptProfile && !needsOnboarding;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI PT-inställningar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasProfile ? (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Din PT vet om dina mål och preferenser
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ptProfile.goals?.slice(0, 3).map(goalId => {
                  const goal = GOALS.find(g => g.id === goalId);
                  return goal ? (
                    <span key={goalId} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {goal.emoji} {goal.label}
                    </span>
                  ) : null;
                })}
                {(ptProfile.goals?.length || 0) > 3 && (
                  <span className="text-xs bg-muted px-2 py-1 rounded-full">
                    +{(ptProfile.goals?.length || 0) - 3} till
                  </span>
                )}
              </div>
              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => setIsOpen(true)}
              >
                Redigera inställningar
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              <p className="mb-3">Öppna PT-chatten för att konfigurera dina personliga inställningar.</p>
              <div className="flex items-center gap-2 text-xs text-primary">
                <Bot className="h-4 w-4" />
                Klicka på PT-ikonen i nedre högra hörnet
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              PT-inställningar
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Goals */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Träningsmål</Label>
                <div className="space-y-2">
                  {GOALS.map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => toggleGoal(goal.id)}
                      className={cn(
                        "w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3",
                        goals.includes(goal.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <span>{goal.emoji}</span>
                      <span className="text-sm">{goal.label}</span>
                      {goals.includes(goal.id) && (
                        <Check className="h-4 w-4 text-primary ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Erfarenhetsnivå</Label>
                <RadioGroup value={experienceLevel} onValueChange={setExperienceLevel}>
                  <div className="space-y-2">
                    {EXPERIENCE_LEVELS.map((level) => (
                      <label
                        key={level.id}
                        className={cn(
                          "w-full p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3",
                          experienceLevel === level.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <RadioGroupItem value={level.id} />
                        <div>
                          <p className="text-sm font-medium">{level.label}</p>
                          <p className="text-xs text-muted-foreground">{level.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Equipment */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Tillgänglig utrustning</Label>
                <div className="grid grid-cols-2 gap-2">
                  {EQUIPMENT.map((equip) => (
                    <button
                      key={equip.id}
                      onClick={() => toggleEquipment(equip.id)}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-all flex items-center gap-2",
                        equipment.includes(equip.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <Checkbox checked={equipment.includes(equip.id)} />
                      <span className="text-sm">{equip.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Tid per pass</Label>
                <div className="flex gap-2">
                  {DURATION_OPTIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={cn(
                        "flex-1 py-2 rounded-lg border text-sm font-medium transition-all",
                        duration === d
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {d === 90 ? '90+' : d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Days per week */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Dagar per vecka</Label>
                <div className="flex gap-2">
                  {DAYS_OPTIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDaysPerWeek(d)}
                      className={cn(
                        "flex-1 py-2 rounded-lg border text-sm font-medium transition-all",
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

              {/* Injuries */}
              <div>
                <Label htmlFor="injuries-edit" className="text-sm font-medium mb-2 block">
                  Skador eller begränsningar
                </Label>
                <Textarea
                  id="injuries-edit"
                  value={injuries}
                  onChange={(e) => setInjuries(e.target.value)}
                  placeholder="T.ex. ont i axeln, dåliga knän..."
                  className="min-h-[80px] resize-none"
                />
              </div>
            </div>
          </ScrollArea>

          <div className="p-4 border-t bg-background/95">
            <Button 
              onClick={handleSave} 
              className="w-full"
              disabled={isSaving}
            >
              {isSaving ? 'Sparar...' : 'Spara ändringar'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
