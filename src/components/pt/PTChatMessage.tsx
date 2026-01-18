import { useState } from 'react';
import { Bot, User, Play, Plus, Check, ExternalLink, Dumbbell, ChevronUp, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMessage, PTAction, CreateWorkoutData, AddExerciseData } from '@/hooks/usePTChat';
import { cn } from '@/lib/utils';

interface PTChatMessageProps {
  message: ChatMessage;
  onApplyAction: (actionId: string, editedExercises?: CreateWorkoutData['exercises']) => void;
}

// Convert markdown-style bold and links to formatted elements
function renderContent(content: string) {
  const parts: (string | JSX.Element)[] = [];
  
  // Combined regex for bold (**text**) and links [text](url)
  const combinedRegex = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = combinedRegex.exec(content)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    
    if (match[1]) {
      // Bold text: **text**
      parts.push(
        <strong key={`bold-${keyIndex++}`} className="font-semibold">
          {match[1]}
        </strong>
      );
    } else if (match[2] && match[3]) {
      // Link: [text](url)
      parts.push(
        <a
          key={`link-${keyIndex++}`}
          href={match[3]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-700 dark:text-green-400 hover:underline inline-flex items-center gap-1"
        >
          {match[2]}
          <ExternalLink className="h-3 w-3" />
        </a>
      );
    }
    
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : content;
}

// Separate component for create_workout action - has its own state
function CreateWorkoutActionCard({ 
  action, 
  initialExercises, 
  onApply 
}: { 
  action: PTAction; 
  initialExercises: CreateWorkoutData['exercises'];
  onApply: (editedExercises: CreateWorkoutData['exercises']) => void;
}) {
  const [editedExercises, setEditedExercises] = useState(initialExercises);
  const data = action.data as CreateWorkoutData;

  const removeExercise = (index: number) => {
    if (editedExercises.length <= 1) return;
    setEditedExercises(prev => prev.filter((_, i) => i !== index));
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= editedExercises.length) return;
    const newExercises = [...editedExercises];
    [newExercises[index], newExercises[targetIndex]] = 
      [newExercises[targetIndex], newExercises[index]];
    setEditedExercises(newExercises);
  };

  return (
    <div className="bg-muted/50 rounded-lg border overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-primary" />
          <span className="font-medium">{data.name}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {editedExercises.length} övningar
        </span>
      </div>
      
      <div className="px-3 py-2 space-y-1">
        {editedExercises.map((exercise, index) => (
          <div 
            key={`${exercise.exercise_name}-${index}`} 
            className="flex items-center gap-1 text-sm group py-1 px-1 -mx-1 rounded hover:bg-muted/50 transition-colors"
          >
            <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => moveExercise(index, 'up')}
                disabled={index === 0}
                className="h-4 w-4 flex items-center justify-center hover:bg-muted rounded disabled:opacity-30 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Flytta upp"
              >
                <ChevronUp className="h-3 w-3" />
              </button>
              <button 
                onClick={() => moveExercise(index, 'down')}
                disabled={index === editedExercises.length - 1}
                className="h-4 w-4 flex items-center justify-center hover:bg-muted rounded disabled:opacity-30 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Flytta ned"
              >
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
            
            <span className="flex-1 text-muted-foreground truncate">
              {index + 1}. {exercise.exercise_name}
            </span>
            <span className="text-xs font-medium tabular-nums whitespace-nowrap">
              {exercise.sets} × {exercise.reps}
            </span>
            
            <button 
              onClick={() => removeExercise(index)}
              disabled={editedExercises.length <= 1}
              className="h-5 w-5 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
              aria-label="Ta bort övning"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      
      <div className="p-3 border-t">
        <Button
          onClick={() => onApply(editedExercises)}
          disabled={action.applied || editedExercises.length === 0}
          className="w-full gap-2"
          variant={action.applied ? "secondary" : "default"}
        >
          {action.applied ? (
            <>
              <Check className="h-4 w-4" />
              Pass startat
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Starta detta pass
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Separate component for add_exercise action - no state needed
function AddExerciseActionButton({ 
  action, 
  onApply 
}: { 
  action: PTAction; 
  onApply: () => void;
}) {
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

// Main action button switcher - no hooks, just routing
function ActionButton({ action, onApply }: { action: PTAction; onApply: (editedExercises?: CreateWorkoutData['exercises']) => void }) {
  if (!action || !action.type) {
    return null;
  }
  
  if (action.type === 'create_workout') {
    const data = action.data as CreateWorkoutData;
    if (!data || !Array.isArray(data.exercises)) {
      return null;
    }
    return (
      <CreateWorkoutActionCard 
        action={action} 
        initialExercises={data.exercises}
        onApply={onApply}
      />
    );
  }

  if (action.type === 'add_exercise') {
    const data = action.data as AddExerciseData;
    if (!data || !data.exercise_name) {
      return null;
    }
    return (
      <AddExerciseActionButton 
        action={action} 
        onApply={() => onApply()}
      />
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

        {message.actions && Array.isArray(message.actions) && message.actions.length > 0 && (
          <div className="space-y-2 max-w-[85%]">
            {message.actions.map(action => (
              <ActionButton
                key={action.id}
                action={action}
                onApply={(editedExercises) => onApplyAction(action.id, editedExercises)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
