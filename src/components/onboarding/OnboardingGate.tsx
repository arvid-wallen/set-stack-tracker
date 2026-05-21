import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useAuth } from '@/hooks/useAuth';
import { usePTProfile, PTProfileInput } from '@/hooks/usePTProfile';
import { PTOnboarding } from '@/components/pt/PTOnboarding';

/**
 * Visar onboarding-flödet (mål, utrustning, skador) första gången en
 * inloggad användare öppnar appen. Sparar i pt_profiles via usePTProfile.
 */
export function OnboardingGate() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { needsOnboarding, isLoading, savePTProfile } = usePTProfile();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isLoading && isAuthenticated && needsOnboarding) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [authLoading, isLoading, isAuthenticated, needsOnboarding]);

  const handleComplete = async (data: PTProfileInput) => {
    setSaving(true);
    const result = await savePTProfile(data);
    setSaving(false);
    if (result) setOpen(false);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={() => { /* lock: kräver att flödet avslutas */ }}>
      <DialogContent
        className="p-0 max-w-md h-[90vh] max-h-[720px] flex flex-col gap-0 [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <VisuallyHidden>
          <DialogTitle>Välkommen – sätt upp din profil</DialogTitle>
          <DialogDescription>Berätta om dina mål, utrustning och eventuella skador.</DialogDescription>
        </VisuallyHidden>
        <div className="flex-1 overflow-hidden">
          <PTOnboarding onComplete={handleComplete} />
        </div>
        {saving && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center text-sm">
            Sparar profil…
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
