import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { z } from "zod";

interface Plan {
  id: string; name: string; tagline: string | null; roi_percent: number;
  duration_days: number; min_amount_usd: number; max_amount_usd: number;
  features: string[]; badge: string | null;
}

const amountSchema = z.coerce.number().positive("Amount required");

export default function Plans() {
  const { user } = useAuth();
  const { format, currency } = useCurrency();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("trading_plans").select("*").order("sort_order")
      .then(({ data }) => { if (data) setPlans(data as unknown as Plan[]); });
  }, []);

  // Per spec: "Buy plan" button redirects to deposit page (no balance deduction here)
  const goDeposit = () => { window.location.href = "/dashboard/deposit"; };

  return (
    <div className="space-y-6">
      <div>
        <p className="label-mono text-muted-foreground mb-2">Grow your wealth</p>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Trading Plans</h1>
        <p className="text-muted-foreground text-[14px] mt-1">Pick a tier. Capital is automatically deployed.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                {p.features.map((f) => (
                  <li key={f} className="text-[12px] flex gap-2 items-start">
                    <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" /><span>{f}</span>
                  </li>
                ))}
              </ul>
              <p className={`text-[11px] mb-3 ${dark ? "text-background/60" : "text-muted-foreground"}`}>{format(p.min_amount_usd)} – {format(p.max_amount_usd)}</p>
              <Button onClick={() => { setSelected(p); setAmount(String(p.min_amount_usd)); }} className={`rounded-full w-full ${dark ? "bg-background text-foreground hover:bg-background/90" : ""}`}>Subscribe</Button>
            </article>
          );
        })}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Subscribe to {selected?.name}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted p-3 text-[12px] space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">ROI</span><span className="font-medium">{selected.roi_percent}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-medium">{selected.duration_days} days</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Range</span><span className="font-medium">{format(selected.min_amount_usd)} – {format(selected.max_amount_usd)}</span></div>
              </div>
              <div>
                <Label>Investment amount (USD)</Label>
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} />
                {amount && !isNaN(Number(amount)) && (
                  <p className="text-[11px] text-muted-foreground mt-1">Expected payout: <span className="font-medium text-foreground">{format(Number(amount) * (1 + Number(selected.roi_percent) / 100))}</span></p>
                )}
              </div>
              <Button onClick={subscribe} disabled={loading} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm subscription"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}