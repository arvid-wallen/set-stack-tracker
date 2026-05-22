import { useQuery } from "@tanstack/react-query";
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AISetSuggestion {
  weight_kg: number;
  reps: number;
  rpe: number | null;
  rationale: string;
  confidence: "high" | "medium" | "low";
}

function dismissKey(sessionId: string, exerciseId: string) {
  return `dismissed-suggestion:${sessionId}:${exerciseId}`;
}

export function useAISetSuggestion(exerciseId: string | null, workoutSessionId: string | null) {
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    if (!exerciseId || !workoutSessionId) return;
    setDismissed(sessionStorage.getItem(dismissKey(workoutSessionId, exerciseId)) === "1");
  }, [exerciseId, workoutSessionId]);

  const query = useQuery({
    queryKey: ["ai-set-suggestion", exerciseId, workoutSessionId],
    enabled: !!exerciseId && !!workoutSessionId && !dismissed,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("suggest-next-set", {
        body: { exercise_id: exerciseId, workout_session_id: workoutSessionId },
      });
      if (error) throw error;
      return (data?.suggestion as AISetSuggestion | null) ?? null;
    },
  });

  const dismiss = useCallback(() => {
    if (!exerciseId || !workoutSessionId) return;
    sessionStorage.setItem(dismissKey(workoutSessionId, exerciseId), "1");
    setDismissed(true);
  }, [exerciseId, workoutSessionId]);

  const reset = useCallback(() => {
    if (!exerciseId || !workoutSessionId) return;
    sessionStorage.removeItem(dismissKey(workoutSessionId, exerciseId));
    setDismissed(false);
  }, [exerciseId, workoutSessionId]);

  return {
    suggestion: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
    dismissed,
    dismiss,
    reset,
  };
}
