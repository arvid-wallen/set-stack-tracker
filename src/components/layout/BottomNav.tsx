import { Home, Calendar, BarChart3, Library, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SPRING } from '@/lib/motion';
import { haptic } from '@/lib/haptics';

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
      <div className="ios-tab-bar-inner">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => !isActive && haptic('light')}
              className={cn(
                'relative flex items-center justify-center w-12 h-12 rounded-full transition-colors',
                isActive ? 'text-primary-foreground' : 'text-muted-foreground active:scale-95'
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0.5 rounded-full bg-primary shadow-lg"
                  transition={SPRING}
                />
              )}
              <Icon className={cn('relative h-5 w-5', isActive && 'stroke-[2.5px]')} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
