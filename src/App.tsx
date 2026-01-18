import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Index from "./pages/Index";
import Library from "./pages/Library";
import History from "./pages/History";
import Stats from "./pages/Stats";
import ExerciseStats from "./pages/ExerciseStats";
import Profile from "./pages/Profile";
import { AuthForm } from "./components/auth/AuthForm";
import NotFound from "./pages/NotFound";

import { ActiveWorkout } from "@/components/workout/ActiveWorkout";
import { WorkoutMiniBar } from "@/components/workout/WorkoutMiniBar";
import { PTChatFAB } from "@/components/pt/PTChatFAB";

// Query client instance
const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthForm />} />
                <Route path="/library" element={<Library />} />
                <Route path="/calendar" element={<History />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/stats/exercise" element={<ExerciseStats />} />
                <Route path="/profile" element={<Profile />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              {/* Global workout overlays */}
              <ActiveWorkout />
              <WorkoutMiniBar />
              <PTChatFAB />
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;