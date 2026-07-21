import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Loader from "./Loader";

function S({ className = "" }: { className?: string }) {
  return <div className={`rounded-md bg-muted/50 ${className}`} />;
}

/* ... keep all your existing skeleton components unchanged ... */

// NEW: replaces AuthSkeleton for the loader-based transition
function AuthLoading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <Loader />
    </div>
  );
}

/* ... keep OverviewSkeleton, TransactionsSkeleton, FormSkeleton, CardGridSkeleton,
   PlansSkeleton, SettingsSkeleton, KycSkeleton, LandingSkeleton, DashboardShell
   exactly as they are ... */

const AUTH_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password"];

function pickSkeleton(pathname: string): ReactNode {
  if (pathname === "/dashboard") return <DashboardShell><OverviewSkeleton /></DashboardShell>;
  if (pathname.startsWith("/dashboard/transactions")) return <DashboardShell><TransactionsSkeleton /></DashboardShell>;
  if (pathname.startsWith("/dashboard/deposit")) return <DashboardShell><FormSkeleton rows={4} /></DashboardShell>;
  if (pathname.startsWith("/dashboard/withdraw")) return <DashboardShell><FormSkeleton rows={5} /></DashboardShell>;
  if (pathname.startsWith("/dashboard/connect-wallet")) return <DashboardShell><FormSkeleton rows={3} /></DashboardShell>;
  if (pathname.startsWith("/dashboard/copy-experts")) return <DashboardShell><CardGridSkeleton count={6} /></DashboardShell>;
  if (pathname.startsWith("/dashboard/cars")) return <DashboardShell><CardGridSkeleton count={6} /></DashboardShell>;
  if (pathname.startsWith("/dashboard/plans")) return <DashboardShell><PlansSkeleton /></DashboardShell>;
  if (pathname.startsWith("/dashboard/kyc")) return <DashboardShell><KycSkeleton /></DashboardShell>;
  if (pathname.startsWith("/dashboard/settings")) return <DashboardShell><SettingsSkeleton /></DashboardShell>;
  if (pathname.startsWith("/dashboard")) return <DashboardShell><OverviewSkeleton /></DashboardShell>;

  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    return <AuthLoading />;
  }

  if (pathname.startsWith("/inventory")) return <CardGridSkeleton count={6} />;

  return <LandingSkeleton />;
}

const LOADER_LOOP_MS = 1500; // matches Loader.css animation: l35 1.5s
const LOADER_LOOPS = 2;
const DEFAULT_TRANSITION_MS = 180;

export default function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    setShowSkeleton(true);
    const isAuthRoute = AUTH_PATHS.some((p) => location.pathname.startsWith(p));
    const duration = isAuthRoute ? LOADER_LOOP_MS * LOADER_LOOPS : DEFAULT_TRANSITION_MS;
    const t = window.setTimeout(() => setShowSkeleton(false), duration);
    return () => window.clearTimeout(t);
  }, [location.pathname]);

  if (showSkeleton) {
    // Auth loader shouldn't pulse like the skeletons do
    const isAuthRoute = AUTH_PATHS.some((p) => location.pathname.startsWith(p));
    return (
      <div className={isAuthRoute ? "" : "animate-pulse"}>
        {pickSkeleton(location.pathname)}
      </div>
    );
  }

  return <>{children}</>;
}
