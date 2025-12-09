import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Exercise, MuscleGroup, EquipmentType } from '@/types/workout';

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');

      if (error) throw error;
      setExercises(data as unknown as Exercise[]);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchExercises = (query: string, filters?: {
    muscleGroup?: MuscleGroup;
    equipmentType?: EquipmentType;
    isCardio?: boolean;
  }) => {
    let filtered = exercises;

    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(e => 
        e.name.toLowerCase().includes(lowerQuery) ||
        e.description?.toLowerCase().includes(lowerQuery)
      );
    }

    if (filters?.muscleGroup) {
      filtered = filtered.filter(e => 
        e.muscle_groups.includes(filters.muscleGroup!)
      );
    }

    if (filters?.equipmentType) {
      filtered = filtered.filter(e => 
        e.equipment_type === filters.equipmentType
      );
    }

    if (filters?.isCardio !== undefined) {
      filtered = filtered.filter(e => e.is_cardio === filters.isCardio);
    }

    return filtered;
  };

  const createCustomExercise = async (exercise: Partial<Exercise>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('exercises')
        .insert({
          name: exercise.name!,
          description: exercise.description,
          muscle_groups: exercise.muscle_groups || [],
          equipment_type: exercise.equipment_type || 'bodyweight',
          is_custom: true,
          is_cardio: exercise.is_cardio || false,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setExercises(prev => [...prev, data as unknown as Exercise]);
      return data;
    } catch (error) {
      console.error('Error creating exercise:', error);
      return null;
    }
  };

  return {
    exercises,
    isLoading,
    searchExercises,
    createCustomExercise,
    refetch: fetchExercises,
  };
}