import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Dumbbell, TrendingUp, Calendar, Timer, Target } from 'lucide-react';
import { useStats } from '@/hooks/useStats';

export function StatsOverview() {
  const { overviewStats, isLoading } = useStats();

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
      return `${(kg / 1000).toFixed(1)} ton`;
    }
    return `${Math.round(kg)} kg`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Min träningsresa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      icon: Dumbbell,
      label: 'Totalt pass',
      value: overviewStats.totalWorkouts,
      color: 'text-primary'
    },
    {
      icon: Timer,
      label: 'Total tid',
      value: formatDuration(overviewStats.totalDuration),
      color: 'text-blue-500'
    },
    {
      icon: TrendingUp,
      label: 'Total volym',
      value: formatVolume(overviewStats.totalVolume),
      color: 'text-green-500'
    },
    {
      icon: Target,
      label: 'Totalt sets',
      value: overviewStats.totalSets,
      color: 'text-orange-500'
    },
    {
      icon: Timer,
      label: 'Snitt/pass',
      value: formatDuration(overviewStats.avgDuration),
      color: 'text-purple-500'
    },
    {
      icon: Calendar,
      label: 'Pass/vecka',
      value: overviewStats.avgWorkoutsPerWeek.toFixed(1),
      color: 'text-pink-500'
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Min träningsresa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div 
              key={stat.label}
              className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/50 border border-border"
            >
              <stat.icon className={`h-5 w-5 ${stat.color} mb-1`} />
              <span className="text-xl font-bold text-foreground">{stat.value}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
