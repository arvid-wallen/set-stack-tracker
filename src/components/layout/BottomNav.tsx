import { Home, Calendar, BarChart3, Library, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { icon: Home, label: 'Hem', path: '/' },
  { icon: Calendar, label: 'Kalender', path: '/calendar' },
  { icon: BarChart3, label: 'Statistik', path: '/stats' },
  { icon: Library, label: 'Bibliotek', path: '/library' },
  { icon: User, label: 'Profil', path: '/profile' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border safe-bottom z-40">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}