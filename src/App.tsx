import PublicLayout from "./components/PublicLayout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import TeslaStock from "./pages/dashboard/TeslaStock";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import BuyCrypto from "./pages/dashboard/BuyCrypto";
import Withdraw from "./pages/dashboard/Withdraw";
import Transactions from "./pages/dashboard/Transactions";
import CopyExperts from "./pages/dashboard/CopyExperts";
import Plans from "./pages/dashboard/Plans";
import Kyc from "./pages/dashboard/Kyc";
import Cars from "./pages/dashboard/Cars";
import DashSettings from "./pages/dashboard/Settings";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useAutoLogout } from "./hooks/useAutoLogout";
import { ProfileProvider } from "./contexts/ProfileContext";
import ConnectWallet from "./pages/dashboard/ConnectWallet";
import ErrorBoundary from "./components/ErrorBoundary";
import PageTransition from "./components/PageTransition";
import SplashScreen from "./components/SplashScreen";
import LanguageSwitcher from "./components/LanguageSwitcher";
import Cybercab from "./pages/dashboard/Cybercab";
import GuestOnly from "./components/GuestOnly";

const queryClient = new QueryClient();

/**
 * Single, app-wide idle-logout controller. Mounted once (not per dashboard
 * page) so route changes never remount it or reset the idle clock.
 */
const AutoLogoutBridge = () => {
  const { user, loading } = useAuth();
  useAutoLogout(!!user, loading);
  return null;
};

const AppRoutes = () => {
  const location = useLocation();

  return (
    <PageTransition>
      <Routes location={location}>
        {/* Public pages: logged-in users are redirected to /dashboard (replace) */}
        <Route element={<GuestOnly />}>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/policies" element={<Policies />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* Must stay OUTSIDE GuestOnly: a password-recovery link creates a
            session, and guarding it would bounce the user to /dashboard
            before they can set a new password. */}
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Dashboard (DashboardLayout redirects guests to /login) */}
        <Route path="/dashboard" element={<DashboardLayout><Overview /></DashboardLayout>} />
        <Route path="/dashboard/deposit" element={<DashboardLayout><Deposit /></DashboardLayout>} />
        <Route path="/dashboard/buy-crypto" element={<DashboardLayout><BuyCrypto /></DashboardLayout>} />
        <Route path="/dashboard/withdraw" element={<DashboardLayout><Withdraw /></DashboardLayout>} />
        <Route path="/dashboard/transactions" element={<DashboardLayout><Transactions /></DashboardLayout>} />
        <Route path="/dashboard/copy-experts" element={<DashboardLayout><CopyExperts /></DashboardLayout>} />
        <Route path="/dashboard/plans" element={<DashboardLayout><Plans /></DashboardLayout>} />
        <Route path="/dashboard/kyc" element={<DashboardLayout><Kyc /></DashboardLayout>} />
        <Route path="/dashboard/cars" element={<DashboardLayout><Cars /></DashboardLayout>} />
        <Route path="/dashboard/settings" element={<DashboardLayout><DashSettings /></DashboardLayout>} />
        <Route path="/dashboard/connect-wallet" element={<DashboardLayout><ConnectWallet /></DashboardLayout>} />
        <Route path="/dashboard/tesla-stock" element={<DashboardLayout><TeslaStock /></DashboardLayout>} />
        <Route path="/dashboard/cybercab" element={<DashboardLayout><Cybercab /></DashboardLayout>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </PageTransition>
  );
};

const App = () => (
  <SplashScreen>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ProfileProvider>
              <ErrorBoundary>
                <AutoLogoutBridge />
                <AppRoutes />
                {/* Mounted once here (not per-page) so it persists — floating,
                    bottom-left — across every route instead of just Login/Signup. */}
                <LanguageSwitcher />
              </ErrorBoundary>
            </ProfileProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </SplashScreen>
);

export default App;
