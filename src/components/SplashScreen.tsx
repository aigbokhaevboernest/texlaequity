import { useEffect, useState } from "react";
import Loader from "./Loader";

const LOOP_DURATION_MS = 1000; // matches the 1s animation cycle in Loader.css
const LOOPS_BEFORE_FADE = 2;
const FADE_DURATION_MS = 500;

const SplashScreen = ({ children }: { children: React.ReactNode }) => {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const holdTime = LOOP_DURATION_MS * LOOPS_BEFORE_FADE;
    const fadeTimer = setTimeout(() => setFadeOut(true), holdTime);
    const removeTimer = setTimeout(() => setShowSplash(false), holdTime + FADE_DURATION_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <>
      {showSplash && (
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background transition-opacity duration-500 ${
            fadeOut ? "opacity-0" : "opacity-100"
          }`}
        >
          <Loader />
        </div>
      )}
      {children}
    </>
  );
};

export default SplashScreen;
