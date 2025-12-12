import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Camera, Plus, Trash2, Loader2, X, ZoomIn } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useProgressPhotos } from '@/hooks/useProgressPhotos';

interface ProgressPhotosProps {
  userId: string | undefined;
}

export function ProgressPhotos({ userId }: ProgressPhotosProps) {
  const { photos, isLoading, isUploading, uploadPhoto, deletePhoto } = useProgressPhotos(userId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [takenAt, setTakenAt] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    await uploadPhoto(selectedFile, new Date(takenAt), notes);
    
    // Reset form
    setSelectedFile(null);
    setPreviewUrl(null);
    setTakenAt(new Date().toISOString().split('T')[0]);
    setNotes('');
    setIsDialogOpen(false);
  };

  const handleDelete = async (photoId: string, photoUrl: string) => {
    await deletePhoto(photoId, photoUrl);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Progressbilder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Progressbilder
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary">
                <Plus className="h-4 w-4 mr-1" />
                Lägg till
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ladda upp progressbild</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {previewUrl ? (
                  <div className="relative">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Klicka för att välja bild
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                
                <div className="space-y-2">
                  <Label htmlFor="takenAt">Datum</Label>
                  <Input
                    id="takenAt"
                    type="date"
                    value={takenAt}
                    onChange={(e) => setTakenAt(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Anteckningar (valfritt)</Label>
                  <Textarea
                    id="notes"
                    placeholder="T.ex. vikt, mått, känsla..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
                
                <Button 
                  onClick={handleUpload} 
                  disabled={!selectedFile || isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Laddar upp...
                    </>
                  ) : (
                    'Ladda upp'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {photos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Inga progressbilder än</p>
            <p className="text-xs">Ladda upp din första bild för att följa din resa!</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <div 
                key={photo.id} 
                className="relative group aspect-square rounded-lg overflow-hidden bg-muted"
              >
                <img 
                  src={photo.photo_url} 
                  alt={`Progress ${photo.taken_at}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={() => setViewingPhoto(photo.photo_url)}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Radera bild?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bilden kommer att raderas permanent.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(photo.id, photo.photo_url)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Radera
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-xs text-white">
                    {format(new Date(photo.taken_at), 'd MMM yyyy', { locale: sv })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Fullscreen view */}
        {viewingPhoto && (
          <Dialog open={!!viewingPhoto} onOpenChange={() => setViewingPhoto(null)}>
            <DialogContent className="max-w-3xl p-0 overflow-hidden">
              <img 
                src={viewingPhoto} 
                alt="Progress" 
                className="w-full h-auto"
              />
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
