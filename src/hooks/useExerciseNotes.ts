import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ExerciseNote {
  id: string;
  user_id: string;
  exercise_id: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export function useExerciseNotes(exerciseId: string | null) {
  const [note, setNote] = useState<ExerciseNote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchNote = useCallback(async () => {
    if (!exerciseId) return;
    
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('exercise_notes')
        .select('*')
        .eq('exercise_id', exerciseId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setNote(data);
    } catch (error) {
      console.error('Error fetching exercise note:', error);
    } finally {
      setIsLoading(false);
    }
  }, [exerciseId]);

  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

  const saveNote = useCallback(async (noteText: string) => {
    if (!exerciseId) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Ej inloggad',
          description: 'Du måste vara inloggad för att spara kommentarer',
          variant: 'destructive',
        });
        return false;
      }

      if (note) {
        // Update existing note
        const { error } = await supabase
          .from('exercise_notes')
          .update({ note: noteText })
          .eq('id', note.id);

        if (error) throw error;
      } else {
        // Create new note
        const { error } = await supabase
          .from('exercise_notes')
          .insert({
            user_id: user.id,
            exercise_id: exerciseId,
            note: noteText,
          });

        if (error) throw error;
      }

      await fetchNote();
      toast({
        title: 'Kommentar sparad',
        description: 'Din kommentar har sparats för denna övning',
      });
      return true;
    } catch (error) {
      console.error('Error saving exercise note:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte spara kommentaren',
        variant: 'destructive',
      });
      return false;
    }
  }, [exerciseId, note, fetchNote, toast]);

  const deleteNote = useCallback(async () => {
    if (!note) return false;

    try {
      const { error } = await supabase
        .from('exercise_notes')
        .delete()
        .eq('id', note.id);

      if (error) throw error;
      
      setNote(null);
      toast({
        title: 'Kommentar borttagen',
        description: 'Kommentaren har tagits bort',
      });
      return true;
    } catch (error) {
      console.error('Error deleting exercise note:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte ta bort kommentaren',
        variant: 'destructive',
      });
      return false;
    }
  }, [note, toast]);

  return {
    note,
    isLoading,
    saveNote,
    deleteNote,
    refetch: fetchNote,
  };
}
