import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useWorkout } from '@/hooks/useWorkout';
import { useExercises } from '@/hooks/useExercises';
import { usePTProfile } from '@/hooks/usePTProfile';
import { useTrainingHistory } from '@/hooks/useTrainingHistory';
import { findBestExerciseMatch } from '@/lib/exercise-matcher';
import { WorkoutType } from '@/types/workout';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: PTAction[];
}

export interface PTAction {
  id: string;
  type: 'create_workout' | 'add_exercise';
  data: CreateWorkoutData | AddExerciseData;
  applied: boolean;
}

export interface CreateWorkoutData {
  workout_type: WorkoutType;
  name: string;
  exercises: Array<{
    exercise_name: string;
    sets: number;
    reps: number;
    notes?: string;
  }>;
}

export interface AddExerciseData {
  exercise_name: string;
  sets?: number;
  reps?: number;
  notes?: string;
}

const PT_CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pt-chat`;

export function usePTChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { activeWorkout, startWorkout, addExercise: addWorkoutExercise, expandWorkout } = useWorkout();
  const { exercises: allExercises } = useExercises();
  const { ptProfile } = usePTProfile();
  const { trainingHistory } = useTrainingHistory();

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Build user profile data to send
      const userProfile = ptProfile ? {
        goals: ptProfile.goals,
        experience_level: ptProfile.experience_level,
        available_equipment: ptProfile.available_equipment,
        preferred_workout_duration: ptProfile.preferred_workout_duration,
        training_days_per_week: ptProfile.training_days_per_week,
        injuries: ptProfile.injuries,
      } : null;

      const response = await fetch(PT_CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          hasActiveWorkout: !!activeWorkout,
          userProfile,
          trainingHistory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Kunde inte nå PT-assistenten');
      }

      if (!response.body) {
        throw new Error('Inget svar från servern');
      }

      // Stream the response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let assistantContent = '';
      let toolCalls: any[] = [];
      let currentToolCall: any = null;

      const assistantMessageId = `assistant-${Date.now()}`;

      // Add empty assistant message that we'll update
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta;

            if (delta?.content) {
              assistantContent += delta.content;
              setMessages(prev => prev.map(m =>
                m.id === assistantMessageId
                  ? { ...m, content: assistantContent }
                  : m
              ));
            }

            // Handle tool calls
            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                if (tc.index !== undefined) {
                  if (!toolCalls[tc.index]) {
                    toolCalls[tc.index] = { id: tc.id, function: { name: '', arguments: '' } };
                  }
                  if (tc.function?.name) {
                    toolCalls[tc.index].function.name = tc.function.name;
                  }
                  if (tc.function?.arguments) {
                    toolCalls[tc.index].function.arguments += tc.function.arguments;
                  }
                }
              }
            }
          } catch {
            // Incomplete JSON, put back
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Process tool calls into actions
      const actions: PTAction[] = [];
      for (const tc of toolCalls) {
        if (tc?.function?.name && tc?.function?.arguments) {
          try {
            const args = JSON.parse(tc.function.arguments);
            actions.push({
              id: `action-${Date.now()}-${Math.random()}`,
              type: tc.function.name as 'create_workout' | 'add_exercise',
              data: args,
              applied: false,
            });
          } catch (e) {
            console.error('Failed to parse tool call:', e);
          }
        }
      }

      // Update message with actions
      if (actions.length > 0) {
        setMessages(prev => prev.map(m =>
          m.id === assistantMessageId
            ? { ...m, actions }
            : m
        ));
      }

    } catch (error) {
      console.error('PT Chat error:', error);
      toast({
        title: 'Fel',
        description: error instanceof Error ? error.message : 'Kunde inte skicka meddelande',
        variant: 'destructive',
      });
      // Remove the last user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, activeWorkout, ptProfile, trainingHistory, toast]);

  const applyAction = useCallback(async (actionId: string, editedExercises?: CreateWorkoutData['exercises']) => {
    const message = messages.find(m => m.actions?.some(a => a.id === actionId));
    const action = message?.actions?.find(a => a.id === actionId);

    if (!action || action.applied) return;

    try {
      if (action.type === 'create_workout') {
        const data = action.data as CreateWorkoutData;
        // Use edited exercises if provided, otherwise use original
        const exercisesToAdd = editedExercises || data.exercises;
        
        // Start the workout
        const workout = await startWorkout(data.workout_type, data.name);
        if (!workout) {
          throw new Error('Kunde inte starta passet');
        }

        // Add exercises using the workout ID directly to avoid race condition
        let addedCount = 0;
        for (const exercise of exercisesToAdd) {
          const match = findBestExerciseMatch(exercise.exercise_name, allExercises);
          if (match) {
            await addWorkoutExercise(match.id, workout.id);
            addedCount++;
          }
        }

        expandWorkout();
        toast({
          title: 'Pass startat! 💪',
          description: `${data.name} med ${addedCount} övningar`,
        });

      } else if (action.type === 'add_exercise') {
        const data = action.data as AddExerciseData;
        
        if (!activeWorkout) {
          toast({
            title: 'Inget aktivt pass',
            description: 'Starta ett pass först',
            variant: 'destructive',
          });
          return;
        }

        const match = findBestExerciseMatch(data.exercise_name, allExercises);
        if (!match) {
          toast({
            title: 'Övning hittades inte',
            description: `Kunde inte hitta "${data.exercise_name}" i biblioteket`,
            variant: 'destructive',
          });
          return;
        }

        await addWorkoutExercise(match.id);
        toast({
          title: 'Övning tillagd! 💪',
          description: match.name,
        });
      }

      // Mark action as applied
      setMessages(prev => prev.map(m => ({
        ...m,
        actions: m.actions?.map(a =>
          a.id === actionId ? { ...a, applied: true } : a
        ),
      })));

    } catch (error) {
      console.error('Apply action error:', error);
      toast({
        title: 'Fel',
        description: error instanceof Error ? error.message : 'Kunde inte utföra åtgärden',
        variant: 'destructive',
      });
    }
  }, [messages, allExercises, activeWorkout, startWorkout, addWorkoutExercise, expandWorkout, toast]);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    applyAction,
    clearChat,
    hasActiveWorkout: !!activeWorkout,
  };
}
