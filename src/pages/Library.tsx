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

      <div className="min-h-screen bg-background pb-28">
        <header className="ios-nav-bar sticky top-0 z-30">
          <div className="px-5 py-4 text-center">
            <h1 className="text-lg font-semibold">Bibliotek</h1>
          </div>
          
          <div className="px-5 pb-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="exercises">
                  Övningar
                </TabsTrigger>
                <TabsTrigger value="routines">
                  Rutiner
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </header>

        <main className="px-5 py-4 space-y-4">
          {activeTab === 'exercises' && <ExerciseLibrary />}
          {activeTab === 'routines' && <RoutineLibrary />}
        </main>

        <BottomNav />
      </div>
    </>
  );
}
