import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Rocket, Gauge, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import cybercabImg from "@/assets/cybercab.png";

export default function CybercabPromoSection() {
  const { user } = useAuth();
  const nav = useNavigate();

  const goToCybercab = () =>
    nav(user ? "/dashboard/cybercab" : "/login", { state: { from: "/dashboard/cybercab" } });

  return (
    <section className="relative overflow-hidden py-14" style={{ backgroundColor: "#F7F4EE" }}>
      {/* Subtle dot-grid texture for a techy feel, very low opacity */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative max-w-[1100px] mx-auto px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
          className="label-mono text-[#b8862f] mb-2 text-[11px]"
        >
          The future of mobility is moving
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="font-display text-3xl md:text-5xl font-light text-foreground mb-3 tracking-[-0.02em]"
        >
          Cybercab Investment
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-muted-foreground max-w-lg mx-auto mb-8 text-[14px] leading-relaxed"
        >
          Get exposure to Tesla's purpose-built autonomous ride-hailing vehicle, designed
          without a steering wheel for a fully driverless future.
        </motion.p>

        {/* Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          className="relative mx-auto max-w-2xl"
        >
          <motion.div
            className="relative rounded-[28px] overflow-hidden shadow-xl cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            onClick={goToCybercab}
          >
            <motion.img
              src={cybercabImg}
              alt="Tesla Cybercab"
              className="w-full h-auto object-cover"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Floating spec chips — futuristic touch */}
            <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-md px-3 py-1.5 text-[11px] font-medium text-white">
              <Gauge className="w-3 h-3" /> Fully Autonomous
            </div>
            <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-md px-3 py-1.5 text-[11px] font-medium text-white">
              <Zap className="w-3 h-3" /> No Steering Wheel
            </div>
          </motion.div>
        </motion.div>

        {/* Button — placed right beneath the image */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-7"
        >
          <Button
            size="lg"
            className="rounded-full px-7 h-12 text-[14px] font-medium group"
            onClick={goToCybercab}
          >
            <Rocket className="w-4 h-4 mr-1.5" />
            <span className="relative overflow-hidden inline-block">
              <span className="inline-block transition-transform duration-300 group-hover:-translate-y-full">
                Explore Cybercab
              </span>
              <span className="absolute left-0 top-full inline-block transition-transform duration-300 group-hover:-translate-y-full">
                Explore Cybercab
              </span>
            </span>
            <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
