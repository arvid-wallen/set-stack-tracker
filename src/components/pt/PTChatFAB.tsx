import { useState, useEffect, useRef } from 'react';
import { Bot } from 'lucide-react';
import { PTChatSheet } from './PTChatSheet';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'pt-fab-position';

export function PTChatFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? parseFloat(saved) : 50;
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ y: 0, startPos: 0 });
  const hasDraggedRef = useRef(false);

  // Mouse drag handlers
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - dragStartRef.current.y;
      const deltaPercent = (deltaY / window.innerHeight) * 100;
      const newPos = Math.min(85, Math.max(15, dragStartRef.current.startPos + deltaPercent));
      setPosition(newPos);
      
      if (Math.abs(deltaY) > 5) {
        hasDraggedRef.current = true;
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      localStorage.setItem(STORAGE_KEY, position.toString());
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { y: e.clientY, startPos: position };
    hasDraggedRef.current = false;
    e.preventDefault();
  };

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = { y: touch.clientY, startPos: position };
    hasDraggedRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const deltaY = touch.clientY - dragStartRef.current.y;
    const deltaPercent = (deltaY / window.innerHeight) * 100;
    const newPos = Math.min(85, Math.max(15, dragStartRef.current.startPos + deltaPercent));
    setPosition(newPos);
    
    if (Math.abs(deltaY) > 5) {
      hasDraggedRef.current = true;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    localStorage.setItem(STORAGE_KEY, position.toString());
    
    // Open sheet if it wasn't a drag
    if (!hasDraggedRef.current) {
      setIsOpen(true);
    }
  };

  const handleClick = () => {
    // Only open if it wasn't a drag
    if (!hasDraggedRef.current) {
      setIsOpen(true);
    }
  };

  return (
    <>
      <button
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        className={cn(
          // Position: fixed on right edge
          "fixed right-0 z-40",
          // Size: slim notch
          "h-11 w-7 pl-1.5",
          // Shape: rounded left side, flat right
          "rounded-l-xl rounded-r-none",
          // Color
          "bg-primary hover:bg-primary/90",
          // Shadow to the left
          "shadow-lg shadow-black/10",
          // Animation (disabled during drag)
          !isDragging && "transition-all duration-200",
          "hover:w-9 hover:pl-2",
          // Flexbox for icon
          "flex items-center justify-start",
          // Cursor feedback
          isDragging ? "cursor-grabbing" : "cursor-grab",
          // Prevent text selection during drag
          "select-none touch-none"
        )}
        style={{ 
          top: `${position}%`, 
          transform: 'translateY(-50%)' 
        }}
      >
        <Bot className="h-4 w-4 text-primary-foreground" />
      </button>

      <PTChatSheet isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
