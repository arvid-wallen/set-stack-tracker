import { TrendingUp, TrendingDown, Repeat, Zap, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useProgressiveOverload, SuggestionType } from '@/hooks/useProgressiveOverload';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface ProgressiveOverloadSuggestionProps {
  exerciseId: string;
  compact?: boolean;
}

const SUGGESTION_CONFIG: Record<SuggestionType, {
  icon: typeof TrendingUp;
  color: string;
  bgColor: string;
}> = {
  increase_weight: {
    icon: TrendingUp,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10 border-green-500/30',
  },
  increase_reps: {
    icon: Repeat,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10 border-blue-500/30',
  },
  deload: {
    icon: TrendingDown,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10 border-orange-500/30',
  },
  maintain: {
    icon: Zap,
    color: 'text-primary',
    bgColor: 'bg-primary/10 border-primary/30',
  },
  first_time: {
    icon: HelpCircle,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50 border-muted',
  },
};

export function ProgressiveOverloadSuggestion({ 
  exerciseId, 
  compact = false 
}: ProgressiveOverloadSuggestionProps) {
  const { suggestion, isLoading } = useProgressiveOverload(exerciseId);

  if (isLoading) {
    return <Skeleton className="h-8 w-48" />;
  }

  if (!suggestion) {
    return null;
  }

  const config = SUGGESTION_CONFIG[suggestion.type];
  
  // Guard against undefined config or icon
  if (!config || !config.icon) {
    return null;
  }
  
  const Icon = config.icon;

  if (compact) {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          'gap-1.5 font-normal text-xs',
          config.bgColor,
          config.color
        )}
      >
        <Icon className="h-3 w-3" />
        {suggestion.suggestedWeight && `${suggestion.suggestedWeight} kg`}
        {suggestion.suggestedWeight && suggestion.suggestedReps && ' × '}
        {suggestion.suggestedReps && `${suggestion.suggestedReps} reps`}
        {!suggestion.suggestedWeight && !suggestion.suggestedReps && suggestion.message}
      </Badge>
    );
  }

  return (
    <div 
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border',
        config.bgColor
      )}
    >
      <div className={cn('p-2 rounded-full', config.bgColor)}>
        <Icon className={cn('h-4 w-4', config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', config.color)}>
          {suggestion.message}
        </p>
        {suggestion.confidence === 'high' && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Baserat på de senaste {5} passen
          </p>
        )}
      </div>
    </div>
  );
}
