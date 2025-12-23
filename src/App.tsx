import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import Library from "./pages/Library";
import History from "./pages/History";
import Stats from "./pages/Stats";
import ExerciseStats from "./pages/ExerciseStats";
import Profile from "./pages/Profile";
import { AuthForm } from "./components/auth/AuthForm";
import NotFound from "./pages/NotFound";
import { WorkoutProvider } from "@/hooks/useWorkout";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <WorkoutProvider>
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
            </WorkoutProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;