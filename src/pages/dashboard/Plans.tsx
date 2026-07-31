import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const ADMIN_EMAIL = "support@teslagrowthequity.com";

const formatUsd = (n: number) =>
  `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export default function Plans() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [selected, setSelected] = useState<StaticPlan | null>(null);
  const [confirming, setConfirming] = useState(false);

  const handleBuyClick = (plan: StaticPlan) => {
    setSelected(plan);
  };

  const handleConfirm = async () => {
    if (!selected) return;
    setConfirming(true);

    // Fetch user profile for first name
    let firstName = "";
    if (user) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();
      firstName = ((prof as any)?.full_name || "").trim().split(" ")[0] || "";
    }

    // Email to user
    if (user?.email) {
      void supabase.functions.invoke("send-email", {
        body: {
          to: user.email,
          first_name: firstName,
          subject: `Plan Selected: ${selected.name}`,
          message: `<p style="margin:0 0 18px 0;">You have selected the <strong>${selected.name}</strong> plan.</p>
<p style="margin:0 0 18px 0;">
  <strong>Price:</strong> ${formatUsd(selected.price)}<br/>
  <strong>ROI:</strong> ${selected.roi}<br/>
  <strong>Duration:</strong> ${selected.duration}
</p>
<p style="margin:0;">To activate this plan, please complete your deposit of <strong>${formatUsd(selected.price)}</strong>. Your plan will be activated once payment is confirmed by our team.</p>`,
        },
      }).catch(() => {});
    }

    // Notify admin
    void supabase.functions.invoke("send-email", {
      body: {
        to: ADMIN_EMAIL,
        first_name: "Admin",
        subject: `Plan interest — ${selected.name}`,
        message: `<p style="margin:0 0 18px 0;">${user?.email ?? "A user"} has selected the <strong>${selected.name}</strong> plan and is proceeding to deposit.</p>
<p style="margin:0;">
  <strong>Price:</strong> ${formatUsd(selected.price)}<br/>
  <strong>ROI:</strong> ${selected.roi}<br/>
  <strong>Duration:</strong> ${selected.duration}
</p>`,
      },
    }).catch(() => {});

    setConfirming(false);
    setSelected(null);
    toast.success(`${selected.name} plan selected — proceeding to deposit`);
    nav(`/dashboard/deposit?amount=${selected.price}`);
  };

  return (
    <>
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
                  onClick={() => handleBuyClick(p)}
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

      {/* Confirm Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !confirming && setSelected(null)}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            {/* Close button */}
            <button
              onClick={() => !confirming && setSelected(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              disabled={confirming}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="mb-5">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Confirm plan</p>
              <h2 className="font-display text-2xl font-light">{selected.name} Plan</h2>
              <p className="text-muted-foreground text-[13px] mt-0.5">{selected.tagline}</p>
            </div>

            {/* Plan summary */}
            <div className="rounded-xl bg-muted/40 p-4 space-y-3 mb-5">
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-muted-foreground">Amount</span>
                <span className="font-display font-medium text-lg">{formatUsd(selected.price)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-muted-foreground">ROI</span>
                <span className="font-medium text-primary">{selected.roi}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-muted-foreground">Duration</span>
                <span className="font-medium">{selected.duration}</span>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-[11px] text-muted-foreground">Features included:</p>
                <ul className="mt-2 space-y-1.5">
                  {selected.features.map((f) => (
                    <li key={f} className="text-[12px] flex gap-2 items-center">
                      <Check className="w-3 h-3 text-primary shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Notice */}
            <p className="text-[12px] text-muted-foreground mb-5">
              You will be redirected to the deposit page with{" "}
              <span className="font-medium text-foreground">{formatUsd(selected.price)}</span> pre-filled.
              A confirmation email will be sent to your registered address.
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-full"
                onClick={() => setSelected(null)}
                disabled={confirming}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-full"
                onClick={handleConfirm}
                disabled={confirming}
              >
                {confirming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Confirm & Deposit"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
