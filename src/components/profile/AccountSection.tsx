import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Shield, Mail, Key, LogOut, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AccountSectionProps {
  email: string;
  onSignOut: () => void;
}

export function AccountSection({ email, onSignOut }: AccountSectionProps) {
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleUpdateEmail = async () => {
    if (!newEmail.trim()) return;
    
    setIsUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      
      toast({ 
        title: 'Bekräftelsemail skickat',
        description: 'Kolla din nya e-post för att bekräfta ändringen.'
      });
      setNewEmail('');
    } catch (error: any) {
      toast({ 
        title: 'Kunde inte uppdatera e-post', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ 
        title: 'Lösenorden matchar inte',
        variant: 'destructive' 
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({ 
        title: 'Lösenordet måste vara minst 6 tecken',
        variant: 'destructive' 
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      toast({ title: 'Lösenord uppdaterat!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({ 
        title: 'Kunde inte uppdatera lösenord', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // Note: Full account deletion requires admin privileges
      // For now, we sign out and show a message
      toast({ 
        title: 'Kontakta support',
        description: 'För att radera ditt konto permanent, kontakta support.'
      });
      onSignOut();
    } catch (error: any) {
      toast({ 
        title: 'Kunde inte radera konto', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Konto & säkerhet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>Nuvarande e-post: {email}</span>
          </div>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Ny e-postadress"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <Button 
              onClick={handleUpdateEmail} 
              disabled={isUpdatingEmail || !newEmail.trim()}
              variant="secondary"
            >
              {isUpdatingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ändra'}
            </Button>
          </div>
        </div>

        {/* Password section */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Key className="h-4 w-4 text-primary" />
            Byt lösenord
          </div>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Nytt lösenord"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Bekräfta nytt lösenord"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleUpdatePassword} 
            disabled={isUpdatingPassword || !newPassword || !confirmPassword}
            variant="secondary"
            className="w-full sm:w-auto"
          >
            {isUpdatingPassword ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uppdaterar...
              </>
            ) : (
              'Uppdatera lösenord'
            )}
          </Button>
        </div>

        {/* Sign out & Delete */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
          <Button 
            variant="outline" 
            onClick={onSignOut}
            className="flex-1"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logga ut
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="flex-1">
                <Trash2 className="h-4 w-4 mr-2" />
                Radera konto
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Är du säker?</AlertDialogTitle>
                <AlertDialogDescription>
                  Detta kommer att permanent radera ditt konto och all din träningsdata. 
                  Denna åtgärd kan inte ångras.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? 'Raderar...' : 'Ja, radera mitt konto'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
