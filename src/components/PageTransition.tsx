const AUTH_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password"];
const LOADER_LOOP_MS = 1500; // matches Loader.css animation: l35 1.5s
const LOADER_LOOPS = 3;
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
    return <div className="animate-pulse">{pickSkeleton(location.pathname)}</div>;
  }

  return <>{children}</>;
}
