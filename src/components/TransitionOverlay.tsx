import { useEffect, useState } from "react";

/**
 * Tesla letter-drop opening animation.
 * Used on first app load and during Login <-> Signup transitions.
 *
 * Timeline (total ~3500ms):
 *   0.0s – 1.4s  letters drop in (staggered, ease-in)
 *   1.3s – 2.0s  underline draws in
 *   1.4s – 2.4s  hold
 *   2.3s – 3.0s  underline erases
 *   2.4s – 3.5s  letters drop out (reverse stagger)
 *   3.5s         overlay fades & unmounts
 */
export default function TransitionOverlay({ duration = 3700 }: { duration?: number }) {
  const [phase, setPhase] = useState<"play" | "out" | "gone">("play");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("out"), duration - 300);
    const t2 = setTimeout(() => setPhase("gone"), duration);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [duration]);

  if (phase === "gone") return null;

  // letter in-delays (stagger), and out-delays (reverse stagger)
  const letters = ["t", "e", "s1", "l", "a"] as const;
  const inDelays: Record<string, number> = { t: 100, e: 250, s1: 400, l: 550, a: 700 };
  const outDelays: Record<string, number> = { t: 3100, e: 2950, s1: 2800, l: 2650, a: 2500 };

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
                    letterIn 700ms cubic-bezier(0.55, 0.055, 0.675, 0.19) ${inDelays[k]}ms both,
                    letterOut 600ms ease-in ${outDelays[k]}ms forwards
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
                  lineIn 700ms ease-out 1300ms both,
                  lineOut 700ms ease-in 2300ms forwards
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
        /* second part of S (lower curve) — handled inside .s1 via a nested span would be cleaner,
           but to keep one element we tuck a second curve via a sibling pseudo on .l? Instead use .l below. */

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
          height: 0.5vmin;
          margin-top: 1vmin;
        }
        .tesla-anim .underline {
          position: absolute;
          left: 0; top: 0;
          height: 0.5vmin;
          width: 0;
          background: #e81b22;
          border-radius: 1vmin;
          opacity: 0;
        }

        @keyframes letterIn {
          0%   { opacity: 0; transform: translateY(-30px) scaleY(0.7); }
          60%  { opacity: 1; transform: translateY(4px) scaleY(1.04); }
          80%  { transform: translateY(-2px) scaleY(0.98); }
          100% { opacity: 1; transform: translateY(0) scaleY(1); }
        }
        @keyframes letterOut {
          0%   { opacity: 1; transform: translateY(0) scaleY(1); }
          100% { opacity: 0; transform: translateY(24px) scaleY(0.7); }
        }
        @keyframes lineIn {
          0%   { width: 0; opacity: 1; }
          100% { width: 67vmin; opacity: 1; }
        }
        @keyframes lineOut {
          0%   { width: 67vmin; opacity: 1; left: 0; }
          100% { width: 0; opacity: 1; left: 67vmin; }
        }
      `}</style>
    </div>
  );
}
