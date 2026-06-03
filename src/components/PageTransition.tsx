import { ReactNode } from "react";
import { motion } from "framer-motion";

export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black">
      <motion.div
        className="min-h-screen"
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          transition: {
            duration: 0.15,
            ease: "easeOut",
          },
        }}
        exit={{
          opacity: 1,
          transition: {
            duration: 0,
          },
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}