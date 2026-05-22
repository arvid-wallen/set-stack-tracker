import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Calendar, BarChart3, Library, User, PartyPopper, ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { celebrate } from '@/lib/celebrate';

export const APP_TOUR_KEY = 'app-tour-completed';

interface AppTourProps {
  open: boolean;
  onClose: () => void;
}

const STOPS = [
  {
    icon: Home,
    title: 'Hem',
    description: 'Starta pass och håll koll på dina veckomål, streaks och PT-förslag.',
    accent: '🏠',
  },
  {
    icon: Calendar,
    title: 'Kalender',
    description: 'All din träningshistorik på ett ställe — bläddra fram alla pass.',
    accent: '📅',
  },
  {
    icon: BarChart3,
    title: 'Statistik',
    description: 'Följ utveckling, volym och dina personbästa över tid.',
    accent: '📈',
  },
  {
    icon: Library,
    title: 'Bibliotek',
    description: 'Övningar och färdiga rutiner — spara dina favoriter.',
    accent: '📚',
  },
  {
    icon: User,
    title: 'Profil',
    description: 'Mål, framstegsbilder och inställningar.',
    accent: '👤',
  },
];

export function AppTour({ open, onClose }: AppTourProps) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const isOutro = index === STOPS.length;
  const total = STOPS.length;

  // Reset when opened, fire confetti on outro
  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  useEffect(() => {
    if (open && isOutro) {
      const t = setTimeout(() => celebrate(), 250);
      return () => clearTimeout(t);
    }
  }, [open, isOutro]);

  if (!open) return null;

  const finish = () => {
    try {
      localStorage.setItem(APP_TOUR_KEY, '1');
    } catch {
      /* ignore */
    }
    onClose();
    navigate('/', { replace: true });
  };

  const stop = !isOutro ? STOPS[index] : null;
  const Icon = stop?.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />

      {/* Card */}
      <div
        key={index}
        className="relative w-full max-w-sm rounded-3xl bg-card border shadow-2xl p-6 animate-scale-in"
      >
        <button
          onClick={finish}
          aria-label="Hoppa över"
          className="absolute top-3 right-3 h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {!isOutro && Icon && stop ? (
          <>
            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5 mb-6">
              {STOPS.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    i === index ? 'w-6 bg-primary' : i < index ? 'w-1.5 bg-primary/60' : 'w-1.5 bg-muted'
                  )}
                />
              ))}
            </div>

            <div className="flex flex-col items-center text-center space-y-5">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/30 blur-2xl animate-pulse" />
                <div className="relative h-24 w-24 rounded-3xl bg-primary flex items-center justify-center animate-scale-in">
                  <Icon className="h-12 w-12 text-primary-foreground" strokeWidth={2.25} />
                </div>
                <span className="absolute -top-2 -right-2 text-2xl animate-fade-in" style={{ animationDelay: '180ms' }}>
                  {stop.accent}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="font-display text-2xl font-bold">{stop.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{stop.description}</p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              {index > 0 ? (
                <Button variant="outline" className="flex-1" onClick={() => setIndex((i) => Math.max(0, i - 1))}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Tillbaka
                </Button>
              ) : (
                <Button variant="ghost" className="flex-1 text-muted-foreground" onClick={finish}>
                  Hoppa över
                </Button>
              )}
              <Button className="flex-1" onClick={() => setIndex((i) => i + 1)}>
                {index === total - 1 ? 'Nästan klar' : 'Nästa'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center text-center space-y-6 py-2">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/40 blur-3xl animate-pulse" />
              <div className="relative h-28 w-28 rounded-full bg-primary flex items-center justify-center animate-scale-in">
                <PartyPopper className="h-14 w-14 text-primary-foreground" />
              </div>
            </div>
            <div className="space-y-3 animate-fade-in" style={{ animationDelay: '120ms' }}>
              <h3 className="font-display text-3xl font-bold">Nu kör vi! 🚀</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                Du är redo att slakta gymmet. Lycka till!
              </p>
            </div>
            <Button size="lg" className="h-12 px-8 w-full animate-fade-in" style={{ animationDelay: '240ms' }} onClick={finish}>
              <Sparkles className="h-4 w-4 mr-2" />
              Sätt igång
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
