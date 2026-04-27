import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const plans = [
  {
    name: "Basic",
    price: "$100",
    roi: "8%",
    period: "monthly",
    features: ["Daily payouts", "BTC / ETH / USDT", "Basic analytics", "Email support"],
    highlight: false,
  },
  {
    name: "Premium",
    price: "$1,000",
    roi: "14%",
    period: "monthly",
    features: ["Daily payouts", "Copy trading access", "Priority withdrawals", "Tesla discount 2%", "24/7 chat support"],
    highlight: true,
  },
  {
    name: "VIP",
    price: "$10,000",
    roi: "22%",
    period: "monthly",
    features: ["Daily payouts", "Dedicated trader", "Tesla discount 5%", "Cybertruck queue priority", "White-glove support"],
    highlight: false,
  },
];

const InvestmentPlans = () => {
  const nav = useNavigate();
  return (
    <section id="plans" className="py-32 relative bg-surface/40 border-y border-border/60">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="max-w-2xl mb-16">
          <p className="label-mono text-foreground/40 mb-4">02 — Investment Plans</p>
          <h2 className="font-display text-4xl md:text-6xl font-light tracking-[-0.035em] leading-[1]">
            Transparent ROI.<br />
            <span className="text-foreground/40">Daily payouts.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-border/60 rounded-3xl overflow-hidden">
          {plans.map((p, idx) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.08 }}
              className={`relative p-10 transition-colors ${
                p.highlight ? "bg-foreground text-background" : "bg-background hover:bg-surface/60"
              }`}
            >
              {p.highlight && (
                <span className="label-mono absolute top-6 right-6 text-background/60">Most popular</span>
              )}
              <p className={`label-mono mb-6 ${p.highlight ? "text-background/50" : "text-foreground/40"}`}>
                {p.name}
              </p>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-display text-5xl font-light tracking-tight">{p.price}</span>
                <span className={`text-sm ${p.highlight ? "text-background/50" : "text-foreground/40"}`}>
                  min
                </span>
              </div>
              <div className={`flex items-baseline gap-1 mb-10 ${p.highlight ? "text-background/70" : "text-foreground/60"}`}>
                <span className="font-display text-2xl font-light text-primary">{p.roi}</span>
                <span className="text-sm">/ {p.period}</span>
              </div>

              <ul className="space-y-3 mb-10 min-h-[180px]">
                {p.features.map((f) => (
                  <li
                    key={f}
                    className={`flex items-start gap-2.5 text-[13px] ${p.highlight ? "text-background/85" : "text-foreground/75"}`}
                  >
                    <Check className={`w-3.5 h-3.5 mt-1 shrink-0 ${p.highlight ? "text-background/60" : "text-primary"}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => nav("/signup")}
                variant={p.highlight ? "secondary" : "outline"}
                className={`w-full rounded-full h-11 text-[13px] font-medium ${
                  p.highlight ? "" : "bg-transparent border-foreground/15 hover:bg-foreground/5"
                }`}
              >
                Get {p.name}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InvestmentPlans;
