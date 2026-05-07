import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StaticPlan {
  name: string;
  tagline: string;
  price: number;
  roi: string;
  duration: string;
  features: string[];
  popular?: boolean;
}

const PLANS: StaticPlan[] = [
  {
    name: "Starter",
    tagline: "Test the waters",
    price: 100,
    roi: "5%",
    duration: "7 days",
    features: ["Daily profit 0.7%", "Email support", "Basic market signals", "Withdraw anytime"],
  },
  {
    name: "Silver",
    tagline: "Build steady gains",
    price: 500,
    roi: "12%",
    duration: "14 days",
    features: ["Daily profit 0.9%", "Priority email support", "Copy trading access", "Weekly portfolio review"],
  },
  {
    name: "Gold",
    tagline: "Most chosen tier",
    price: 1000,
    roi: "18%",
    duration: "21 days",
    features: ["Daily profit 1.1%", "24/7 chat support", "Copy trading access", "Dedicated analyst", "Premium signals"],
    popular: true,
  },
  {
    name: "Pro",
    tagline: "For serious traders",
    price: 5000,
    roi: "26%",
    duration: "30 days",
    features: ["Daily profit 1.3%", "24/7 priority support", "Full copy trading", "1-on-1 strategy session", "Advanced analytics"],
  },
  {
    name: "Elite",
    tagline: "Maximize returns",
    price: 10000,
    roi: "35%",
    duration: "45 days",
    features: ["Daily profit 1.6%", "Personal account manager", "Hedge fund access", "Quarterly reports", "Tax optimization"],
  },
  {
    name: "VIP",
    tagline: "Exclusive whitelist",
    price: 50000,
    roi: "50%",
    duration: "60 days",
    features: ["Daily profit 2%+", "Concierge support", "Private deal flow", "Tesla event invitations", "Custom strategy desk"],
  },
];

const formatUsd = (n: number) =>
  `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export default function Plans() {
  const nav = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <p className="label-mono text-muted-foreground mb-2">Grow your wealth</p>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Trading Plans</h1>
        <p className="text-muted-foreground text-[14px] mt-1">
          Pick a tier that matches your goals. Fund a deposit to activate your plan.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLANS.map((p) => {
          const isPopular = !!p.popular;
          return (
            <article
              key={p.name}
              className={`relative rounded-2xl p-6 flex flex-col transition-all ${
                isPopular
                  ? "bg-foreground text-background shadow-2xl ring-2 ring-primary/40 scale-[1.02]"
                  : "border border-border bg-card hover:border-foreground/30"
              }`}
            >
              {isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-3 py-1 rounded-full bg-primary text-primary-foreground font-semibold shadow-lg">
                  <Sparkles className="w-3 h-3" /> Most popular
                </span>
              )}

              <div className="mb-1">
                <p className="font-display font-medium text-[16px]">{p.name}</p>
              </div>
              <p className={`text-[12px] mb-5 ${isPopular ? "text-background/60" : "text-muted-foreground"}`}>
                {p.tagline}
              </p>

              <div className="mb-5">
                <p className="font-display text-4xl font-light tracking-tight">{formatUsd(p.price)}</p>
                <p className={`text-[11px] mt-1 ${isPopular ? "text-background/60" : "text-muted-foreground"}`}>
                  {p.roi} ROI · {p.duration}
                </p>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="text-[13px] flex gap-2 items-start">
                    <Check className={`w-4 h-4 mt-0.5 shrink-0 ${isPopular ? "text-primary-glow" : "text-primary"}`} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => nav("/dashboard/deposit")}
                className={`rounded-full w-full ${
                  isPopular
                    ? "bg-background text-foreground hover:bg-background/90"
                    : ""
                }`}
              >
                Buy plan
              </Button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
