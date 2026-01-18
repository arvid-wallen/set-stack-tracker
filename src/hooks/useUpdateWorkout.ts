import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UpdateWorkoutData {
  duration_seconds?: number;
  rating?: number;
  notes?: string;
}

export function useUpdateWorkout() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateWorkout = useMutation({
    mutationFn: async ({ workoutId, data }: { workoutId: string; data: UpdateWorkoutData }) => {
      const { error } = await supabase
        .from('workout_sessions')
        .update(data)
        .eq('id', workoutId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-history'] });
      toast({ title: 'Pass uppdaterat!' });
    },
    onError: (error) => {
      console.error('Error updating workout:', error);
      toast({ title: 'Kunde inte uppdatera pass', variant: 'destructive' });
    },
  });

  return { updateWorkout };
}
