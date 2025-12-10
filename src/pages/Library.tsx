import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BottomNav } from '@/components/layout/BottomNav';
import { ExerciseLibrary } from '@/components/library/ExerciseLibrary';
import { RoutineLibrary } from '@/components/library/RoutineLibrary';

export default function Library() {
  const [activeTab, setActiveTab] = useState('exercises');

  return (
    <>
      <Helmet>
        <title>Bibliotek - GymTracker</title>
        <meta name="description" content="Övnings- och rutinbibliotek" />
      </Helmet>

      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="px-4 py-4">
            <h1 className="text-2xl font-bold">Bibliotek</h1>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full h-12 rounded-none bg-transparent border-b border-border p-0">
              <TabsTrigger 
                value="exercises" 
                className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                Övningar
              </TabsTrigger>
              <TabsTrigger 
                value="routines"
                className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                Rutiner
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </header>

        <main className="px-4 py-4">
          {activeTab === 'exercises' && <ExerciseLibrary />}
          {activeTab === 'routines' && <RoutineLibrary />}
        </main>

        <BottomNav />
      </div>
    </>
  );
}
