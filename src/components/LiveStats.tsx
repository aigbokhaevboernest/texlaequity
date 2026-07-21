import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

type Stat = {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  format?: "number" | "compact" | "currency" | "percent";
};

const STATS: Stat[] = [
  { label: "Active investors", value: 284917, format: "number" },
  { label: "Total payouts", value: 48.2, prefix: "$", suffix: "M", decimals: 1 },
  { label: "Vehicles delivered", value: 202408, format: "number" },
  { label: "Avg. monthly ROI", value: 18.6, suffix: "%", decimals: 1 },
];

const formatNumber = (n: number, s: Stat) => {
  const dec = s.decimals ?? 0;
  if (s.format === "number") return Math.floor(n).toLocaleString("en-US");
  return n.toFixed(dec);
};

const Counter = ({ stat }: { stat: Stat }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1600;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(stat.value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setVal(stat.value);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, stat.value]);

  return (
    <span ref={ref} className="tabular-nums">
      {stat.prefix ?? ""}
      {formatNumber(val, stat)}
      {stat.suffix ?? ""}
    </span>
  );
};

const StatPill = ({ stat }: { stat: Stat }) => (
  <div className="flex items-center gap-4 px-6 py-4 mx-2 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm whitespace-nowrap">
    <div className="flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      <span className="label-mono text-foreground/45">{stat.label}</span>
    </div>
    <span className="font-display text-xl md:text-2xl font-light tracking-tight text-foreground">
      <Counter stat={stat} />
    </span>
  </div>
);

const LiveStats = () => {
  const loop = [...STATS, ...STATS];

  return (
    <section
      id="stats"
      aria-label="Live platform statistics"
      className="relative py-6 md:py-10 border-y border-border/60 bg-surface/40 overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 md:w-24 z-10 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 md:w-24 z-10 bg-gradient-to-l from-background to-transparent" />

      {/* Mobile: compact single-row scrollable ticker */}
      <div className="md:hidden flex items-center gap-4 overflow-x-auto px-6 whitespace-nowrap scrollbar-hide">
        {STATS.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2 shrink-0">
            {i !== 0 && <span className="text-foreground/25 text-xs">•</span>}
            <span className="w-1 h-1 rounded-full bg-primary" />
            <p className="label-mono text-foreground/45 text-[10px]">{s.label}</p>
            <p className="font-display text-sm font-medium text-foreground">
              <Counter stat={s} />
            </p>
          </div>
        ))}
      </div>

      {/* Marquee track (desktop) */}
      <div className="hidden md:flex relative w-full">
        <div className="flex ticker-track">
          {loop.map((s, i) => (
            <StatPill key={`${s.label}-${i}`} stat={s} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LiveStats;
