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
    const prevPath = prevPathRef.current;
    const isAuthRoute = AUTH_PATHS.some((p) => location.pathname.startsWith(p));
    const cameFromAuthRoute = prevPath ? AUTH_PATHS.some((p) => prevPath.startsWith(p)) : false;

    const isDashboardRoute = location.pathname.startsWith("/dashboard");
    const cameFromDashboardRoute = prevPath ? prevPath.startsWith("/dashboard") : false;

    // Logout = leaving /dashboard and landing on "/"
    const isLogoutTransition = cameFromDashboardRoute && location.pathname === "/";

    prevPathRef.current = location.pathname;

    const skipLoader =
      (isAuthRoute && cameFromAuthRoute) ||
      (isDashboardRoute && cameFromDashboardRoute) ||
      isLogoutTransition;

    if (skipLoader) {
      setShowLoader(false);
      return;
    }

    setShowLoader(true);
    const t = window.setTimeout(() => setShowLoader(false), LOADER_MS);
    return () => window.clearTimeout(t);
  }, [location.pathname]);

  // Render the loader as an OVERLAY on top of children — never replace children.
  // This keeps Navbar (and anything else persistent) mounted, so it never flickers.
  return (
    <>
      {children}
      {showLoader && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
          <Loader />
        </div>
      )}
    </>
  );
}
