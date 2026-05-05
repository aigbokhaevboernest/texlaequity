import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import RotatingWords from "./RotatingWords";
import heroTesla from "@/assets/hero-tesla.jpg";

const Hero = () => {
  const nav = useNavigate();

  return (
    <section className="relative min-h-[100svh] flex flex-col bg-hero overflow-hidden">
      {/* Subtle ambient red glow, top-right */}
      <div className="pointer-events-none absolute top-0 right-0 w-[800px] h-[600px] opacity-[0.06]"
        style={{ background: "radial-gradient(closest-side, hsl(var(--primary)), transparent 70%)" }}
      />

      <div className="relative flex-1 flex flex-col pt-32 pb-8">
        {/* Top eyebrow + headline block */}
        <div className="max-w-[1400px] w-full mx-auto px-6 lg:px-10 text-center">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="label-mono text-foreground/50 mb-6"
          >
            Tesla — Invest. Drive. Repeat.
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, filter: "blur(12px)", y: 16 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: 1, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
            className="font-display font-light text-foreground text-[44px] sm:text-6xl md:text-7xl lg:text-[88px] leading-[0.95] tracking-[-0.04em]"
          >
            <RotatingWords />, grow, drive.
            <br />
            <span className="text-foreground/40">The future of wealth.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-7 text-[15px] md:text-base text-foreground/55 max-w-md mx-auto leading-relaxed font-light"
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
              className="rounded-full px-7 h-11 text-[14px] font-medium bg-transparent border-foreground/15 hover:bg-foreground/5"
            >
              Login
            </Button>
          </motion.div>
        </div>

        {/* Cinematic car image — full bleed, bottom anchored */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1], delay: 0.4 }}
          className="relative mt-10 lg:mt-2 flex-1 flex items-end justify-center"
        >
          <img
            src={heroTesla}
            alt="Tesla Model S in studio lighting"
            width={1920}
            height={1280}
            className="w-full max-w-[1100px] mx-auto h-auto object-contain px-4"
          />
          {/* Soft ground shadow */}
          <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-12 rounded-[50%] blur-2xl bg-foreground/15" />
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.6 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-foreground/40"
        >
          <span className="label-mono text-[10px]">Scroll</span>
          <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
