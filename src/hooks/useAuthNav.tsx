import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "@/components/Loader";

const LOOP_DURATION_MS = 1500; // matches Loader.css animation: l35 1.5s
const LOOPS_BEFORE_FADE = 2;
const FADE_DURATION_MS = 500;

type AuthNavContextType = {
  goTo: (path: string) => void;
};

const AuthNavContext = createContext<AuthNavContextType | null>(null);

export function AuthNavProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const navigate = useNavigate();

  const goTo = useCallback(
    (path: string) => {
      setVisible(true);
      setFadeOut(false);

      const holdTime = LOOP_DURATION_MS * LOOPS_BEFORE_FADE;
      setTimeout(() => {
        setFadeOut(true);
        navigate(path);
      }, holdTime);

      setTimeout(() => {
        setVisible(false);
        setFadeOut(false);
      }, holdTime + FADE_DURATION_MS);
    },
    [navigate]
  );

  return (
    <AuthNavContext.Provider value={{ goTo }}>
      {children}
      {visible && (
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background transition-opacity duration-500 ${
            fadeOut ? "opacity-0" : "opacity-100"
          }`}
        >
          <Loader />
        </div>
      )}
    </AuthNavContext.Provider>
  );
}

export function useAuthNav() {
  const ctx = useContext(AuthNavContext);
  if (!ctx) throw new Error("useAuthNav must be used within AuthNavProvider");
  return ctx;
}
