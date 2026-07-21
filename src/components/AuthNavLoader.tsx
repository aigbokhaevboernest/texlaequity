import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "./Loader";

const LOOP_MS = 1500; // matches Loader.css animation: l35 1.5s
const LOOPS = 3;       // show 3 full loops instead of 2
const FADE_MS = 400;

export function useAuthNavigate() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const goTo = useCallback(
    (path: string) => {
      setLoading(true);
      setTimeout(() => {
        navigate(path);
        setLoading(false);
      }, LOOP_MS * LOOPS);
    },
    [navigate]
  );

  return { loading, goTo };
}

export function AuthLoaderOverlay({ show }: { show: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setMounted(true);
      // next tick so the fade-in transition actually fires
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), FADE_MS);
      return () => clearTimeout(t);
    }
  }, [show]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 transition-opacity ease-in-out`}
      style={{ transitionDuration: `${FADE_MS}ms`, opacity: visible ? 1 : 0 }}
    >
      <Loader />
    </div>
  );
}
