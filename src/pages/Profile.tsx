import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useWorkoutHistory } from '@/hooks/useWorkoutHistory';
import { BottomNav } from '@/components/layout/BottomNav';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { PersonalInfoSection } from '@/components/profile/PersonalInfoSection';
import { AccountSection } from '@/components/profile/AccountSection';
import { StatsOverview } from '@/components/profile/StatsOverview';
import { ProgressPhotos } from '@/components/profile/ProgressPhotos';
import { SettingsSection } from '@/components/profile/SettingsSection';
import { PTProfileSettings } from '@/components/profile/PTProfileSettings';
import { Skeleton } from '@/components/ui/skeleton';
import { exportToCSV } from '@/lib/export-utils';

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading, isSaving, updateProfile, uploadAvatar } = useProfile(user?.id);
  const { workouts } = useWorkoutHistory();

  // Redirect to auth if not logged in (using useEffect to avoid render-phase navigation)
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleExportData = () => {
    if (workouts.length === 0) return;
    exportToCSV(workouts, `träningsdata-${new Date().toISOString().split('T')[0]}.csv`);
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <div className="container max-w-lg mx-auto px-5 py-6 space-y-8">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Min profil | Gym Tracker</title>
        <meta name="description" content="Hantera din profil, se din träningsstatistik och anpassa dina inställningar." />
      </Helmet>
      
      <div className="min-h-screen bg-background pb-32">
        <div className="container max-w-lg mx-auto px-5 py-6 space-y-8">
          <ProfileHeader
            firstName={profile.first_name}
            lastName={profile.last_name}
            avatarUrl={profile.avatar_url}
            memberSince={profile.created_at}
            email={user.email}
            isSaving={isSaving}
            onAvatarChange={uploadAvatar}
          />

          <StatsOverview />

          <PersonalInfoSection
            firstName={profile.first_name}
            lastName={profile.last_name}
            isSaving={isSaving}
            onSave={updateProfile}
          />

          <ProgressPhotos userId={user.id} />

          <PTProfileSettings />

          <SettingsSection onExportData={handleExportData} />

          <AccountSection 
            email={user.email || ''} 
            onSignOut={handleSignOut} 
          />
        </div>
        <BottomNav />
      </div>
    </>
  );
}
