import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Bot } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PTChatMessage } from './PTChatMessage';
import { usePTChat } from '@/hooks/usePTChat';
import { cn } from '@/lib/utils';

interface PTChatSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const allSuggestions = [
  // Workout suggestions
  'Skapa ett push-pass',
  'Ge mig ett pull-pass',
  'Skapa ett benpass',
  'Bygg ett helkroppspass',
  'Ge mig ett 30-min pass',
  'Skapa ett axelpass',
  // Technique suggestions
  'Hur gör jag squats?',
  'Teknik för marklyft',
  'Hur gör jag chin-ups?',
  'Rätt form för rodd',
  // Tips suggestions
  'Tips för bättre bänkpress',
  'Hur ökar jag styrka snabbt?',
  'Bästa övningarna för rygg',
  'Hur bygger jag större armar?',
  'Tips för bättre kondition',
];

export function PTChatSheet({ isOpen, onClose }: PTChatSheetProps) {
  const [input, setInput] = useState('');
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { messages, isLoading, sendMessage, applyAction, clearChat, hasActiveWorkout } = usePTChat();

  // Rotate suggestions every 3 seconds
  useEffect(() => {
    if (messages.length > 0 || !isOpen) return;
    
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSuggestionIndex(prev => (prev + 3) % allSuggestions.length);
        setIsTransitioning(false);
      }, 200);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [messages.length, isOpen]);

  // Get current 3 suggestions
  const currentSuggestions = [
    allSuggestions[currentSuggestionIndex % allSuggestions.length],
    allSuggestions[(currentSuggestionIndex + 1) % allSuggestions.length],
    allSuggestions[(currentSuggestionIndex + 2) % allSuggestions.length],
  ];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when sheet opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    sendMessage(input);
    setInput('');
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-md p-0 flex flex-col"
      >
        <SheetHeader className="px-4 py-3 pr-14 border-b flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-base">PT Coach</SheetTitle>
              <p className="text-xs text-muted-foreground">
                {hasActiveWorkout ? 'Under ditt pass' : 'Fråga om träning'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearChat}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-medium mb-2">Hej! Jag är din PT 👋</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Fråga mig om träning, teknik eller be mig skapa ett pass åt dig!
                </p>
                <div className="mt-6 space-y-2">
                  <p className="text-xs text-muted-foreground">Prova att fråga:</p>
                  <div className={cn(
                    "flex flex-wrap gap-2 justify-center transition-opacity duration-200",
                    isTransitioning ? "opacity-0" : "opacity-100"
                  )}>
                    {currentSuggestions.map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => sendMessage(suggestion)}
                        disabled={isLoading}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <PTChatMessage
                  key={message.id}
                  message={message}
                  onApplyAction={applyAction}
                />
              ))
            )}

            {isLoading && messages.length > 0 && !messages[messages.length - 1]?.content && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                  <Bot className="h-4 w-4 text-accent-foreground" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <form 
          onSubmit={handleSubmit} 
          className="p-4 border-t bg-background/95 backdrop-blur-sm"
        >
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Skriv ett meddelande..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}