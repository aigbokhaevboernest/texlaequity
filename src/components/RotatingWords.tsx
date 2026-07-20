import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const words = ["Invest", "Trade", "Earn"];

const RotatingWords = () => {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % words.length), 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <span className="relative inline-flex items-baseline overflow-hidden h-[0.95em] align-baseline">
      <AnimatePresence mode="wait">
    <motion.span
  key={words[i]}
  initial={{ y: "100%", opacity: 0, filter: "blur(8px)" }}
  animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
  exit={{ y: "-100%", opacity: 0, filter: "blur(8px)" }}
  transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
  className="inline-block text-primary font-bold"
>
  {words[i]}
</motion.span>

      </AnimatePresence>
    </span>
  );
};

export default RotatingWords;
