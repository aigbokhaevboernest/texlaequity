import { useEffect, useState } from "react";

/**
 * Single-run Tesla opening animation for first load and auth-route navigation.
 * Based on the user-provided TESLA letter-drop sequence with underline draw/erase.
 */
export default function TransitionOverlay({ duration = 2600 }: { duration?: number }) {
  const [phase, setPhase] = useState<"play" | "out" | "gone">("play");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("out"), duration - 300);
    const t2 = setTimeout(() => setPhase("gone"), duration);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [duration]);

  if (phase === "gone") return null;

  const letters = ["t", "e", "s1", "s2", "l", "a"] as const;
  const inDelays: Record<(typeof letters)[number], number> = {
    t: 80,
    e: 180,
    s1: 280,
    s2: 380,
    l: 480,
    a: 580,
  };
  const outDelays: Record<(typeof letters)[number], number> = {
    a: 1460,
    l: 1560,
    s2: 1660,
    s1: 1760,
    e: 1860,
    t: 1960,
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-300 ${
        phase === "out" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="tesla-anim">
        <div className="logo">
          <div className="title">
            {letters.map((k) => (
              <span
                key={k}
                className={`ltr ${k}`}
                style={{
                  animation: `
                    letterIn 300ms cubic-bezier(0.55, 0.055, 0.675, 0.19) ${inDelays[k]}ms both,
                    letterOut 200ms cubic-bezier(.4,0,1,1) ${outDelays[k]}ms forwards
                  `,
                }}
              />
            ))}
          </div>
          <div className="underline-wrap">
            <span
              className="underline"
              style={{
                animation: `
                  lineIn 450ms cubic-bezier(.4,0,.2,1) 830ms both,
                  lineOut 500ms cubic-bezier(.4,0,1,1) 1460ms forwards
                `,
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        .tesla-anim .logo {
          position: relative;
          width: 67vmin;
          height: 12vmin;
          background: transparent;
          overflow: visible;
        }
        .tesla-anim .title {
          position: relative;
          width: 67vmin;
          height: 9.2vmin;
        }
        .tesla-anim .ltr,
        .tesla-anim .ltr::before,
        .tesla-anim .ltr::after {
          position: absolute;
          content: "";
          display: block;
        }
        .tesla-anim .ltr { opacity: 0; }

        /* T */
        .tesla-anim .t {
          width: 10vmin; height: 1.6vmin; background: #e81b22;
          left: 4vmin; top: 0;
          border-bottom-right-radius: 4vmin; border-bottom-left-radius: 4vmin;
        }
        .tesla-anim .t::before {
          width: 1.5vmin; height: 7.5vmin; background: #e81b22;
          left: 4.25vmin; top: 0.3vmin;
        }
        /* E */
        .tesla-anim .e {
          width: 9vmin; height: 1.6vmin; background: #e81b22;
          left: 17vmin; top: 0;
          border-bottom-right-radius: 4vmin; border-bottom-left-radius: 4vmin;
        }
        .tesla-anim .e::before {
          width: 9vmin; height: 1.6vmin; background: #e81b22;
          border-bottom-right-radius: 4vmin; border-bottom-left-radius: 4vmin;
          top: 3.1vmin; left: 0;
        }
        .tesla-anim .e::after {
          width: 9vmin; height: 1.6vmin; background: #e81b22;
          border-bottom-right-radius: 4vmin; border-bottom-left-radius: 4vmin;
          top: 6.3vmin; left: 0;
        }
        /* S */
        .tesla-anim .s1 {
          width: 8.7vmin; height: 1.6vmin; background: #e81b22;
          left: 28vmin; top: 0;
          border-bottom-right-radius: 4vmin;
        }
        .tesla-anim .s1::before {
          width: 1.56vmin; height: 4vmin; background: #e81b22;
          left: 0; top: 0;
        }
        .tesla-anim .s1::after {
          width: 8.7vmin; height: 1.5vmin; background: #e81b22;
          top: 3.2vmin; left: 0;
        }
        .tesla-anim .s2 {
          width: 8.9vmin; height: 1.4vmin; background: #e81b22;
          left: 28.2vmin; top: 5.3vmin;
          border-top-left-radius: 4vmin;
        }
        .tesla-anim .s2::before {
          width: 1.6vmin; height: 4.3vmin; background: #e81b22;
          left: 7.3vmin; top: -2.9vmin;
        }

        /* L */
        .tesla-anim .l {
          width: 1.5vmin; height: 7.85vmin; background: #e81b22;
          left: 46vmin; top: 0;
        }
        .tesla-anim .l::before {
          width: 8.4vmin; height: 1.4vmin; background: #e81b22;
          top: 6.5vmin; left: 0;
          border-bottom-right-radius: 4vmin;
        }
        /* A */
        .tesla-anim .a {
          width: 9vmin; height: 1.6vmin; background: #e81b22;
          border-bottom-right-radius: 4vmin; border-bottom-left-radius: 4vmin;
          left: 57vmin; top: 0;
        }
        .tesla-anim .a::before {
          width: 8.7vmin; height: 4.6vmin; background: #e81b22;
          left: 0.2vmin; top: 3.2vmin;
        }
        .tesla-anim .a::after {
          width: 5.6vmin; height: 3.2vmin; background: #fff;
          left: 1.7vmin; top: 4.7vmin;
        }

        /* underline */
        .tesla-anim .underline-wrap {
          position: relative;
          width: 67vmin;
          height: 0.45vmin;
          top: 0.8vmin;
          overflow: hidden;
          background: transparent;
        }
        .tesla-anim .underline {
          position: absolute;
          left: 0; top: 0;
          height: 0.45vmin;
          width: 67vmin;
          background: #e81b22;
          border-radius: 1vmin;
          clip-path: inset(0 100% 0 0);
          will-change: clip-path;
          box-shadow: 0 0.3vmin 1vmin rgba(232,27,34,0.5), 0 0.1vmin 0.4vmin rgba(232,27,34,0.35);
        }

        @keyframes letterIn {
          0%   { opacity: 0; transform: translateY(-20px) scaleY(0.7); }
          55%  { opacity: 1; transform: translateY(3px) scaleY(1.04); }
          75%  { opacity: 1; transform: translateY(-2px) scaleY(0.98); }
          100% { opacity: 1; transform: translateY(0) scaleY(1); }
        }
        @keyframes letterOut {
          0%   { opacity: 1; transform: translateY(0) scaleY(1); }
          100% { opacity: 0; transform: translateY(22px) scaleY(0.65); }
        }
        @keyframes lineIn {
          0%   { clip-path: inset(0 100% 0 0); }
          100% { clip-path: inset(0 0% 0 0); }
        }
        @keyframes lineOut {
          0%   { clip-path: inset(0 0% 0 0); }
          100% { clip-path: inset(0 100% 0 0); }
        }
      `}</style>
    </div>
  );
}
