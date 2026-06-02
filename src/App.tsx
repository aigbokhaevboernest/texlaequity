import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
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
import AdminLayout from "./components/admin/AdminLayout";
import AdminOverview from "./pages/admin/Overview";
import AdminUsers from "./pages/admin/Users";
import AdminTransactions from "./pages/admin/Transactions";
import AdminKyc from "./pages/admin/Kyc";
import AdminOrders from "./pages/admin/Orders";
import AdminPlanSubs from "./pages/admin/PlanSubs";
import AdminCars from "./pages/admin/Cars";
import AdminLogin from "./pages/admin/Login";
import Forbidden from "./pages/Forbidden";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
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
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout><AdminOverview /></AdminLayout>} />
            <Route path="/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
            <Route path="/admin/transactions" element={<AdminLayout><AdminTransactions /></AdminLayout>} />
            <Route path="/admin/kyc" element={<AdminLayout><AdminKyc /></AdminLayout>} />
            <Route path="/admin/orders" element={<AdminLayout><AdminOrders /></AdminLayout>} />
            <Route path="/admin/plans" element={<AdminLayout><AdminPlanSubs /></AdminLayout>} />
            <Route path="/admin/cars" element={<AdminLayout><AdminCars /></AdminLayout>} />
            <Route path="/403" element={<Forbidden />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
