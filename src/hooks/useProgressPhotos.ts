import { useState, useEffect } from 'react';
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

export function useProgressPhotos(userId: string | undefined) {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchPhotos = async () => {
      const { data, error } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('user_id', userId)
        .order('taken_at', { ascending: false });

      if (!error && data) {
        // Generate signed URLs for each photo
        const photosWithUrls = await Promise.all(
          data.map(async (photo) => {
            const { data: signedData } = await supabase.storage
              .from('progress-photos')
              .createSignedUrl(photo.photo_url, 3600); // 1 hour
            
            return {
              ...photo,
              photo_url: signedData?.signedUrl || photo.photo_url
            };
          })
        );
        setPhotos(photosWithUrls);
      }
      setIsLoading(false);
    };

    fetchPhotos();
  }, [userId]);

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
          notes: notes || null
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Get signed URL for the new photo
      const { data: signedData } = await supabase.storage
        .from('progress-photos')
        .createSignedUrl(filePath, 3600);

      const newPhoto = {
        ...data,
        photo_url: signedData?.signedUrl || filePath
      };

      setPhotos(prev => [newPhoto, ...prev]);
      toast({ title: 'Progressbild uppladdad!' });
      return newPhoto;
    } catch (error: any) {
      toast({ 
        title: 'Kunde inte ladda upp bild', 
        description: error.message,
        variant: 'destructive' 
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deletePhoto = async (photoId: string, photoPath: string) => {
    try {
      // Extract just the path part if it's a signed URL
      const path = photoPath.includes('progress-photos/') 
        ? photoPath.split('progress-photos/')[1]?.split('?')[0] 
        : photoPath;

      if (path) {
        await supabase.storage
          .from('progress-photos')
          .remove([path]);
      }

      const { error } = await supabase
        .from('progress_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      setPhotos(prev => prev.filter(p => p.id !== photoId));
      toast({ title: 'Bild raderad' });
      return true;
    } catch (error: any) {
      toast({ 
        title: 'Kunde inte radera bild', 
        description: error.message,
        variant: 'destructive' 
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
