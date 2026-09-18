import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, Banknote, Star, ArrowDownToLine, ArrowUpFromLine, Users, LineChart, ChevronRight, X, Check } from "lucide-react";
import { useLiveData } from "@/hooks/useLiveData";
import { useCurrency } from "@/hooks/useCurrency";
import { useProfile } from "@/contexts/ProfileContext";
import { toast } from "sonner";

interface Expert {
  id: string;
  name: string;
  handle: string;
  specialty: string | null;
}

interface Tx {
  id: string; type: string; method: string; amount_usd: number; status: string; created_at: string;
}

const STATUS_TONES: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700 border border-yellow-500/20",
  approved: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20",
  completed: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-700 border border-red-500/20",
};

const UPGRADE_PLANS = [
  { name: "Veteran Account",  desc: "For consistent investors ready to grow" },
  { name: "Master Account",   desc: "Advanced tools and priority support"    },
  { name: "Ultimate Account", desc: "Exclusive benefits and higher returns"  },
  { name: "Diamond Account",  desc: "Our most prestigious membership tier"   },
];

const ADMIN_EMAIL = "support@teslagrowthequity.com";

const Overview = () => {
  const { user } = useAuth();
  const { format, ready: currencyReady } = useCurrency();
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useProfile();

  // Upgrade modal state
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof UPGRADE_PLANS[0] | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const { data, refresh } = useLiveData(async () => {
    if (!user) return { txs: [] as Tx[], expert: null as Expert | null };
    const t = await supabase
      .from("transactions")
      .select("id, type, method, amount_usd, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    if (t.error) console.warn("[overview] tx fetch error:", t.error.message);

    let expert: Expert | null = null;
    if (profile?.assigned_expert_id) {
      const { data: ex } = await supabase
        .from("expert_traders")
        .select("id, name, handle, specialty")
        .eq("id", profile.assigned_expert_id)
        .maybeSingle();
      expert = (ex as Expert | null) ?? null;
    }
    return { txs: (t.data as Tx[] | null) ?? [], expert };
  }, [user?.id, profile?.assigned_expert_id], { cacheKey: user ? `overview:${user.id}` : undefined });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`overview-tx-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, refresh]);

  const txs = data?.txs ?? [];
  const expert = data?.expert ?? null;
  const isSuspended = profile?.status === "suspended";

  const profileLoaded = !profileLoading;
  const moneyReady = profileLoaded && currencyReady;
  const moneyOrSkeleton = (n: number) =>
    moneyReady ? format(n) : (<span className="inline-block h-7 w-24 rounded bg-muted animate-pulse" />);

  const firstName = profile?.full_name?.trim()?.split(" ")[0];

  const handleUpgradeConfirm = async () => {
    if (!selectedPlan || !user) return;
    setUpgrading(true);

    const firstName = profile?.full_name?.trim()?.split(" ")[0] || "";

    // Email to user
    if (user.email) {
      void supabase.functions.invoke("send-email", {
        body: {
          to: user.email,
          first_name: firstName,
          subject: `Account Upgrade Request — ${selectedPlan.name}`,
          message: `Your request to upgrade to the ${selectedPlan.name} has been received. Your request has been and is pending. Deposit the required amount for the plan to upgrade your account. Once your deposit is confirmed, your account level will be updated.`,
        },
      }).catch(() => {});
    }

    // Email to admin
    void supabase.functions.invoke("send-email", {
      body: {
        to: ADMIN_EMAIL,
        first_name: "Admin",
        subject: `Upgrade Request — ${selectedPlan.name}`,
        message: `${user.email} has requested an upgrade to ${selectedPlan.name}. Please review and update their account level once the deposit is confirmed.`,
      },
    }).catch(() => {});

    setUpgrading(false);
    setConfirmOpen(false);
    setUpgradeOpen(false);
    setSelectedPlan(null);
    toast.success("Upgrade request submitted — proceeding to deposit");
    navigate("/dashboard/deposit");
  };

  const stats = [
    { icon: Wallet,    label: "Total Balance",  value: moneyOrSkeleton(Number(profile?.total_balance ?? 0)), cardBg: "bg-card" },
    { icon: TrendingUp, label: "Profit",        value: moneyOrSkeleton(Number(profile?.profit ?? 0)),        cardBg: "bg-card" },
    { icon: Banknote,  label: "Deposit",        value: moneyOrSkeleton(Number(profile?.deposit ?? 0)),       cardBg: "bg-card" },
    {
      icon: Star,
      label: "Account Level",
      value: profile?.account_level ?? (profileLoaded ? "Basic" : <span className="inline-block h-7 w-20 rounded bg-muted animate-pulse" />),
      cardBg: "bg-muted/60",
      isLevel: true,
    },
  ];

  const quick = [
    { to: "/dashboard/deposit",      label: "Deposit",       icon: ArrowDownToLine },
    { to: "/dashboard/withdraw",     label: "Withdraw",      icon: ArrowUpFromLine },
    { to: "/dashboard/copy-experts", label: "Copy Experts",  icon: Users },
    { to: "/dashboard/plans",        label: "Trading Plans", icon: LineChart },
  ];

  return (
    <div className="space-y-8">
      {isSuspended && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5">
          <p className="font-display text-lg text-destructive mb-1">Account Suspended</p>
          <p className="text-[13px] text-muted-foreground">
            All actions are blocked. Contact{" "}
            <a className="text-primary underline" href="mailto:support@teslagrowthequity.com">
              support@teslagrowthequity.com
            </a>.
          </p>
        </div>
      )}

      <div>
        <p className="label-mono text-muted-foreground mb-2">Welcome back</p>
        <h1 className="font-display text-3xl md:text-4xl font-light tracking-[-0.03em]">
          {firstName ? `${firstName}.` : "Welcome."}
        </h1>
        <p className="text-muted-foreground text-[14px] mt-1">Here's a snapshot of your portfolio.</p>
      </div>

      {expert && (
        <Link
          to="/dashboard/copy-experts"
          className="flex w-full items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:scale-[1.03] transition-all duration-200 shadow-sm"
        >
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          <span className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground text-[8px] font-bold shrink-0">
            {expert.name.split(" ").map((s) => s[0]).join("")}
          </span>
          <span className="text-[13px] text-muted-foreground whitespace-nowrap">
            YOU ARE COPYING <span className="text-foreground font-semibold">{expert.name}</span>
            <span className="text-muted-foreground/50"> {expert.handle}</span>
          </span>
        </Link>
      )}

      {/* Balance cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-2xl border border-border ${s.cardBg} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                <s.icon className="w-4 h-4 text-foreground/70" />
              </div>
              {/* Upgrade button — only on Account Level card */}
              {(s as any).isLevel && (
                <button
                  onClick={() => setUpgradeOpen(true)}
                  className="flex items-center gap-1 rounded-full bg-primary/10 hover:bg-primary/20 text-primary px-2.5 py-1 text-[11px] font-semibold transition-all"
                >
                  Upgrade <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">{s.label}</p>
            <p className="font-display text-2xl font-medium tracking-tight">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quick.map((q) => (
          <Link
            key={q.to}
            to={q.to}
            className="rounded-2xl border border-border bg-card p-5 hover:border-foreground/40 hover:-translate-y-0.5 transition-all"
          >
            <q.icon className="w-5 h-5 mb-3 text-primary" />
            <p className="font-medium text-[14px]">{q.label}</p>
          </Link>
        ))}
      </div>

      <section>
        <div className="flex items-end justify-between mb-4">
          <h2 className="font-display text-xl font-medium">Recent activity</h2>
          <Link to="/dashboard/transactions" className="text-[13px] text-primary hover:underline">View all</Link>
        </div>
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {txs.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm">
              No transactions yet.{" "}
              <Link to="/dashboard/deposit" className="text-primary hover:underline">Make a deposit</Link>.
            </div>
          ) : (
            txs.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${t.type === "deposit" ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                    {t.type === "deposit"
                      ? <ArrowDownToLine className="w-4 h-4 text-emerald-600" />
                      : <ArrowUpFromLine className="w-4 h-4 text-red-600" />}
                  </div>
                  <div>
                    <p className="font-medium text-[14px] capitalize">{t.type} · {t.method}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(t.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display font-medium text-[14px]">{format(Number(t.amount_usd))}</span>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full ${STATUS_TONES[t.status] ?? "bg-muted"}`}>
                    {t.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="rounded-2xl border border-border bg-foreground text-background p-6 md:p-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="label-mono text-background/50 mb-2">Verify to unlock everything</p>
          <p className="font-display text-xl md:text-2xl font-light">Complete KYC to confirm your identity.</p>
        </div>
        <Link to="/dashboard/kyc">
          <Button className="rounded-full bg-background text-foreground hover:bg-background/90 px-6">Start KYC</Button>
        </Link>
      </div>

      {/* ── Upgrade Plan Picker Modal ── */}
      {upgradeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setUpgradeOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <p className="font-semibold text-[15px]">Upgrade Account</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">Select a plan to request an upgrade</p>
              </div>
              <button onClick={() => setUpgradeOpen(false)} className="rounded-full p-1.5 hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current level notice */}
            <div className="px-5 pt-4">
              <p className="text-[11px] text-muted-foreground">
                Current level: <span className="font-semibold text-foreground">{profile?.account_level ?? "Basic"}</span>
                {" "}· Only your admin can change your badge after deposit confirmation.
              </p>
            </div>

            {/* Plan list */}
            <div className="px-5 py-4 space-y-2">
              {UPGRADE_PLANS.map((plan) => {
                const isCurrent = profile?.account_level === plan.name;
                const isSelected = selectedPlan?.name === plan.name;
                return (
                  <button
                    key={plan.name}
                    disabled={isCurrent}
                    onClick={() => setSelectedPlan(plan)}
                    className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${
                      isCurrent
                        ? "border-border bg-muted/40 opacity-50 cursor-not-allowed"
                        : isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-[13px]">{plan.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{plan.desc}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {isSelected && <Check className="w-4 h-4 text-primary" />}
                        {isCurrent && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Current</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-5 pb-5">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { setUpgradeOpen(false); setSelectedPlan(null); }}>
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-xl"
                disabled={!selectedPlan}
                onClick={() => { setConfirmOpen(true); setUpgradeOpen(false); }}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Upgrade Modal ── */}
      {confirmOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => !upgrading && setConfirmOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <p className="font-semibold text-[15px]">Confirm Upgrade</p>
              <button onClick={() => !upgrading && setConfirmOpen(false)} className="rounded-full p-1.5 hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-5 space-y-4">
              {/* Selected plan summary */}
              <div className="rounded-xl bg-muted/40 border border-border px-4 py-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Selected Plan</p>
                <p className="font-semibold text-[15px]">{selectedPlan.name}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">{selectedPlan.desc}</p>
              </div>

              {/* Info notice */}
              <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3">
                <p className="text-[12px] text-foreground leading-relaxed">
                  Your administrator will be notified of your upgrade request. Please deposit the required amount and your account level will be updated by the admin once confirmed.
                </p>
              </div>

              <p className="text-[11px] text-muted-foreground">
                A confirmation email will be sent to <span className="font-medium text-foreground">{user?.email}</span>.
              </p>
            </div>

            <div className="flex gap-3 px-5 pb-5">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                disabled={upgrading}
                onClick={() => { setConfirmOpen(false); setUpgradeOpen(true); }}
              >
                Back
              </Button>
              <Button
                className="flex-1 rounded-xl"
                disabled={upgrading}
                onClick={handleUpgradeConfirm}
              >
                {upgrading
                  ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Sending…</span>
                  : "Confirm & Deposit"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Overview;
