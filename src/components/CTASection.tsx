import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const CTASection = () => {
  const nav = useNavigate();
  return (
    <section className="py-32 relative">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-[32px] overflow-hidden bg-foreground text-background p-12 md:p-20 text-center"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.18]"
            style={{
              background:
                "radial-gradient(600px 300px at 50% 0%, hsl(var(--primary)), transparent 70%)",
            }}
          />
          <div className="relative">
            <p className="label-mono text-background/50 mb-6">Ready when you are</p>
            <h3 className="font-display text-4xl md:text-6xl font-light tracking-[-0.035em] leading-[1] mb-8 max-w-3xl mx-auto">
              Start with $100.<br />
              <span className="text-background/50">Drive home in a Tesla.</span>
            </h3>
            <div className="flex flex-wrap gap-2.5 justify-center">
              <Button
                size="lg"
                onClick={() => nav("/signup")}
                className="rounded-full px-7 h-11 text-[14px] font-medium bg-background text-foreground hover:bg-background/90 group"
              >
                Open account
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => nav("/login")}
                className="rounded-full px-7 h-11 text-[14px] font-medium bg-transparent border-background/25 text-background hover:bg-background/10 hover:text-background"
              >
                Log in
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
