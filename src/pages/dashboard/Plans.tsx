import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { useNavigate } from "react-router-dom";

interface Plan {
  id: string; name: string; tagline: string | null; roi_percent: number;
  duration_days: number; min_amount_usd: number; max_amount_usd: number;
  features: string[]; badge: string | null;
}

export default function Plans() {
  const { format } = useCurrency();
  const nav = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    supabase.from("trading_plans").select("*").order("sort_order")
      .then(({ data }) => { if (data) setPlans(data as unknown as Plan[]); });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="label-mono text-muted-foreground mb-2">Grow your wealth</p>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Trading Plans</h1>
        <p className="text-muted-foreground text-[14px] mt-1">Pick a tier. Fund a deposit to activate.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((p, i) => {
          const dark = i === plans.length - 1;
          return (
            <article key={p.id} className={`rounded-2xl p-6 flex flex-col ${dark ? "bg-foreground text-background" : "border border-border bg-card"}`}>
              <div className="flex items-center justify-between mb-1">
                <p className="font-display font-medium text-[15px]">{p.name}</p>
                {p.badge && (
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${dark ? "bg-background/15 text-background" : "bg-primary/10 text-primary"}`}>{p.badge}</span>
                )}
              </div>
              <p className={`text-[12px] mb-4 ${dark ? "text-background/60" : "text-muted-foreground"}`}>{p.tagline}</p>
              <div className="mb-5">
                <p className="font-display text-3xl font-light">{p.roi_percent}%</p>
                <p className={`text-[11px] ${dark ? "text-background/60" : "text-muted-foreground"}`}>ROI in {p.duration_days} days</p>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {(p.features ?? []).map((f) => (
                  <li key={f} className="text-[12px] flex gap-2 items-start">
                    <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" /><span>{f}</span>
                  </li>
                ))}
              </ul>
              <p className={`text-[11px] mb-3 ${dark ? "text-background/60" : "text-muted-foreground"}`}>{format(p.min_amount_usd)} – {format(p.max_amount_usd)}</p>
              <Button onClick={() => nav("/dashboard/deposit")} className={`rounded-full w-full ${dark ? "bg-background text-foreground hover:bg-background/90" : ""}`}>Buy plan</Button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
