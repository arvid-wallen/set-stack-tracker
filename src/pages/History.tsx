import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/layout/BottomNav';
import { HistoryFilters } from '@/components/history/HistoryFilters';
import { WorkoutCalendar } from '@/components/history/WorkoutCalendar';
import { WorkoutHistoryList } from '@/components/history/WorkoutHistoryList';
import { WorkoutDetailSheet } from '@/components/history/WorkoutDetailSheet';
import { ImportWorkoutSheet } from '@/components/import/ImportWorkoutSheet';
import { ExportButton } from '@/components/export/ExportButton';
import { useWorkoutHistory, WorkoutWithDetails } from '@/hooks/useWorkoutHistory';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, List, Sparkles } from 'lucide-react';

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
  const [importOpen, setImportOpen] = useState(false);

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

      <div className="min-h-screen bg-background pb-32">
        <header className="ios-nav-bar sticky top-0 z-30">
          <div className="px-5 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold">Historik</h1>
              <div className="flex items-center gap-2">
                <ExportButton workouts={workouts} disabled={isLoading} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImportOpen(true)}
                  className="gap-2 rounded-ios-md"
                >
                  <Sparkles className="h-4 w-4" />
                  AI Import
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="px-5 py-4 space-y-4">
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
                <Skeleton className="h-[300px] rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
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

        <ImportWorkoutSheet
          open={importOpen}
          onOpenChange={setImportOpen}
        />

        <BottomNav />
      </div>
    </>
  );
}
