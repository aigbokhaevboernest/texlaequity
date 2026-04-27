import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const SEEN_KEY = "tv_intro_seen_v1";

const IntroAnimation = () => {
  // Show once per browser session, not on every nav
  const [show, setShow] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(SEEN_KEY) !== "1";
  });

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => {
      sessionStorage.setItem(SEEN_KEY, "1");
      setShow(false);
    }, 1800);
    return () => clearTimeout(t);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.7, ease: [0.4, 0, 0.2, 1] } }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
          aria-hidden="true"
        >
          {/* Ambient red glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 0.18, scale: 1.2 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="pointer-events-none absolute w-[700px] h-[700px] rounded-full"
            style={{
              background:
                "radial-gradient(closest-side, hsl(var(--primary)), transparent 70%)",
              filter: "blur(40px)",
            }}
          />

          {/* Wordmark reveal */}
          <div className="relative flex items-center gap-3 overflow-hidden">
            <motion.span
              initial={{ y: "110%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1], delay: 0.15 }}
              className="font-display font-light text-foreground text-4xl sm:text-5xl md:text-6xl tracking-[-0.04em]"
            >
              Tesla
            </motion.span>
            <motion.span
              initial={{ y: "110%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
              className="font-display font-light text-primary text-4xl sm:text-5xl md:text-6xl tracking-[-0.04em]"
            >
              Vest
            </motion.span>
          </div>

          {/* Sweeping line */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 1, ease: [0.4, 0, 0.2, 1], delay: 0.6 }}
            className="absolute bottom-[42%] left-1/2 -translate-x-1/2 h-px w-[220px] origin-left bg-gradient-to-r from-transparent via-foreground/40 to-transparent"
          />

          {/* Sliding cover-out panel */}
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: "-100%" }}
            transition={{ duration: 0.9, ease: [0.7, 0, 0.3, 1], delay: 1.1 }}
            className="absolute inset-0 bg-background"
            style={{ zIndex: -1 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntroAnimation;