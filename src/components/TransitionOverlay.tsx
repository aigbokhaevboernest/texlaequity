import { useEffect, useRef, useState } from "react";

export default function TransitionOverlay({ duration = 3700 }: { duration?: number }) {
  const [phase, setPhase] = useState<"play" | "gone">("play");
  const letterRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const underlineRef = useRef<HTMLDivElement | null>(null);

  const letters = ['t', 'e', 's1', 's2', 'l', 'a'] as const;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("gone"), duration);
    return () => clearTimeout(t1);
  }, [duration]);

  useEffect(() => {
    if (phase !== "play") return;

    const els = letterRefs.current;
    const underline = underlineRef.current;
    if (!underline) return;

    const LOOP = 3.4;
    const IN_DUR = 0.42;
    const OUT_DUR = 0.35;
    const STAGGER = 0.10;
    const HOLD = 0.55;

    const lastInEnd = 0.08 + (letters.length - 1) * STAGGER + IN_DUR;
    const lineInStart = lastInEnd - 0.05;
    const lineInDur = 0.45;
    const lineHold = 0.18;
    const exitStart = lineInStart + lineInDur + lineHold;
    const lineOutDur = 0.38;

    // Reset
    underline.style.clipPath = 'inset(0 100% 0 0)';
    letters.forEach(k => {
      const el = els[k];
      if (el) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(-20px) scaleY(0.7)';
      }
    });

    const anim = (el: HTMLElement, keyframes: any[], duration: number, delay: number, easing = 'cubic-bezier(.22,.68,0,1.2)') => {
      return el.animate(keyframes, { duration: duration * 1000, delay: delay * 1000, fill: 'forwards', easing });
    };

    // Letters IN
    letters.forEach((k, i) => {
      const el = els[k];
      if (!el) return;
      anim(el, [
        { opacity: 0, transform: 'translateY(-20px) scaleY(0.7)' },
        { opacity: 1, transform: 'translateY(3px) scaleY(1.04)', offset: 0.55 },
        { opacity: 1, transform: 'translateY(-2px) scaleY(0.98)', offset: 0.75 },
        { opacity: 1, transform: 'translateY(0) scaleY(1)' }
      ], IN_DUR, 0.08 + i * STAGGER);
    });

    // Underline DRAW
    anim(underline, [
      { clipPath: 'inset(0 100% 0 0)' },
      { clipPath: 'inset(0 0% 0 0)' }
    ], lineInDur, lineInStart, 'cubic-bezier(.4,0,.2,1)');

    // Letters OUT (reverse stagger)
    [...letters].reverse().forEach((k, i) => {
      const el = els[k];
      if (!el) return;
      anim(el, [
        { opacity: 1, transform: 'translateY(0) scaleY(1)' },
        { opacity: 0, transform: 'translateY(22px) scaleY(0.65)' }
      ], OUT_DUR, exitStart + i * STAGGER, 'cubic-bezier(.4,0,1,1)');
    });

    // Underline ERASE
    anim(underline, [
      { clipPath: 'inset(0 0% 0 0)' },
      { clipPath: 'inset(0 100% 0 0)' }
    ], lineOutDur, exitStart, 'cubic-bezier(.4,0,1,1)');

  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
      <div className="logo">
        <div className="title">
          {letters.map((k) => (
            <div
              key={k}
              ref={(el) => { letterRefs.current[k] = el; }}
              className={k}
            />
          ))}
        </div>
        <div className="underline-wrap">
          <div ref={underlineRef} className="underline" />
        </div>
      </div>

      <style jsx>{`
        .logo {
          width: 67vmin;
          height: 12vmin;
          position: relative;
        }
        .title {
          width: 67vmin;
          height: 9.2vmin;
          position: relative;
        }

        .t, .e, .s1, .s2, .l, .a {
          position: absolute;
          background: #e81b22;
          will-change: transform, opacity;
        }

        /* T */
        .t {
          width: 10vmin; height: 1.6vmin;
          left: -46.4vmin; top: -7.2vmin;
          border-bottom-right-radius: 4vmin;
          border-bottom-left-radius: 4vmin;
        }
        .t::before {
          width: 1.5vmin; height: 7.5vmin;
          left: 4.25vmin; top: 0.3vmin;
        }

        /* E */
        .e {
          width: 9vmin; height: 1.6vmin;
          left: -19.8vmin; top: -7.2vmin;
          border-bottom-right-radius: 4vmin;
          border-bottom-left-radius: 4vmin;
        }
        .e::before, .e::after {
          width: 9vmin; height: 1.6vmin;
          border-bottom-right-radius: 4vmin;
          border-bottom-left-radius: 4vmin;
        }
        .e::before { top: 3.1vmin; }
        .e::after { top: 6.3vmin; }

        /* S */
        .s1 {
          width: 8.7vmin; height: 1.6vmin;
          left: 6.8vmin; top: -7.2vmin;
          border-bottom-right-radius: 4vmin;
        }
        .s1::before {
          width: 1.56vmin; height: 4vmin;
        }
        .s1::after {
          width: 8.7vmin; height: 1.5vmin;
          top: 3.2vmin;
        }
        .s2 {
          width: 8.9vmin; height: 1.4vmin;
          left: 6.3vmin; top: 5.3vmin;
          border-top-left-radius: 4vmin;
        }
        .s2::before {
          width: 1.6vmin; height: 4.3vmin;
          left: 7.5vmin; top: -2.9vmin;
        }

        /* L */
        .l {
          width: 1.5vmin; height: 7.85vmin;
          left: 25.7vmin; top: -0.9vmin;
        }
        .l::before {
          width: 8.4vmin; height: 1.4vmin;
          top: 6.5vmin;
          border-bottom-right-radius: 4vmin;
        }

        /* A */
        .a {
          width: 9vmin; height: 1.6vmin;
          left: 56.2vmin; top: -7.2vmin;
          border-bottom-right-radius: 4vmin;
          border-bottom-left-radius: 4vmin;
        }
        .a::before {
          width: 8.7vmin; height: 4.6vmin;
          left: 0.2vmin; top: 3.2vmin;
        }
        .a::after {
          width: 5.6vmin; height: 3.2vmin;
          background: #fff;
          left: 1.7vmin; top: 4.7vmin;
        }

        /* Underline */
        .underline-wrap {
          width: 67vmin;
          height: 0.45vmin;
          top: 5.6vmin;
          position: absolute;
          overflow: hidden;
        }
        .underline {
          position: absolute;
          height: 100%;
          width: 67vmin;
          background: #e81b22;
          border-radius: 1vmin;
          box-shadow: 0 0.3vmin 1vmin rgba(232,27,34,0.5);
        }
      `}</style>
    </div>
  );
}
