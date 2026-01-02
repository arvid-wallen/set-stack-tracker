import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Dumbbell, Clock, Weight, Calendar, Activity, Target, ChevronRight } from 'lucide-react';
import { BottomNav } from '@/components/layout/BottomNav';
import { StatCard } from '@/components/stats/StatCard';
import { VolumeChart } from '@/components/stats/VolumeChart';
import { WorkoutsChart } from '@/components/stats/WorkoutsChart';
import { MuscleGroupChart } from '@/components/stats/MuscleGroupChart';
import { useStats } from '@/hooks/useStats';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

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
      <div className="min-h-screen bg-background pb-32">
        <div className="px-5 py-6 space-y-6">
          <Skeleton className="h-8 w-32" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-[250px] rounded-2xl" />
          <Skeleton className="h-[250px] rounded-2xl" />
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

      <div className="min-h-screen bg-background pb-32">
        <header className="ios-nav-bar sticky top-0 z-10">
          <div className="px-5 py-4 text-center">
            <h1 className="text-lg font-semibold">Statistik</h1>
            <p className="text-xs text-muted-foreground">Din träningsöversikt</p>
          </div>
        </header>

        <div className="px-5 py-6 space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
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

          {/* Exercise Stats Link */}
          <Link to="/stats/exercise">
            <Card className="rounded-2xl shadow-ios bg-card/80 hover:bg-card transition-colors active:scale-[0.98]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-ios-md bg-primary/10">
                      <Dumbbell className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Övningsstatistik</p>
                      <p className="text-xs text-muted-foreground">
                        Progression, PRs & målsättningar per övning
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>

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
