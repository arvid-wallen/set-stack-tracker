import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BottomNav } from '@/components/layout/BottomNav';
import { HistoryFilters } from '@/components/history/HistoryFilters';
import { WorkoutCalendar } from '@/components/history/WorkoutCalendar';
import { WorkoutHistoryList } from '@/components/history/WorkoutHistoryList';
import { WorkoutDetailSheet } from '@/components/history/WorkoutDetailSheet';
import { useWorkoutHistory, WorkoutWithDetails } from '@/hooks/useWorkoutHistory';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, List } from 'lucide-react';

export default function History() {
  const { 
    workouts, 
    workoutsByDate, 
    workoutDates, 
    isLoading, 
    filters, 
    setFilters, 
    clearFilters 
  } = useWorkoutHistory();

  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutWithDetails | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleWorkoutSelect = (workout: WorkoutWithDetails) => {
    setSelectedWorkout(workout);
    setDetailOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>Historik | GymTracker</title>
        <meta name="description" content="Se din träningshistorik och tidigare pass" />
      </Helmet>

      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 pt-6 pb-4">
          <h1 className="text-2xl font-bold mb-4">Historik</h1>

          <Tabs defaultValue="calendar" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Kalender
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Lista
              </TabsTrigger>
            </TabsList>

            {/* Filters */}
            <div className="mb-4">
              <HistoryFilters 
                filters={filters}
                onFiltersChange={setFilters}
                onClear={clearFilters}
              />
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-[300px] rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
              </div>
            ) : (
              <>
                <TabsContent value="calendar" className="mt-0">
                  <WorkoutCalendar
                    workoutDates={workoutDates}
                    workoutsByDate={workoutsByDate}
                    onWorkoutSelect={handleWorkoutSelect}
                  />
                </TabsContent>

                <TabsContent value="list" className="mt-0">
                  <WorkoutHistoryList
                    workouts={workouts}
                    onWorkoutSelect={handleWorkoutSelect}
                  />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>

        <WorkoutDetailSheet
          workout={selectedWorkout}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />

        <BottomNav />
      </div>
    </>
  );
}
