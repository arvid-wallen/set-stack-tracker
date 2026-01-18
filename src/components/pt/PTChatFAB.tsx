import { useState } from 'react';
import { Bot } from 'lucide-react';
import { PTChatSheet } from './PTChatSheet';
import { cn } from '@/lib/utils';

export function PTChatFAB() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          // Position: fixed on right edge, vertically centered
          "fixed right-0 top-1/2 -translate-y-1/2 z-40",
          // Size: slim notch
          "h-11 w-7 pl-1.5",
          // Shape: rounded left side, flat right
          "rounded-l-xl rounded-r-none",
          // Color
          "bg-primary hover:bg-primary/90",
          // Shadow to the left
          "shadow-lg shadow-black/10",
          // Animation
          "transition-all duration-200",
          "hover:w-9 hover:pl-2",
          // Flexbox for icon
          "flex items-center justify-start"
        )}
      >
        <Bot className="h-4 w-4 text-primary-foreground" />
      </button>

      <PTChatSheet isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
