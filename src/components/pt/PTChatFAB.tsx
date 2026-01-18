import { useState } from 'react';
import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PTChatSheet } from './PTChatSheet';
import { useWorkout } from '@/hooks/useWorkout';
import { cn } from '@/lib/utils';

export function PTChatFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const { activeWorkout, isMinimized } = useWorkout();

  // Determine if we need to shift the FAB up to avoid WorkoutMiniBar
  const showMiniBar = activeWorkout && isMinimized;

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size="icon"
        className={cn(
          "fixed right-4 z-40",
          "h-14 w-14 rounded-full",
          "bg-primary hover:bg-primary/90",
          "shadow-lg shadow-primary/25",
          "transition-all duration-300 ease-out",
          "hover:scale-105 active:scale-95",
          // Position based on whether MiniBar is visible
          showMiniBar 
            ? "bottom-[calc(160px+env(safe-area-inset-bottom))]"
            : "bottom-[calc(100px+env(safe-area-inset-bottom))]"
        )}
      >
        <Bot className="h-6 w-6" />
      </Button>

      <PTChatSheet isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
