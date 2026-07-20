import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import RotatingWords from "./RotatingWords";

const Hero = () => {
  const nav = useNavigate();

  return (
    <section className="relative min-h-[100svh] flex flex-col overflow-hidden">
      {/* Background video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/videos/hero-tesla.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay so text stays readable over the video */}
      <div className="absolute inset-0 bg-black/50 z-10" />

      {/* Subtle ambient red glow, top-right */}
      <div className="pointer-events-none absolute top-0 right-0 w-[800px] h-[600px] opacity-[0.06] z-10"
        style={{ background: "radial-gradient(closest-side, hsl(var(--primary)), transparent 70%)" }}
      />

      {/* Content overlay */}
      <div className="relative z-20 flex-1 flex flex-col justify-center pt-32 pb-8">
        <div className="max-w-[1400px] w-full mx-auto px-6 lg:px-10 text-center">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="label-mono text-white/60 mb-6"
          >
            Tesla — Invest. Drive. Repeat.
          </motion.p>

          <motion.h1
  initial={{ opacity: 0, filter: "blur(12px)", y: 16 }}
  animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
  transition={{ duration: 1, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
  className="font-display font-bold text-white text-[44px] sm:text-6xl md:text-7xl lg:text-[88px] leading-[0.95] tracking-[-0.04em]"
>
  <RotatingWords />, grow, drive.
  <br />
  <span className="text-white/50">The future of wealth.</span>
</motion.h1>


          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-7 text-[15px] md:text-base text-white/65 max-w-md mx-auto leading-relaxed font-light"
          >
            A secure platform for digital wealth growth turns your returns into the world's most iconic electric vehicles.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="mt-8 flex flex-wrap gap-2.5 justify-center"
          >
            <Button
              size="lg"
              onClick={() => nav("/signup")}
              className="rounded-full px-7 h-11 text-[14px] font-medium group"
            >
              Start Investing
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => nav("/dashboard")}
              className="rounded-full px-7 h-11 text-[14px] font-medium bg-transparent border-white/25 text-white hover:bg-white/10"
            >
              Login
            </Button>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.6 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/50"
        >
          <span className="label-mono text-[10px]">Scroll</span>
          <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
