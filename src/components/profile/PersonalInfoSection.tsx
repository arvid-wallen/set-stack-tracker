import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { User, Loader2 } from 'lucide-react';

interface PersonalInfoSectionProps {
  firstName: string;
  lastName: string | null;
  weeklyGoal: number;
  isSaving: boolean;
  onSave: (data: { first_name: string; last_name: string | null; weekly_goal: number }) => Promise<boolean>;
}

export function PersonalInfoSection({
  firstName,
  lastName,
  weeklyGoal,
  isSaving,
  onSave,
}: PersonalInfoSectionProps) {
  const [editFirstName, setEditFirstName] = useState(firstName);
  const [editLastName, setEditLastName] = useState(lastName || '');
  const [editWeeklyGoal, setEditWeeklyGoal] = useState(weeklyGoal);
  const [hasChanges, setHasChanges] = useState(false);

  const recomputeChanges = (fn: string, ln: string, wg: number) => {
    setHasChanges(fn !== firstName || ln !== (lastName || '') || wg !== weeklyGoal);
  };

  const handleSave = async () => {
    const success = await onSave({
      first_name: editFirstName,
      last_name: editLastName || null,
      weekly_goal: editWeeklyGoal,
    });
    if (success) setHasChanges(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5 text-primary" aria-hidden="true" />
          Personlig information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">Förnamn</Label>
            <Input
              id="firstName"
              value={editFirstName}
              onChange={(e) => {
                setEditFirstName(e.target.value);
                recomputeChanges(e.target.value, editLastName, editWeeklyGoal);
              }}
              placeholder="Ditt förnamn"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Efternamn</Label>
            <Input
              id="lastName"
              value={editLastName}
              onChange={(e) => {
                setEditLastName(e.target.value);
                recomputeChanges(editFirstName, e.target.value, editWeeklyGoal);
              }}
              placeholder="Ditt efternamn"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="weeklyGoal">Veckomål (pass / vecka)</Label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`Veckomål ${n} pass`}
                onClick={() => {
                  setEditWeeklyGoal(n);
                  recomputeChanges(editFirstName, editLastName, n);
                }}
                className={
                  'h-10 w-10 rounded-full text-sm font-semibold tabular-nums transition-colors ' +
                  (editWeeklyGoal === n
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70')
                }
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Driver streak och progressring på startsidan.
          </p>
        </div>

        {hasChanges && (
          <Button
            onClick={handleSave}
            disabled={isSaving || !editFirstName.trim()}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                Sparar...
              </>
            ) : (
              'Spara ändringar'
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
