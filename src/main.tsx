import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";

// Force dark mode
if (typeof document !== 'undefined') {
  document.documentElement.classList.add('dark');
}

// "Install app" (PWA): keep Chrome's install prompt so the Dashboard can show its own button.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    (window as any).__amrInstallPrompt = e;
    window.dispatchEvent(new Event('amr-install-ready'));
  });
  window.addEventListener('appinstalled', () => { (window as any).__amrInstallPrompt = null; window.dispatchEvent(new Event('amr-install-ready')); });
}

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);