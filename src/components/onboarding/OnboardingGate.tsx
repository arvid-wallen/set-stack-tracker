import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useAuth } from '@/hooks/useAuth';
import { usePTProfile, PTProfileInput } from '@/hooks/usePTProfile';
import { PTOnboarding } from '@/components/pt/PTOnboarding';
import { AppTour, APP_TOUR_KEY } from '@/components/onboarding/AppTour';

/**
 * Visar onboarding-flödet (mål, utrustning, skador) första gången en
 * inloggad användare öppnar appen. Sparar i pt_profiles via usePTProfile.
 * När onboardingen är klar startar en guidad rundtur i appen.
 */
export function OnboardingGate() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { needsOnboarding, isLoading, savePTProfile } = usePTProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isLoading && isAuthenticated && needsOnboarding) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [authLoading, isLoading, isAuthenticated, needsOnboarding]);

  const handleComplete = async (data: PTProfileInput) => {
    await savePTProfile(data);
    // Stay on the celebration screen; the PTOnboarding will show it itself.
  };

  const handleFinishOnboarding = () => {
    setOpen(false);
    // Make sure we land in the app (not on /auth or similar)
    if (location.pathname !== '/') {
      navigate('/', { replace: true });
    }
    // Only show the tour if not already completed
    const seenTour = (() => {
      try {
        return localStorage.getItem(APP_TOUR_KEY) === '1';
      } catch {
        return false;
      }
    })();
    if (!seenTour) {
      // Slight delay so the route transition can render first
      setTimeout(() => setTourOpen(true), 150);
    }
  };

  return (
    <>
      {open && (
        <Dialog open={open} onOpenChange={() => { /* lock */ }}>
          <DialogContent
            className="p-0 max-w-md h-[92vh] max-h-[760px] flex flex-col gap-0 [&>button]:hidden overflow-hidden"
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <VisuallyHidden>
              <DialogTitle>Välkommen – sätt upp din profil</DialogTitle>
              <DialogDescription>Berätta om dig själv, dina mål, utrustning och eventuella skador.</DialogDescription>
            </VisuallyHidden>
            <div className="flex-1 overflow-hidden">
              <PTOnboarding onComplete={handleComplete} onFinish={handleFinishOnboarding} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      <AppTour open={tourOpen} onClose={() => setTourOpen(false)} />
    </>
  );
}
