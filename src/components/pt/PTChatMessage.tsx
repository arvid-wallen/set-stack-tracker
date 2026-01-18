import { Bot, User, Play, Plus, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMessage, PTAction, CreateWorkoutData, AddExerciseData } from '@/hooks/usePTChat';
import { cn } from '@/lib/utils';
import { WORKOUT_TYPE_LABELS } from '@/types/workout';

interface PTChatMessageProps {
  message: ChatMessage;
  onApplyAction: (actionId: string) => void;
}

// Convert markdown-style links to clickable links
function renderContent(content: string) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    
    // Add the link
    parts.push(
      <a
        key={match.index}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline inline-flex items-center gap-1"
      >
        {match[1]}
        <ExternalLink className="h-3 w-3" />
      </a>
    );
    
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : content;
}

function ActionButton({ action, onApply }: { action: PTAction; onApply: () => void }) {
  if (action.type === 'create_workout') {
    const data = action.data as CreateWorkoutData;
    return (
      <Button
        onClick={onApply}
        disabled={action.applied}
        className={cn(
          "w-full justify-start gap-2 h-auto py-3",
          action.applied && "opacity-60"
        )}
        variant={action.applied ? "secondary" : "default"}
      >
        {action.applied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        <div className="text-left">
          <div className="font-medium">
            {action.applied ? 'Pass startat' : 'Starta detta pass'}
          </div>
          <div className="text-xs opacity-80">
            {data.name} • {data.exercises.length} övningar
          </div>
        </div>
      </Button>
    );
  }

  if (action.type === 'add_exercise') {
    const data = action.data as AddExerciseData;
    return (
      <Button
        onClick={onApply}
        disabled={action.applied}
        className={cn(
          "w-full justify-start gap-2 h-auto py-3",
          action.applied && "opacity-60"
        )}
        variant={action.applied ? "secondary" : "outline"}
      >
        {action.applied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        <div className="text-left">
          <div className="font-medium">
            {action.applied ? 'Tillagd' : `Lägg till ${data.exercise_name}`}
          </div>
          {data.sets && data.reps && (
            <div className="text-xs opacity-80">
              {data.sets} set × {data.reps} reps
            </div>
          )}
        </div>
      </Button>
    );
  }

  return null;
}

export function PTChatMessage({ message, onApplyAction }: PTChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div className={cn(
        "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
        isUser ? "bg-primary/10" : "bg-accent"
      )}>
        {isUser ? (
          <User className="h-4 w-4 text-primary" />
        ) : (
          <Bot className="h-4 w-4 text-accent-foreground" />
        )}
      </div>
      
      <div className={cn(
        "flex-1 space-y-2",
        isUser && "flex flex-col items-end"
      )}>
        <div className={cn(
          "rounded-2xl px-4 py-2.5 max-w-[85%]",
          isUser 
            ? "bg-primary text-primary-foreground rounded-tr-sm" 
            : "bg-muted rounded-tl-sm"
        )}>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {renderContent(message.content)}
          </p>
        </div>

        {message.actions && message.actions.length > 0 && (
          <div className="space-y-2 max-w-[85%]">
            {message.actions.map(action => (
              <ActionButton
                key={action.id}
                action={action}
                onApply={() => onApplyAction(action.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
