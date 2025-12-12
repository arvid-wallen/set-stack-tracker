import { Helmet } from 'react-helmet-async';
import { Dumbbell, Clock, Weight, Calendar, Activity, Target } from 'lucide-react';
import { BottomNav } from '@/components/layout/BottomNav';
import { StatCard } from '@/components/stats/StatCard';
import { VolumeChart } from '@/components/stats/VolumeChart';
import { WorkoutsChart } from '@/components/stats/WorkoutsChart';
import { MuscleGroupChart } from '@/components/stats/MuscleGroupChart';
import { useStats } from '@/hooks/useStats';
import { Skeleton } from '@/components/ui/skeleton';

export default function Stats() {
  const { overviewStats, weeklyData, muscleGroupData, trends, isLoading } = useStats();

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatVolume = (kg: number) => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(1)}t`;
    }
    return `${kg.toFixed(0)}kg`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="px-4 py-6 space-y-6">
          <Skeleton className="h-8 w-32" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-[250px]" />
          <Skeleton className="h-[250px]" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Statistik - Gymloggen</title>
        <meta name="description" content="Se din träningsstatistik och framsteg" />
      </Helmet>

      <div className="min-h-screen bg-background pb-20">
        <div className="px-4 py-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Statistik</h1>
            <p className="text-sm text-muted-foreground">Din träningsöversikt</p>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={Calendar}
              label="Totalt pass"
              value={overviewStats.totalWorkouts}
              trend={trends.workouts}
              subtitle="denna vecka"
            />
            <StatCard
              icon={Clock}
              label="Total tid"
              value={formatDuration(overviewStats.totalDuration)}
              trend={trends.duration}
            />
            <StatCard
              icon={Weight}
              label="Total volym"
              value={formatVolume(overviewStats.totalVolume)}
              trend={trends.tonnage}
            />
            <StatCard
              icon={Activity}
              label="Snitt/vecka"
              value={overviewStats.avgWorkoutsPerWeek.toFixed(1)}
              subtitle="pass"
            />
          </div>

          {/* Additional Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={Dumbbell}
              label="Totalt set"
              value={overviewStats.totalSets}
            />
            <StatCard
              icon={Target}
              label="Snitt passlängd"
              value={formatDuration(overviewStats.avgDuration)}
            />
          </div>

          {/* Charts */}
          <VolumeChart data={weeklyData} />
          <WorkoutsChart data={weeklyData} />
          <MuscleGroupChart data={muscleGroupData} />
        </div>

        <BottomNav />
      </div>
    </>
  );
}
