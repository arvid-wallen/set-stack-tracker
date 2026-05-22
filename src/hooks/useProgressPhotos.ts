import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProgressPhoto {
  id: string;
  user_id: string;
  photo_url: string;
  taken_at: string;
  notes: string | null;
  created_at: string;
}

async function fetchProgressPhotos(userId: string): Promise<ProgressPhoto[]> {
  const { data, error } = await supabase
    .from('progress_photos')
    .select('*')
    .eq('user_id', userId)
    .order('taken_at', { ascending: false });

  if (error || !data) return [];

  // Generate signed URLs in parallel
  const photosWithUrls = await Promise.all(
    data.map(async (photo) => {
      const { data: signedData } = await supabase.storage
        .from('progress-photos')
        .createSignedUrl(photo.photo_url, 3600);
      return {
        ...photo,
        photo_url: signedData?.signedUrl || photo.photo_url,
      };
    }),
  );
  return photosWithUrls;
}

export function useProgressPhotos(userId: string | undefined) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['progress-photos', userId],
    enabled: !!userId,
    // Signed URLs live for 1h — refetch a bit before that, but keep cache fresh between navigations.
    staleTime: 5 * 60_000,
    queryFn: () => fetchProgressPhotos(userId!),
  });

  const uploadPhoto = async (file: File, takenAt: Date, notes?: string) => {
    if (!userId) return null;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data, error: insertError } = await supabase
        .from('progress_photos')
        .insert({
          user_id: userId,
          photo_url: filePath,
          taken_at: takenAt.toISOString().split('T')[0],
          notes: notes || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const { data: signedData } = await supabase.storage
        .from('progress-photos')
        .createSignedUrl(filePath, 3600);

      const newPhoto: ProgressPhoto = {
        ...(data as any),
        photo_url: signedData?.signedUrl || filePath,
      };

      queryClient.setQueryData<ProgressPhoto[]>(['progress-photos', userId], (prev) =>
        prev ? [newPhoto, ...prev] : [newPhoto],
      );
      toast({ title: 'Progressbild uppladdad!' });
      return newPhoto;
    } catch (error: any) {
      toast({
        title: 'Kunde inte ladda upp bild',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deletePhoto = async (photoId: string, photoPath: string) => {
    try {
      const path = photoPath.includes('progress-photos/')
        ? photoPath.split('progress-photos/')[1]?.split('?')[0]
        : photoPath;

      if (path) {
        await supabase.storage.from('progress-photos').remove([path]);
      }

      const { error } = await supabase
        .from('progress_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      queryClient.setQueryData<ProgressPhoto[]>(['progress-photos', userId], (prev) =>
        prev ? prev.filter((p) => p.id !== photoId) : prev,
      );
      toast({ title: 'Bild raderad' });
      return true;
    } catch (error: any) {
      toast({
        title: 'Kunde inte radera bild',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    photos,
    isLoading,
    isUploading,
    uploadPhoto,
    deletePhoto,
  };
}
