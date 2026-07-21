import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "./Loader";

const LOOP_MS = 1500;
const LOOPS = 2;

export function useAuthNavigate() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const goTo = useCallback(
    (path: string) => {
      setLoading(true);
      setTimeout(() => {
        navigate(path);
      }, LOOP_MS * LOOPS);
    },
    [navigate]
  );

  return { loading, goTo };
}

export function AuthLoaderOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95">
      <Loader />
    </div>
  );
}
