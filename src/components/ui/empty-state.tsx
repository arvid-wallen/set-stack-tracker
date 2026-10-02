import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, children }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center text-center py-10 px-6"
    >
      <div className="relative mb-5 h-20 w-20">
        <span className="absolute inset-0 rounded-full bg-primary/25 animate-pulse-slow" />
        <motion.span
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-3 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-ios"
        >
          <Icon className="h-6 w-6" aria-hidden="true" />
        </motion.span>
      </div>
      <h3 className="font-semibold text-base">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground max-w-xs">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="pill" className="mt-5 press-feedback" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
      {children}
    </motion.div>
  );
}
