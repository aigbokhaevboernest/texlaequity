import { ReactNode, useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import Loader from "./Loader";

const LOADER_MS = 700;
const AUTH_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password"];

export default function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [showLoader, setShowLoader] = useState(false);
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    const skip = sessionStorage.getItem("skip_transition_loader");
    if (skip) {
      sessionStorage.removeItem("skip_transition_loader");
      setShowLoader(false);
      prevPathRef.current = location.pathname;
      return;
    }

    const prevPath = prevPathRef.current;
    const isAuthRoute = AUTH_PATHS.some((p) => location.pathname.startsWith(p));
    const cameFromAuthRoute = prevPath ? AUTH_PATHS.some((p) => prevPath.startsWith(p)) : false;

    const isDashboardRoute = location.pathname.startsWith("/dashboard");
    const cameFromDashboardRoute = prevPath ? prevPath.startsWith("/dashboard") : false;

    prevPathRef.current = location.pathname;

    // Skip loader: auth<->auth hops, and dashboard<->dashboard sidebar nav
    if ((isAuthRoute && cameFromAuthRoute) || (isDashboardRoute && cameFromDashboardRoute)) {
      setShowLoader(false);
      return;
    }

    setShowLoader(true);
    const t = window.setTimeout(() => setShowLoader(false), LOADER_MS);
    return () => window.clearTimeout(t);
  }, [location.pathname]);

  if (showLoader) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
        <Loader />
      </div>
    );
  }

  return <>{children}</>;
}
