import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import cybercabImg from "@/assets/cybercab.png";

export default function CybercabPromoSection() {
  const { user } = useAuth();
  const nav = useNavigate();

  return (
    <section className="relative overflow-hidden py-24 bg-gradient-to-br from-[#0a1530] via-[#140e2e] to-[#0a1530] text-white">
      <div className="pointer-events-none absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-20 w-[400px] h-[400px] rounded-full bg-[#e0b84c]/10 blur-[100px]" />

      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-10 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        >
          <p className="label-mono text-[#e0b84c] mb-3">The future of mobility is moving</p>
          <h2 className="font-display text-4xl md:text-6xl font-light leading-[1.05] mb-5">
            Cybercab<br />Investment
          </h2>
          <p className="text-white/60 max-w-md mb-8 text-[15px] leading-relaxed">
            Get exposure to Tesla's purpose-built autonomous ride-hailing vehicle —
            designed without a steering wheel, built for a driverless future.
          </p>
          <Button
            size="lg"
            className="rounded-full bg-primary hover:bg-primary/90 px-7 h-12 text-[14px] font-medium group"
            onClick={() => nav(user ? "/dashboard/cybercab" : "/login", { state: { from: "/dashboard/cybercab" } })}
          >
            <Rocket className="w-4 h-4 mr-1.5" />
            Explore Cybercab
            <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1], delay: 0.15 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full" />
          <motion.img
            src={cybercabImg}
            alt="Tesla Cybercab"
            className="relative w-full max-w-lg mx-auto drop-shadow-2xl"
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </section>
  );
}
