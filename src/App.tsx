
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { useDataSync } from "@/hooks/useDataSync";
import { useCoordinationSync } from "@/hooks/useCoordinationSync";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import CoordinatorDashboard from "./pages/CoordinatorDashboard";
import ResidentDashboard from "./pages/ResidentDashboard";
import CityViewerDashboard from "./pages/CityViewerDashboard";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import LGPDPolicy from "./pages/LGPDPolicy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

// Componente para inicializar sincronização
function SyncProvider({ children }: { children: React.ReactNode }) {
  useDataSync();
  useCoordinationSync();
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SyncProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/super-admin" element={<SuperAdminDashboard />} />
              <Route path="/coordinator" element={<CoordinatorDashboard />} />
              <Route path="/resident" element={<ResidentDashboard />} />
              <Route path="/city-viewer" element={<CityViewerDashboard />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/lgpd-policy" element={<LGPDPolicy />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SyncProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
