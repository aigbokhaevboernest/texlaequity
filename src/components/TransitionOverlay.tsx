import { useEffect, useState } from "react";
import TeslaLogo from "./TeslaLogo";

/**
 * Plays the Tesla "T" opening animation once when mounted.
 * Used at app load and between Login <-> Register.
 */
export default function TransitionOverlay({ duration = 1800 }: { duration?: number }) {
  const [phase, setPhase] = useState<"in" | "out" | "gone">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("out"), duration - 500);
    const t2 = setTimeout(() => setPhase("gone"), duration);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [duration]);

  if (phase === "gone") return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-500 ${
        phase === "out" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="animate-[teslaPop_900ms_cubic-bezier(.2,.7,.2,1)_both]">
        <TeslaLogo size={140} />
      </div>
      <style>{`
        @keyframes teslaPop {
          0%   { opacity: 0; transform: scale(.6); }
          60%  { opacity: 1; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
