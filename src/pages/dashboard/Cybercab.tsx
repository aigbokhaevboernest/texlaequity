import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Rocket, TrendingUp, Package, PieChart, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { supabase } from "@/integrations/supabase/client";
import {
  CYBERCAB_PLANS, CHART_RANGES, ChartRange, EMPTY_HOLDING,
  INFO_TABS, InfoTab, INFO_CONTENT, CybercabPlan,
} from "@/lib/cybercab";

const ADMIN_EMAIL = "admin@texlaequity.com";

export default function Cybercab() {
  const { user } = useAuth();
  const { format } = useCurrency();
  const nav = useNavigate();

  const [range, setRange] = useState<ChartRange>("1M");
  const [tab, setTab] = useState<InfoTab>("Overview");
  const [selectedPlan, setSelectedPlan] = useState<CybercabPlan | null>(null);
  const [confirming, setConfirming] = useState(false);

  const holding = EMPTY_HOLDING; // wired to real data once backend exists

  const handleConfirm = async () => {
    if (!selectedPlan || !user) return;
    setConfirming(true);

    const userEmail = user.email ?? "";
    void supabase.functions.invoke("send-email", {
      body: {
        email: userEmail,
        subject: `Cybercab investment — ${selectedPlan.name} plan`,
        message: `<p>You've requested to invest in the <strong>${selectedPlan.name}</strong> Cybercab plan at ${format(selectedPlan.minAmount)}.</p><p>Please complete your deposit to activate this investment.</p>`,
      },
    }).catch(() => {});
    void supabase.functions.invoke("send-email", {
      body: {
        email: ADMIN_EMAIL,
        subject: `Cybercab investment request from ${userEmail || "user"}`,
        message: `<p>${userEmail || "A user"} requested the ${selectedPlan.name} Cybercab plan — ${format(selectedPlan.minAmount)}.</p>`,
      },
    }).catch(() => {});

    setTimeout(() => {
      setConfirming(false);
      setSelectedPlan(null);
      toast.success("Investment request submitted. Continue with deposit.");
      nav(`/dashboard/deposit?amount=${selectedPlan.minAmount}`);
    }, 500);
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div>
        <p className="label-mono text-muted-foreground mb-2">Autonomous mobility</p>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Cybercab Investment</h1>
        <p className="text-muted-foreground text-[14px] mt-1 max-w-lg">
          Invest in Tesla's purpose-built autonomous ride-hailing vehicle — designed for a driverless future.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: PieChart, label: "Total Invested", value: format(holding.totalInvested) },
          { icon: TrendingUp, label: "Current Value", value: format(holding.currentValue) },
          { icon: Package, label: "Units Held", value: holding.unitsHeld.toString() },
          { icon: Rocket, label: "Portfolio Change", value: `${holding.portfolioChangePct >= 0 ? "+" : ""}${holding.portfolioChangePct.toFixed(2)}%` },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <s.icon className="w-5 h-5 mb-3 text-primary" />
            <p className="text-[11px] text-muted-foreground mb-1">{s.label}</p>
            <p className="font-display text-lg font-medium">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-medium">Performance</h2>
          <div className="flex gap-1">
            {CHART_RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                  range === r ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="h-48 rounded-xl bg-muted/40 flex items-center justify-center text-[13px] text-muted-foreground">
          No performance data yet
        </div>
      </div>

      {/* Investment options */}
      <div>
        <h2 className="font-display text-lg font-medium mb-4">Investment Options</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CYBERCAB_PLANS.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border bg-card p-5 flex flex-col">
              <p className="font-display text-base font-medium mb-1">{p.name}</p>
              <p className="font-display text-2xl font-semibold mb-2">{format(p.minAmount)}</p>
              <p className="text-[12px] text-muted-foreground mb-4 flex-1">{p.description}</p>
              <Button className="w-full" onClick={() => setSelectedPlan(p)}>Invest Now</Button>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-3">No guaranteed returns. Values can rise or fall.</p>
      </div>

      {/* Holdings */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-medium mb-2">My Holdings</h2>
        <p className="text-[13px] text-muted-foreground">No Cybercab positions yet.</p>
      </div>

      {/* Activity */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-medium mb-2">Recent Activity</h2>
        <p className="text-[13px] text-muted-foreground">No recent activity.</p>
      </div>

      {/* Info tabs */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap gap-1 mb-4 border-b border-border pb-3">
          {INFO_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                tab === t ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <p className="text-[13px] text-muted-foreground leading-relaxed">{INFO_CONTENT[tab]}</p>
        {tab === "Risks" && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[12px] text-amber-700">
              Cybercab is not yet in commercial production. This is a speculative investment with no
              guaranteed return, and it is not officially affiliated with Tesla, Inc.
            </p>
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      <Dialog open={!!selectedPlan} onOpenChange={(o) => !confirming && !o && setSelectedPlan(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Confirm {selectedPlan?.name} plan</DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span className="font-medium">{selectedPlan.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-medium">{format(selectedPlan.minAmount)}</span></div>
              <p className="text-[11px] text-muted-foreground pt-1">
                No guaranteed returns. Values can rise or fall. Not officially affiliated with Tesla, Inc.
              </p>
            </div>
          )}
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setSelectedPlan(null)} disabled={confirming}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleConfirm} disabled={confirming}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
