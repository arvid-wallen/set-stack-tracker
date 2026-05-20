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
import { Shield, Mail, Key, LogOut, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { deleteAllUserData } from '@/lib/data-management';

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
  const [isWiping, setIsWiping] = useState(false);
  const [wipeConfirm, setWipeConfirm] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

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

  const handleWipeAllData = async () => {
    if (!user?.id) return;
    setIsWiping(true);
    try {
      await deleteAllUserData(user.id);
      toast({
        title: 'All träningsdata raderad',
        description: 'Ditt konto finns kvar men all data är borttagen.',
      });
      setWipeConfirm('');
    } catch (error: any) {
      toast({
        title: 'Kunde inte radera all data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsWiping(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) return;
    setIsDeleting(true);
    try {
      // 1. Wipe all user data
      await deleteAllUserData(user.id);
      // 2. Note: removing the auth.users row requires service-role.
      //    We sign the user out; admin removal is handled separately.
      toast({
        title: 'Kontot är raderat',
        description: 'All din data är borttagen. Du loggas ut nu.',
      });
      onSignOut();
    } catch (error: any) {
      toast({
        title: 'Kunde inte radera konto',
        description: error.message,
        variant: 'destructive',
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

        {/* Danger zone */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm font-medium text-destructive">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Farozon
          </div>

          <Button
            variant="outline"
            onClick={onSignOut}
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
            Logga ut
          </Button>

          {/* Wipe data only */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                Radera all träningsdata
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Radera all träningsdata?</AlertDialogTitle>
                <AlertDialogDescription>
                  Alla pass, set, övningar, rutiner, mål, anteckningar, foton och PT-chattar tas bort permanent. Ditt konto, e-post och lösenord behålls.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2">
                <Label htmlFor="wipe-confirm" className="text-xs">
                  Skriv <span className="font-mono font-semibold">RADERA</span> för att bekräfta
                </Label>
                <Input
                  id="wipe-confirm"
                  value={wipeConfirm}
                  onChange={(e) => setWipeConfirm(e.target.value)}
                  placeholder="RADERA"
                  autoComplete="off"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setWipeConfirm('')}>Avbryt</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleWipeAllData}
                  disabled={wipeConfirm !== 'RADERA' || isWiping}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isWiping ? 'Raderar...' : 'Ja, radera all data'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete account */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                Radera konto
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Radera kontot helt?</AlertDialogTitle>
                <AlertDialogDescription>
                  All träningsdata raderas och du loggas ut. För att även ta bort inloggningsuppgifterna helt – kontakta support efteråt.
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
