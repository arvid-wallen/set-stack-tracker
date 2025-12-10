import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { WorkoutType } from '@/types/workout';

export interface RoutineExercise {
  id: string;
  routine_id: string;
  exercise_id: string;
  order_index: number;
  default_sets: number | null;
  default_reps: number | null;
  default_weight_kg: number | null;
  superset_group: number | null;
  notes: string | null;
  exercise?: {
    id: string;
    name: string;
    muscle_groups: string[];
    equipment_type: string;
  };
}

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  workout_type: WorkoutType;
  folder: string | null;
  is_favorite: boolean;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
  exercises?: RoutineExercise[];
}

export function useRoutines() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRoutines();
  }, []);

  const fetchRoutines = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('routines')
        .select(`
          *,
          routine_exercises (
            *,
            exercise:exercises (
              id,
              name,
              muscle_groups,
              equipment_type
            )
          )
        `)
        .order('is_favorite', { ascending: false })
        .order('name');

      if (error) throw error;
      
      const formattedRoutines = (data || []).map(r => ({
        ...r,
        exercises: r.routine_exercises?.sort((a: RoutineExercise, b: RoutineExercise) => a.order_index - b.order_index) || []
      }));
      
      setRoutines(formattedRoutines as Routine[]);
    } catch (error) {
      console.error('Error fetching routines:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createRoutine = async (routine: {
    name: string;
    description?: string;
    workout_type: WorkoutType;
    folder?: string;
    is_favorite?: boolean;
    exercises?: { exercise_id: string; default_sets?: number; default_reps?: number }[];
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('routines')
        .insert([{
          name: routine.name,
          description: routine.description || null,
          workout_type: routine.workout_type,
          folder: routine.folder || null,
          is_favorite: routine.is_favorite || false,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      // Add exercises if provided
      if (routine.exercises && routine.exercises.length > 0) {
        const exercisesToInsert = routine.exercises.map((e, index) => ({
          routine_id: data.id,
          exercise_id: e.exercise_id,
          order_index: index,
          default_sets: e.default_sets || 3,
          default_reps: e.default_reps || 10,
        }));

        const { error: exError } = await supabase
          .from('routine_exercises')
          .insert(exercisesToInsert);

        if (exError) throw exError;
      }

      toast({ title: 'Rutin skapad! 📋' });
      await fetchRoutines();
      return data;
    } catch (error) {
      console.error('Error creating routine:', error);
      toast({ title: 'Kunde inte skapa rutin', variant: 'destructive' });
      return null;
    }
  };

  const updateRoutine = async (id: string, updates: Partial<Pick<Routine, 'name' | 'description' | 'folder' | 'is_favorite' | 'last_used_at'>>) => {
    try {
      const { error } = await supabase
        .from('routines')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      setRoutines(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
      return true;
    } catch (error) {
      console.error('Error updating routine:', error);
      return false;
    }
  };

  const toggleFavorite = async (id: string) => {
    const routine = routines.find(r => r.id === id);
    if (!routine) return;

    const newValue = !routine.is_favorite;
    await updateRoutine(id, { is_favorite: newValue });
  };

  const deleteRoutine = async (id: string) => {
    try {
      // First delete routine exercises
      await supabase
        .from('routine_exercises')
        .delete()
        .eq('routine_id', id);

      const { error } = await supabase
        .from('routines')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setRoutines(prev => prev.filter(r => r.id !== id));
      toast({ title: 'Rutin borttagen' });
      return true;
    } catch (error) {
      console.error('Error deleting routine:', error);
      toast({ title: 'Kunde inte ta bort rutin', variant: 'destructive' });
      return false;
    }
  };

  const updateLastUsed = async (id: string) => {
    await updateRoutine(id, { last_used_at: new Date().toISOString() });
  };

  const getFolders = () => {
    const folders = new Set<string>();
    routines.forEach(r => {
      if (r.folder) folders.add(r.folder);
    });
    return Array.from(folders).sort();
  };

  const getRoutinesByFolder = () => {
    const favorites = routines.filter(r => r.is_favorite);
    const folders = getFolders();
    const byFolder: Record<string, Routine[]> = {};
    
    folders.forEach(folder => {
      byFolder[folder] = routines.filter(r => r.folder === folder && !r.is_favorite);
    });
    
    const noFolder = routines.filter(r => !r.folder && !r.is_favorite);
    
    return { favorites, byFolder, noFolder };
  };

  return {
    routines,
    isLoading,
    createRoutine,
    updateRoutine,
    toggleFavorite,
    deleteRoutine,
    updateLastUsed,
    getFolders,
    getRoutinesByFolder,
    refetch: fetchRoutines,
  };
}
