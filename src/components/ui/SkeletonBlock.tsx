import { cn } from "@/lib/utils";

/** Content-shaped skeleton with shimmer. */
export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted/60",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:animate-[shimmer_1.4s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent",
        className,
      )}
    >
      <style>{`@keyframes shimmer { 100% { transform: translateX(100%); } }`}</style>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <SkeletonBlock className="w-9 h-9 rounded-xl mb-3" />
      <SkeletonBlock className="h-3 w-20 mb-2" />
      <SkeletonBlock className="h-7 w-28" />
    </div>
  );
}

export function InputSkeleton() {
  return (
    <div>
      <SkeletonBlock className="h-3 w-20 mb-2" />
      <SkeletonBlock className="h-10 w-full rounded-md" />
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="w-9 h-9 rounded-full" />
        <div>
          <SkeletonBlock className="h-3.5 w-40 mb-2" />
          <SkeletonBlock className="h-3 w-24" />
        </div>
      </div>
      <SkeletonBlock className="h-4 w-20" />
    </div>
  );
}
