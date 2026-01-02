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
    <nav className="ios-tab-bar">
      <div className="flex items-center justify-around h-20 pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-all",
                isActive ? "text-primary" : "text-muted-foreground active:scale-95"
              )}
            >
              <div className={cn(
                "p-2 rounded-ios-md transition-colors",
                isActive && "bg-primary/10"
              )}>
                <Icon className={cn("h-6 w-6", isActive && "stroke-[2.5px]")} />
              </div>
              <span className={cn(
                "text-[10px] font-medium mt-0.5",
                isActive && "font-semibold"
              )}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
