import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GoalComposition {
  strength?: number;
  cardio?: number;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  weekly_goal: number;
  monthly_goal: number;
  goal_composition: GoalComposition;
  created_at: string;
  updated_at: string;
}

async function fetchOrCreateProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  if (data) return data as unknown as Profile;

  // Profile doesn't exist yet — create a basic one
  const { data: userData } = await supabase.auth.getUser();
  const firstName = userData?.user?.user_metadata?.first_name || 'Användare';

  const { data: newProfile, error: createError } = await supabase
    .from('profiles')
    .insert({ id: userId, first_name: firstName })
    .select()
    .single();

  if (createError || !newProfile) return null;
  return newProfile as unknown as Profile;
}

export function useProfile(userId: string | undefined) {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', userId],
    enabled: !!userId,
    staleTime: 5 * 60_000,
    queryFn: () => fetchOrCreateProfile(userId!),
  });

  const updateProfile = async (
    updates: Partial<Pick<Profile, 'first_name' | 'last_name' | 'avatar_url' | 'weekly_goal' | 'monthly_goal' | 'goal_composition'>>,
  ) => {
    if (!userId) return false;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates as any)
        .eq('id', userId);

      if (error) throw error;

      queryClient.setQueryData<Profile | null>(['profile', userId], (prev) =>
        prev ? { ...prev, ...updates } : prev,
      );
      toast({ title: 'Profil uppdaterad!' });
      return true;
    } catch (error: any) {
      toast({
        title: 'Kunde inte uppdatera profil',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!userId) return null;

    setIsSaving(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

      await updateProfile({ avatar_url: urlWithCacheBuster });
      return urlWithCacheBuster;
    } catch (error: any) {
      toast({
        title: 'Kunde inte ladda upp bild',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    profile: profile ?? null,
    isLoading,
    isSaving,
    updateProfile,
    uploadAvatar,
  };
}
