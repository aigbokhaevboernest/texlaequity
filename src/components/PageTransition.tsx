import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

function SoftBlock({ className = "" }: { className?: string }) {
  return <div className={`rounded-md bg-muted/50 ${className}`} />;
}

function ContentSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-3">
        <SoftBlock className="h-6 w-1/3" />
        <SoftBlock className="h-3 w-1/2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SoftBlock className="h-28 w-full" />
        <SoftBlock className="h-28 w-full" />
        <SoftBlock className="h-28 w-full" />
      </div>
      <div className="space-y-3">
        <SoftBlock className="h-4 w-full" />
        <SoftBlock className="h-4 w-11/12" />
        <SoftBlock className="h-4 w-10/12" />
        <SoftBlock className="h-4 w-9/12" />
      </div>
      <SoftBlock className="h-48 w-full" />
    </div>
  );
}

export default function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    setShowSkeleton(true);
    const t = window.setTimeout(() => setShowSkeleton(false), 180);
    return () => window.clearTimeout(t);
  }, [location.pathname]);

  if (showSkeleton) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6 lg:py-10">
        <ContentSkeleton />
      </div>
    );
  }

  return <>{children}</>;
}
