import { useState, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronUp, Trash2, MoreVertical, Link2, Unlink, Circle, CheckCircle2, Activity, MessageSquare, Pencil, X, Check, LineChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SetRow } from './SetRow';
import { CardioLogRow } from './CardioLogRow';
import { AISetSuggestionCard } from './AISetSuggestionCard';
import { ExerciseHistorySheet } from './ExerciseHistorySheet';
import { useExerciseNotes } from '@/hooks/useExerciseNotes';
import { WorkoutExercise, ExerciseSet, CardioLog, MUSCLE_GROUP_LABELS, CardioType } from '@/types/workout';
import { cn } from '@/lib/utils';

interface ExerciseCardProps {
  workoutExercise: WorkoutExercise;
  onAddSet: (data: Partial<ExerciseSet>) => void;
  onUpdateSet?: (setId: string, data: Partial<ExerciseSet>) => void;
  onDeleteSet: (setId: string) => void;
  onRemoveExercise: () => void;
  onStartRest: () => void;
  onLinkSuperset?: () => void;
  onUnlinkSuperset?: () => void;
  onMarkComplete?: (completed: boolean) => void;
  onAddCardioLog?: (data: Partial<CardioLog>) => void;
  onUpdateCardioLog?: (logId: string, data: Partial<CardioLog>) => void;
  onDeleteCardioLog?: (logId: string) => void;
  supersetBadge?: number;
}

export function ExerciseCard({
  workoutExercise,
  onAddSet,
  onUpdateSet,
  onDeleteSet,
  onRemoveExercise,
  onStartRest,
  onLinkSuperset,
  onUnlinkSuperset,
  onMarkComplete,
  onAddCardioLog,
  onUpdateCardioLog,
  onDeleteCardioLog,
  supersetBadge,
}: ExerciseCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newSetKey, setNewSetKey] = useState(0);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const exercise = workoutExercise.exercise;
  const isCompleted = workoutExercise.is_completed;
  const isCardio = exercise?.is_cardio ?? false;
  const cardioLog = workoutExercise.cardioLog;
  const sets = workoutExercise.sets || [];
  const workingSets = sets.filter(s => !s.is_warmup);
  const warmupSets = sets.filter(s => s.is_warmup);

  // Fetch persistent exercise notes
  const { note: exerciseNote, saveNote, deleteNote, isLoading: noteLoading } = useExerciseNotes(workoutExercise.exercise_id);

  // Auto-collapse when marked complete
  useEffect(() => {
    if (isCompleted) {
      setIsExpanded(false);
    }
  }, [isCompleted]);

  const handleToggleComplete = useCallback(() => {
    onMarkComplete?.(!isCompleted);
  }, [onMarkComplete, isCompleted]);

  const lastWorkingSet = workingSets[workingSets.length - 1];

  // Only show "Förra: ..." hint from actual last set in current workout. No auto-prefill.
  const previousSetData = lastWorkingSet ? {
    weight_kg: lastWorkingSet.weight_kg,
    reps: lastWorkingSet.reps,
  } : undefined;

  // Prefill from accepted AI suggestion (imperative)
  const [prefill, setPrefill] = useState<{ weight_kg: number; reps: number; rpe?: number | null } | undefined>();
  const handleAcceptSuggestion = useCallback((weight: number, reps: number, rpeVal: number | null) => {
    setPrefill({ weight_kg: weight, reps, rpe: rpeVal });
    setNewSetKey(prev => prev + 1);
  }, []);

  const handleSaveNewSet = useCallback((data: { 
    weight_kg: number; 
    reps: number; 
    is_warmup: boolean; 
    is_bodyweight: boolean;
    rpe?: number | null;
  }) => {
    onAddSet({
      ...data,
      rpe: data.rpe ?? null,
    });
    // Force new SetRow component by changing key
    setNewSetKey(prev => prev + 1);
    onStartRest();
  }, [onAddSet, onStartRest]);

  const handleSaveCardio = useCallback((data: Partial<CardioLog>) => {
    if (onAddCardioLog) {
      onAddCardioLog(data);
    }
  }, [onAddCardioLog]);

  const handleUpdateCardio = useCallback((data: Partial<CardioLog>) => {
    if (cardioLog && onUpdateCardioLog) {
      onUpdateCardioLog(cardioLog.id, data);
    }
  }, [cardioLog, onUpdateCardioLog]);

  const handleStartEditNote = useCallback(() => {
    setNoteText(exerciseNote?.note || '');
    setIsEditingNote(true);
  }, [exerciseNote]);

  const handleSaveNote = useCallback(async () => {
    if (noteText.trim()) {
      const success = await saveNote(noteText.trim());
      if (success) {
        setIsEditingNote(false);
      }
    }
  }, [noteText, saveNote]);

  const handleCancelEditNote = useCallback(() => {
    setIsEditingNote(false);
    setNoteText('');
  }, []);

  const handleDeleteNote = useCallback(async () => {
    const success = await deleteNote();
    if (success) {
      setIsEditingNote(false);
      setNoteText('');
    }
  }, [deleteNote]);

  if (!exercise) return null;

  return (
    <Card className={cn(
      "rounded-2xl overflow-hidden transition-all duration-300 shadow-ios p-4 animate-slide-in-bottom",
      supersetBadge && "border-l-4 border-l-primary",
      isCompleted && "opacity-60 bg-muted/30"
    )}>
      {/* Header */}
      <div className="flex items-center gap-3">
        {/* Complete toggle */}
        <button
          className="touch-target flex items-center justify-center transition-transform active:scale-90"
          onClick={handleToggleComplete}
          aria-label={isCompleted ? "Markera som ej klar" : "Markera som klar"}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-6 w-6 text-green-500 animate-pop" />
          ) : (
            <Circle className="h-6 w-6 text-muted-foreground" />
          )}
        </button>

        {supersetBadge && (
          <Badge variant="outline" className="rounded-full w-6 h-6 p-0 flex items-center justify-center text-xs border-primary text-primary">
            {supersetBadge}
          </Badge>
        )}
        
        <button
          className="flex-1 text-left touch-target min-w-0"
          onClick={() => setShowHistory(true)}
          aria-label="Visa historik"
        >
          <div className="flex items-center gap-2 flex-wrap">
            {isCardio && <Activity className="h-4 w-4 text-orange-500 shrink-0" />}
            <h3 className={cn(
              "font-semibold truncate max-w-[180px] sm:max-w-none underline-offset-4 decoration-dotted decoration-muted-foreground/40 hover:decoration-primary",
              isCompleted && "line-through text-muted-foreground"
            )}>{exercise.name}</h3>
            <LineChart className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
            {isCardio && (
              <Badge variant="secondary" className="text-xs bg-orange-500/20 text-orange-500 border-orange-500/30 shrink-0 rounded-full">
                Cardio
              </Badge>
            )}
            {isCompleted && (
              <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-500 border-green-500/30 shrink-0 rounded-full">
                ✓ Klar
              </Badge>
            )}
          </div>
          <div className="flex gap-1 mt-1 flex-wrap">
            {!isCardio && exercise.muscle_groups.slice(0, 2).map(mg => (
              <Badge key={mg} variant="secondary" className="text-xs rounded-full">
                {MUSCLE_GROUP_LABELS[mg]}
              </Badge>
            ))}
            {isCardio && cardioLog && (
              <span className="text-xs text-muted-foreground">
                {cardioLog.duration_seconds && `${Math.floor(cardioLog.duration_seconds / 60)} min`}
                {cardioLog.distance_km && ` · ${cardioLog.distance_km} km`}
              </span>
            )}
            {!isCardio && sets.length > 0 && (
              <span className="text-xs text-muted-foreground ml-1">
                {workingSets.length} set{workingSets.length !== 1 ? 's' : ''}
                {warmupSets.length > 0 && ` + ${warmupSets.length} uppv.`}
              </span>
            )}
          </div>
        </button>

        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 touch-target rounded-ios-md shrink-0"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? "Fäll ihop" : "Visa set"}
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 touch-target rounded-ios-md" aria-label="Fler val">
              <MoreVertical className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-ios-lg">
            {onLinkSuperset && (
              <DropdownMenuItem onClick={onLinkSuperset}>
                <Link2 className="h-4 w-4 mr-2" />
                Länka till superset
              </DropdownMenuItem>
            )}
            {supersetBadge && onUnlinkSuperset && (
              <DropdownMenuItem onClick={onUnlinkSuperset}>
                <Unlink className="h-4 w-4 mr-2" />
                Ta bort från superset
              </DropdownMenuItem>
            )}
            {(onLinkSuperset || supersetBadge) && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={() => setShowHistory(true)}>
              <LineChart className="h-4 w-4 mr-2" />
              Visa historik & trend
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleStartEditNote}>
              <MessageSquare className="h-4 w-4 mr-2" />
              {exerciseNote ? 'Redigera kommentar' : 'Lägg till kommentar'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={onRemoveExercise}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Ta bort övning
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Persistent Exercise Note */}
      {(exerciseNote || isEditingNote) && (
        <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          {isEditingNote ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm font-medium">Kommentar</span>
              </div>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Skriv en kommentar som visas varje gång du gör denna övning..."
                className="min-h-[80px] bg-background/50 border-amber-500/30 focus:border-amber-500"
                autoFocus
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelEditNote}
                    className="h-8"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Avbryt
                  </Button>
                  {exerciseNote && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDeleteNote}
                      className="h-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Ta bort
                    </Button>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={handleSaveNote}
                  disabled={!noteText.trim()}
                  className="h-8"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Spara
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300 flex-1">{exerciseNote?.note}</p>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleStartEditNote}
                className="h-6 w-6 shrink-0 text-amber-600 dark:text-amber-400 hover:text-amber-700"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Content: Cardio or Sets */}
      {isExpanded && (
        <div className="mt-4">
          {/* AI suggestion (accept/reject card — never auto-fills the input) */}
          {!isCardio && !isCompleted && (
            <div className="mb-4">
              <AISetSuggestionCard
                exerciseId={workoutExercise.exercise_id}
                workoutSessionId={workoutExercise.workout_session_id}
                onAccept={handleAcceptSuggestion}
              />
            </div>
          )}

          {isCardio ? (
            /* Cardio log input */
            <CardioLogRow
              cardioLog={cardioLog}
              cardioType={(exercise.name?.toLowerCase().includes('löpning') ? 'running' :
                          exercise.name?.toLowerCase().includes('cykel') ? 'cycling' :
                          exercise.name?.toLowerCase().includes('rodd') ? 'rowing' :
                          exercise.name?.toLowerCase().includes('simning') ? 'swimming' :
                          'running') as CardioType}
              onSave={handleSaveCardio}
              onUpdate={handleUpdateCardio}
              onDelete={cardioLog ? () => onDeleteCardioLog?.(cardioLog.id) : undefined}
            />
          ) : (
            /* Strength training sets */
            <div className="space-y-1">
              {/* Warmup sets */}
              {warmupSets.map((set, i) => (
                <SetRow
                  key={set.id}
                  set={set}
                  setNumber={i + 1}
                  onSave={(data) => onUpdateSet?.(set.id, data)}
                  onDelete={() => onDeleteSet(set.id)}
                />
              ))}

              {/* Working sets */}
              {workingSets.map((set, i) => (
                <SetRow
                  key={set.id}
                  set={set}
                  setNumber={i + 1}
                  previousSet={i > 0 ? {
                    weight_kg: workingSets[i - 1].weight_kg,
                    reps: workingSets[i - 1].reps,
                  } : undefined}
                  onSave={(data) => onUpdateSet?.(set.id, data)}
                  onDelete={() => onDeleteSet(set.id)}
                />
              ))}

              {/* New set row - key changes force remount after save */}
              <div className="pt-2 mt-1 border-t border-dashed border-border/40">
                <SetRow
                  key={`new-${newSetKey}`}
                  setNumber={workingSets.length + 1}
                  isNew
                  previousSet={previousSetData}
                  onSave={handleSaveNewSet}
                  onStartRest={onStartRest}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <ExerciseHistorySheet
        open={showHistory}
        onOpenChange={setShowHistory}
        exerciseId={workoutExercise.exercise_id}
        exerciseName={exercise.name}
      />
    </Card>
  );
}
