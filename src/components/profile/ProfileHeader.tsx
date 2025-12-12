import { useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

interface ProfileHeaderProps {
  firstName: string;
  lastName?: string | null;
  avatarUrl?: string | null;
  memberSince: string;
  email?: string;
  isSaving: boolean;
  onAvatarChange: (file: File) => void;
}

export function ProfileHeader({
  firstName,
  lastName,
  avatarUrl,
  memberSince,
  email,
  isSaving,
  onAvatarChange
}: ProfileHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAvatarChange(file);
    }
  };

  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Användare';

  return (
    <div className="flex flex-col items-center gap-4 pb-6 border-b border-border">
      <div className="relative">
        <Avatar className="h-24 w-24 border-4 border-primary/20">
          <AvatarImage src={avatarUrl || undefined} alt={fullName} />
          <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <Button
          size="icon"
          variant="secondary"
          className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-lg"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">{fullName}</h1>
        {email && (
          <p className="text-sm text-muted-foreground">{email}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Medlem sedan {format(new Date(memberSince), 'MMMM yyyy', { locale: sv })}
        </p>
      </div>
    </div>
  );
}
