import { ReactNode } from "react";
import { motion } from "framer-motion";

export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black">
      <motion.div
        className="min-h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          opacity: {
            duration: 0.15,
            ease: "easeOut",
          },
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}