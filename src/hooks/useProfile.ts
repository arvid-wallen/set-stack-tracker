import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        setIsLoading(false);
        return;
      }

      if (data) {
        setProfile(data);
      } else {
        // Profile doesn't exist yet - create a basic one
        const { data: userData } = await supabase.auth.getUser();
        const firstName = userData?.user?.user_metadata?.first_name || 'Användare';
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            first_name: firstName,
          })
          .select()
          .single();
        
        if (!createError && newProfile) {
          setProfile(newProfile);
        }
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, [userId]);

  const updateProfile = async (updates: Partial<Pick<Profile, 'first_name' | 'last_name' | 'avatar_url'>>) => {
    if (!userId) return false;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      toast({ title: 'Profil uppdaterad!' });
      return true;
    } catch (error: any) {
      toast({ 
        title: 'Kunde inte uppdatera profil', 
        description: error.message,
        variant: 'destructive' 
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

      // Add cache buster
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;
      
      await updateProfile({ avatar_url: urlWithCacheBuster });
      return urlWithCacheBuster;
    } catch (error: any) {
      toast({ 
        title: 'Kunde inte ladda upp bild', 
        description: error.message,
        variant: 'destructive' 
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    profile,
    isLoading,
    isSaving,
    updateProfile,
    uploadAvatar,
  };
}
