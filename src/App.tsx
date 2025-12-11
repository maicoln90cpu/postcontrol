import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { RequireAuth } from "@/components/RequireAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getSystemTimezone } from "@/lib/dateUtils";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";

// Lazy load pages for code splitting - reduces initial bundle size
const Home = lazy(() => import("./pages/Home"));
const Submit = lazy(() => import("./pages/Submit"));
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MasterAdmin = lazy(() => import("./pages/MasterAdmin"));
const AgencySignup = lazy(() => import("./pages/AgencySignup"));
const AgencySignupBySlug = lazy(() => import("./pages/AgencySignupBySlug"));
const PublicEvent = lazy(() => import("./pages/PublicEvent"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite").then(m => ({ default: m.AcceptInvite })));
const GuestDashboard = lazy(() => import("./pages/GuestDashboard").then(m => ({ default: m.GuestDashboard })));
const Install = lazy(() => import("./pages/Install"));
const PushDiagnostic = lazy(() => import("./pages/PushDiagnostic"));
const NotFound = lazy(() => import("./pages/NotFound"));
const GuestListRegister = lazy(() => import("./pages/GuestListRegister"));
const GuestListConfirmation = lazy(() => import("./pages/GuestListConfirmation"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// QueryClient removido - usando instância única de main.tsx

const App = () => {
  useAuth(); // Inicializa o listener de autenticação
  
  // Inicializa cache do timezone do sistema
  useEffect(() => {
    getSystemTimezone();
  }, []);
  
  return (
    <ThemeProvider defaultTheme="system" storageKey="app-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PWAInstallPrompt />
          <PWAUpdatePrompt />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/agency/:token" element={<AgencySignup />} />
              <Route path="/agencia/:slug" element={<AgencySignupBySlug />} />
              <Route path="/agencia/:agencySlug/evento/:eventSlug" element={<PublicEvent />} />
              <Route path="/accept-invite" element={<AcceptInvite />} />
              <Route path="/install" element={<Install />} />
              <Route path="/push-diagnostic" element={<PushDiagnostic />} />
              
              {/* Guest List Public Routes */}
              <Route path="/:agencySlug/lista/:eventSlug" element={<GuestListRegister />} />
              <Route path="/:agencySlug/lista/:eventSlug/confirmacao/:id" element={<GuestListConfirmation />} />
              
              {/* Protected Routes - Require Authentication */}
              <Route path="/submit" element={
                <RequireAuth>
                  <Submit />
                </RequireAuth>
              } />
              
              <Route path="/dashboard" element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              } />

              <Route path="/guest-dashboard" element={
                <RequireAuth>
                  <GuestDashboard />
                </RequireAuth>
              } />
              
              {/* Agency Admin Routes */}
              <Route path="/admin" element={
                <RequireAuth>
                  <ProtectedRoute requireAgencyAdmin>
                    <Admin />
                  </ProtectedRoute>
                </RequireAuth>
              } />
              
              {/* Master Admin Routes */}
              <Route path="/master-admin" element={
                <RequireAuth>
                  <ProtectedRoute requireMasterAdmin>
                    <MasterAdmin />
                  </ProtectedRoute>
                </RequireAuth>
              } />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  );
};

export default App;
