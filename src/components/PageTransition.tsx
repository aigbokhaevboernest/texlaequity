import { ReactNode, useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import Loader from "./Loader";

const LOADER_MS = 700;
const FLASH_MS = 250;
const AUTH_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password"];

export default function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [showLoader, setShowLoader] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    const prevPath = prevPathRef.current;
    const isAuthRoute = AUTH_PATHS.some((p) => location.pathname.startsWith(p));
    const cameFromAuthRoute = prevPath ? AUTH_PATHS.some((p) => prevPath.startsWith(p)) : false;

    const isDashboardRoute = location.pathname.startsWith("/dashboard");
    const cameFromDashboardRoute = prevPath ? prevPath.startsWith("/dashboard") : false;

    const isLogoutTransition = cameFromDashboardRoute && location.pathname === "/";

    prevPathRef.current = location.pathname;

    // Dashboard routes: no loader, no flash — always plain, whether arriving
    // from outside (e.g. login) or navigating within the dashboard.
    if (isDashboardRoute) {
      setShowLoader(false);
      setShowFlash(false);
      return;
    }

    const skipLoader = (isAuthRoute && cameFromAuthRoute) || isLogoutTransition;

    if (skipLoader) {
      setShowLoader(false);
      return;
    }

    setShowLoader(true);
    const t = window.setTimeout(() => setShowLoader(false), LOADER_MS);
    return () => window.clearTimeout(t);
  }, [location.pathname]);

  return (
    <>
      {children}
      {showFlash && (
        <div className="fixed inset-0 z-[9999] bg-white animate-[flash_0.25s_ease-out]" />
      )}
      {showLoader && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
          <Loader />
        </div>
      )}
    </>
  );
}
