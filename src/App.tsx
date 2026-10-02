import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route } from "react-router-dom";
import { AnimatedRoutes } from "./components/motion/AnimatedRoutes";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Index from "./pages/Index";
import Library from "./pages/Library";
import History from "./pages/History";
import Planning from "./pages/Planning";
import Stats from "./pages/Stats";
import ExerciseStats from "./pages/ExerciseStats";
import Profile from "./pages/Profile";
import { AuthForm } from "./components/auth/AuthForm";
import OAuthConsent from "./pages/OAuthConsent";
import NotFound from "./pages/NotFound";

import { ActiveWorkout } from "@/components/workout/ActiveWorkout";
import { WorkoutMiniBar } from "@/components/workout/WorkoutMiniBar";
import { PTChatFAB } from "@/components/pt/PTChatFAB";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";

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
              <AnimatedRoutes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthForm />} />
                <Route path="/library" element={<Library />} />
                <Route path="/calendar" element={<History />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/stats/exercise" element={<ExerciseStats />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
                <Route path="/planning" element={<Planning />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </AnimatedRoutes>
              {/* Global workout overlays */}
              <ActiveWorkout />
              <WorkoutMiniBar />
              <PTChatFAB />
              <OnboardingGate />
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;