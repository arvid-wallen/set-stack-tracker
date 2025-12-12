import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { User, Loader2 } from 'lucide-react';

interface PersonalInfoSectionProps {
  firstName: string;
  lastName: string | null;
  isSaving: boolean;
  onSave: (data: { first_name: string; last_name: string | null }) => Promise<boolean>;
}

export function PersonalInfoSection({
  firstName,
  lastName,
  isSaving,
  onSave
}: PersonalInfoSectionProps) {
  const [editFirstName, setEditFirstName] = useState(firstName);
  const [editLastName, setEditLastName] = useState(lastName || '');
  const [hasChanges, setHasChanges] = useState(false);

  const handleFirstNameChange = (value: string) => {
    setEditFirstName(value);
    setHasChanges(value !== firstName || editLastName !== (lastName || ''));
  };

  const handleLastNameChange = (value: string) => {
    setEditLastName(value);
    setHasChanges(editFirstName !== firstName || value !== (lastName || ''));
  };

  const handleSave = async () => {
    const success = await onSave({
      first_name: editFirstName,
      last_name: editLastName || null
    });
    if (success) {
      setHasChanges(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
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
              onChange={(e) => handleFirstNameChange(e.target.value)}
              placeholder="Ditt förnamn"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Efternamn</Label>
            <Input
              id="lastName"
              value={editLastName}
              onChange={(e) => handleLastNameChange(e.target.value)}
              placeholder="Ditt efternamn"
            />
          </div>
        </div>
        
        {hasChanges && (
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !editFirstName.trim()}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
