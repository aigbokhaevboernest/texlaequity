import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Loader from "./Loader";

function S({ className = "" }: { className?: string }) {
  return <div className={`rounded-md bg-muted/50 ${className}`} />;
}

/* ---------- per-page content skeletons (mirror real layouts) ---------- */

function OverviewSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <S className="h-3 w-24" />
        <S className="h-9 w-64" />
        <S className="h-3 w-72" />
      </div>
      <S className="h-9 w-full max-w-md rounded-full" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5">
            <S className="w-9 h-9 rounded-xl mb-3" />
            <S className="h-3 w-20 mb-2" />
            <S className="h-7 w-28" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5">
            <S className="w-5 h-5 mb-3" />
            <S className="h-4 w-20" />
          </div>
        ))}
      </div>
      <div>
        <S className="h-5 w-40 mb-4" />
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <S className="w-9 h-9 rounded-full" />
                <div className="space-y-2">
                  <S className="h-3.5 w-40" />
                  <S className="h-3 w-24" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <S className="h-4 w-16" />
                <S className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TransactionsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <S className="h-3 w-20" />
        <S className="h-9 w-56" />
      </div>
      <div className="flex gap-4 border-b border-border pb-2">
        <S className="h-4 w-10" />
        <S className="h-4 w-16" />
        <S className="h-4 w-20" />
      </div>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border-b border-border last:border-0">
            <div className="flex items-center gap-3">
              <S className="w-9 h-9 rounded-full" />
              <div className="space-y-2">
                <S className="h-3.5 w-40" />
                <S className="h-3 w-28" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <S className="h-4 w-16" />
              <S className="h-5 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <S className="h-3 w-20" />
        <S className="h-9 w-56" />
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4 max-w-2xl">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-2">
            <S className="h-3 w-24" />
            <S className="h-10 w-full" />
          </div>
        ))}
        <S className="h-10 w-32 rounded-md" />
      </div>
    </div>
  );
}

function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <S className="h-3 w-20" />
        <S className="h-9 w-64" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <S className="h-40 w-full" />
            <S className="h-5 w-2/3" />
            <S className="h-3 w-full" />
            <S className="h-3 w-5/6" />
            <S className="h-9 w-28 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PlansSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <S className="h-3 w-24 mx-auto" />
        <S className="h-9 w-64 mx-auto" />
        <S className="h-3 w-80 mx-auto" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <S className="h-5 w-24" />
            <S className="h-10 w-32" />
            <div className="space-y-2">
              <S className="h-3 w-full" />
              <S className="h-3 w-5/6" />
              <S className="h-3 w-4/6" />
              <S className="h-3 w-5/6" />
            </div>
            <S className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <S className="h-3 w-20" />
        <S className="h-9 w-48" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <S className="h-5 w-40" />
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><S className="h-3 w-20" /><S className="h-10 w-full" /></div>
            <div className="space-y-2"><S className="h-3 w-20" /><S className="h-10 w-full" /></div>
          </div>
          <S className="h-10 w-32 rounded-md" />
        </div>
      ))}
    </div>
  );
}

function KycSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <S className="h-3 w-20" />
        <S className="h-9 w-56" />
        <S className="h-3 w-80" />
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5 max-w-2xl">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2"><S className="h-3 w-24" /><S className="h-10 w-full" /></div>
          <div className="space-y-2"><S className="h-3 w-24" /><S className="h-10 w-full" /></div>
        </div>
        <div className="space-y-2"><S className="h-3 w-32" /><S className="h-32 w-full rounded-lg" /></div>
        <div className="space-y-2"><S className="h-3 w-32" /><S className="h-32 w-full rounded-lg" /></div>
        <S className="h-10 w-40 rounded-md" />
      </div>
    </div>
  );
}

function AuthSkeleton() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      <Loader />
    </div>
  );
}


function LandingSkeleton() {
  return (
    <div className="space-y-12">
      <div className="h-16 border-b border-border flex items-center justify-between px-6">
        <S className="h-7 w-24" />
        <div className="flex gap-3"><S className="h-4 w-14" /><S className="h-4 w-14" /><S className="h-9 w-20 rounded-full" /></div>
      </div>
      <div className="max-w-5xl mx-auto px-6 space-y-5 text-center">
        <S className="h-3 w-32 mx-auto" />
        <S className="h-12 w-3/4 mx-auto" />
        <S className="h-12 w-2/3 mx-auto" />
        <S className="h-4 w-1/2 mx-auto" />
        <div className="flex justify-center gap-3 pt-2">
          <S className="h-11 w-32 rounded-full" />
          <S className="h-11 w-32 rounded-full" />
        </div>
        <S className="h-72 w-full rounded-2xl mt-6" />
      </div>
    </div>
  );
}

function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-mesh">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/60">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <S className="h-7 w-24" />
          <div className="flex items-center gap-3">
            <S className="hidden sm:block h-8 w-32 rounded-full" />
            <S className="h-9 w-9 rounded-full" />
          </div>
        </div>
      </header>
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6 lg:py-10 lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
        <aside className="hidden lg:block">
          <div className="rounded-2xl border border-border bg-card/60 p-3 space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <S key={i} className="h-9 w-full" />
            ))}
          </div>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

function pickSkeleton(pathname: string): ReactNode {
  // Dashboard routes
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

  // Auth pages
  if (["/login", "/signup", "/forgot-password", "/reset-password"].some((p) => pathname.startsWith(p))) {
    return <AuthSkeleton />;
  }

  // Inventory / cars list public page
  if (pathname.startsWith("/inventory")) return <CardGridSkeleton count={6} />;

  // Default: landing-like
  return <LandingSkeleton />;
}

const AUTH_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password"];
const LOADER_LOOP_MS = 1000;
const LOADER_LOOPS = 2;
const DEFAULT_TRANSITION_MS = 180;

export default function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [showSkeleton, setShowSkeleton] = useState(false);
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    const prevPath = prevPathRef.current;
    const isAuthRoute = AUTH_PATHS.some((p) => location.pathname.startsWith(p));
    const cameFromAuthRoute = prevPath
      ? AUTH_PATHS.some((p) => prevPath.startsWith(p))
      : false;

    // Skip the loader only when hopping between two auth pages (e.g. login <-> signup)
    const skipLoader = isAuthRoute && cameFromAuthRoute;

    prevPathRef.current = location.pathname;

    if (skipLoader) {
      setShowSkeleton(false);
      return;
    }

    setShowSkeleton(true);
    const duration = isAuthRoute ? LOADER_LOOP_MS * LOADER_LOOPS : DEFAULT_TRANSITION_MS;
    const t = window.setTimeout(() => setShowSkeleton(false), duration);
    return () => window.clearTimeout(t);
  }, [location.pathname]);

  if (showSkeleton) {
    const isAuthRoute = AUTH_PATHS.some((p) => location.pathname.startsWith(p));
    return (
      <div className={isAuthRoute ? "" : "animate-pulse"}>
        {pickSkeleton(location.pathname)}
      </div>
    );
  }

  return <>{children}</>;
}
