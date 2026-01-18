import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface PTProfile {
  id: string;
  user_id: string;
  age: number | null;
  gender: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  goals: string[];
  experience_level: string | null;
  training_years: number | null;
  injuries: string | null;
  health_conditions: string | null;
  available_equipment: string[];
  preferred_workout_duration: number | null;
  training_days_per_week: number | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface PTProfileInput {
  age?: number | null;
  gender?: string | null;
  weight_kg?: number | null;
  height_cm?: number | null;
  goals?: string[];
  experience_level?: string | null;
  training_years?: number | null;
  injuries?: string | null;
  health_conditions?: string | null;
  available_equipment?: string[];
  preferred_workout_duration?: number | null;
  training_days_per_week?: number | null;
  onboarding_completed?: boolean;
}

export function usePTProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ptProfile, setPtProfile] = useState<PTProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const fetchPTProfile = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('pt_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPtProfile(data as PTProfile);
        setNeedsOnboarding(!data.onboarding_completed);
      } else {
        setPtProfile(null);
        setNeedsOnboarding(true);
      }
    } catch (error) {
      console.error('Error fetching PT profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPTProfile();
  }, [fetchPTProfile]);

  const savePTProfile = useCallback(async (data: PTProfileInput) => {
    if (!user) return null;

    try {
      const profileData = {
        user_id: user.id,
        ...data,
        onboarding_completed: true,
      };

      const { data: result, error } = await supabase
        .from('pt_profiles')
        .upsert(profileData, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;

      setPtProfile(result as PTProfile);
      setNeedsOnboarding(false);

      toast({
        title: 'Profil sparad! 🎉',
        description: 'Din PT känner dig nu bättre',
      });

      return result;
    } catch (error) {
      console.error('Error saving PT profile:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte spara profilen',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, toast]);

  const updatePTProfile = useCallback(async (updates: PTProfileInput) => {
    if (!user || !ptProfile) return null;

    try {
      const { data, error } = await supabase
        .from('pt_profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setPtProfile(data as PTProfile);

      toast({
        title: 'Uppdaterat!',
        description: 'Dina PT-inställningar har sparats',
      });

      return data;
    } catch (error) {
      console.error('Error updating PT profile:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte uppdatera profilen',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, ptProfile, toast]);

  return {
    ptProfile,
    isLoading,
    needsOnboarding,
    savePTProfile,
    updatePTProfile,
    refetch: fetchPTProfile,
  };
}
