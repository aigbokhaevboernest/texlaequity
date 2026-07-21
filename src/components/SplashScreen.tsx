import { useEffect, useState } from "react";

const MIN_DISPLAY_MS = 900;
const FADE_MS = 450;
const SESSION_KEY = "flexiq-splash-shown";

/**
 * App-level splash screen.
 * Mounted once, outside the router, in App.tsx. Shows the brand loader
 * over the navy/mediumblue mesh background on first load, then fades out.
 * Skips itself on subsequent renders in the same tab session.
 */
export const SplashScreen = () => {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) {
      setVisible(false);
      return;
    }

    const fadeTimer = setTimeout(() => setFading(true), MIN_DISPLAY_MS);
    const removeTimer = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem(SESSION_KEY, "1");
    }, MIN_DISPLAY_MS + FADE_MS);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden={fading}
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-navy-blue-mesh transition-opacity ease-out ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <span className="sr-only">Loading Flexiq</span>

      <div className="flexiq-loader" />

      <div className="mt-8 flex flex-col items-center gap-1">
        <span className="text-2xl font-semibold tracking-tight text-on-dark">
          Flexiq
        </span>
        <span className="text-xs uppercase tracking-[0.3em] text-on-dark-muted">
          Verve Banking
        </span>
      </div>

      <style>{`
        .flexiq-loader {
          width: 52px;
          aspect-ratio: 1;
          color: hsl(var(--mediumblue));
          position: relative;
        }
        .flexiq-loader::before,
        .flexiq-loader::after {
          content: "";
          position: absolute;
          inset: 0;
          background-size: 26px 26px;
          background-position: 0 0, 100% 0, 100% 100%, 0 100%;
          background-repeat: no-repeat;
        }
        .flexiq-loader::before {
          background-image:
            radial-gradient(farthest-side at top left, currentColor 96%, #0000),
            radial-gradient(farthest-side at top right, currentColor 96%, #0000),
            radial-gradient(farthest-side at bottom right, currentColor 96%, #0000),
            radial-gradient(farthest-side at bottom left, currentColor 96%, #0000);
          animation: flexiq-l40-1 1s infinite;
        }
        .flexiq-loader::after {
          background-image:
            radial-gradient(farthest-side at top left, #0000 94%, currentColor 96%),
            radial-gradient(farthest-side at top right, #0000 94%, currentColor 96%),
            radial-gradient(farthest-side at bottom right, #0000 94%, currentColor 96%),
            radial-gradient(farthest-side at bottom left, #0000 94%, currentColor 96%);
          animation: flexiq-l40-2 1s infinite;
        }
        @keyframes flexiq-l40-1 {
          0%, 10%, 90%, 100% { inset: 0; }
          40%, 60% { inset: -10px; }
        }
        @keyframes flexiq-l40-2 {
          0%, 40% { transform: rotate(0); }
          60%, 100% { transform: rotate(90deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .flexiq-loader::before,
          .flexiq-loader::after {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};
