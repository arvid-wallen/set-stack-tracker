import { forwardRef } from 'react';
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

export const BottomNav = forwardRef<HTMLElement, object>(
  function BottomNav(_props, ref) {
    const location = useLocation();

    return (
      <nav ref={ref} className="ios-tab-bar">
      <div className="ios-tab-bar-inner">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center px-3 py-2 transition-all",
                isActive 
                  ? "text-primary-foreground" 
                  : "text-muted-foreground active:scale-95"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200",
                isActive 
                  ? "bg-primary shadow-lg" 
                  : "hover:bg-muted/50"
              )}>
                <Icon className={cn(
                  "h-5 w-5",
                  isActive && "stroke-[2.5px]"
                )} />
              </div>
              <span className={cn(
                "text-[10px] font-medium mt-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
        </div>
      </nav>
    );
  }
);
