import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { WorkoutProvider } from "@/hooks/useWorkout";

// Register service worker for PWA offline support
// Skip in Lovable preview/iframe environments — otherwise old code gets cached
// and prevents new versions from showing up during development.
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();
const isPreviewHost = /lovable\.app|lovableproject\.com|localhost/i.test(window.location.hostname);

if ('serviceWorker' in navigator) {
  if (isInIframe || isPreviewHost) {
    // Unregister any existing SW + clear caches so preview always shows latest build
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    });
    if ('caches' in window) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
    }
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration.scope);
        })
        .catch((error) => {
          console.log('SW registration failed:', error);
        });
    });
  }
}

createRoot(document.getElementById("root")!).render(
  <WorkoutProvider>
    <App />
  </WorkoutProvider>
);
