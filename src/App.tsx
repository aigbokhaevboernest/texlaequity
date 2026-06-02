import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SkeletonBlock } from "@/components/ui/SkeletonBlock";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import Inventory from "./pages/Inventory.tsx";
import FaqPage from "./pages/Faq.tsx";
import Terms from "./pages/Terms.tsx";
import Policies from "./pages/Policies.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import Deposit from "./pages/dashboard/Deposit";
import Withdraw from "./pages/dashboard/Withdraw";
import Transactions from "./pages/dashboard/Transactions";
import CopyExperts from "./pages/dashboard/CopyExperts";
import Plans from "./pages/dashboard/Plans";
import Kyc from "./pages/dashboard/Kyc";
import Cars from "./pages/dashboard/Cars";
import DashSettings from "./pages/dashboard/Settings";
import { AuthProvider } from "./hooks/useAuth";
import ConnectWallet from "./pages/dashboard/ConnectWallet";
import Forbidden from "./pages/Forbidden";
import ErrorBoundary from "./components/ErrorBoundary";
import TransitionOverlay from "./components/TransitionOverlay";

const queryClient = new QueryClient();
const isFirstLoad = typeof window !== "undefined" && !sessionStorage.getItem("tesla_app_opened");
if (typeof window !== "undefined") sessionStorage.setItem("tesla_app_opened", "1");

function RouteTransitionShell() {
  const location = useLocation();
  const [showRouteSkeleton, setShowRouteSkeleton] = useState(false);
  const authTransition = useMemo(
    () => ["/login", "/signup"].includes(location.pathname),
    [location.pathname],
  );

  useEffect(() => {
    setShowRouteSkeleton(true);
    const timer = window.setTimeout(() => setShowRouteSkeleton(false), 240);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      {authTransition && !isFirstLoad && <TransitionOverlay duration={2600} />}
      {showRouteSkeleton && !authTransition && (
        <div className="fixed inset-0 z-[70] bg-background/96 backdrop-blur-sm pointer-events-none">
          <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col gap-6 px-4 py-6 lg:px-8">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <SkeletonBlock className="h-7 w-28 rounded-md" />
              <div className="flex items-center gap-3">
                <SkeletonBlock className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <SkeletonBlock className="h-3 w-24" />
                  <SkeletonBlock className="h-3 w-16" />
                </div>
              </div>
            </div>
            <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[220px_1fr]">
              <div className="hidden rounded-2xl border border-border bg-card/70 p-3 lg:block">
                <div className="space-y-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonBlock key={i} className="h-10 w-full rounded-lg" />
                  ))}
                </div>
              </div>
              <div className="space-y-5 overflow-hidden">
                <div className="space-y-2">
                  <SkeletonBlock className="h-3 w-20" />
                  <SkeletonBlock className="h-9 w-44" />
                  <SkeletonBlock className="h-4 w-72 max-w-full" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-border bg-card p-5">
                      <SkeletonBlock className="mb-3 h-9 w-9 rounded-xl" />
                      <SkeletonBlock className="mb-2 h-3 w-24" />
                      <SkeletonBlock className="h-7 w-28" />
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="space-y-4">
                    <SkeletonBlock className="h-5 w-40" />
                    {Array.from({ length: 5 }).map((_, i) => (
                      <SkeletonBlock key={i} className="h-12 w-full rounded-xl" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/policies" element={<Policies />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<DashboardLayout><Overview /></DashboardLayout>} />
        <Route path="/dashboard/deposit" element={<DashboardLayout><Deposit /></DashboardLayout>} />
        <Route path="/dashboard/withdraw" element={<DashboardLayout><Withdraw /></DashboardLayout>} />
        <Route path="/dashboard/transactions" element={<DashboardLayout><Transactions /></DashboardLayout>} />
        <Route path="/dashboard/copy-experts" element={<DashboardLayout><CopyExperts /></DashboardLayout>} />
        <Route path="/dashboard/plans" element={<DashboardLayout><Plans /></DashboardLayout>} />
        <Route path="/dashboard/kyc" element={<DashboardLayout><Kyc /></DashboardLayout>} />
        <Route path="/dashboard/cars" element={<DashboardLayout><Cars /></DashboardLayout>} />
        <Route path="/dashboard/settings" element={<DashboardLayout><DashSettings /></DashboardLayout>} />
        <Route path="/dashboard/connect-wallet" element={<DashboardLayout><ConnectWallet /></DashboardLayout>} />
        <Route path="/403" element={<Forbidden />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {isFirstLoad && <TransitionOverlay />}
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          
          <ErrorBoundary>
            <RouteTransitionShell />
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
