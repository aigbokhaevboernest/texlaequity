import { useEffect, useState } from "react";
import Loader from "./Loader";

const SplashScreen = ({ children }: { children: React.ReactNode }) => {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 900);
    const removeTimer = setTimeout(() => setShowSplash(false), 1300);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <>
      {showSplash && (
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background transition-opacity duration-400 ${
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
