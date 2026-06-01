import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, Banknote, Star, ArrowDownToLine, ArrowUpFromLine, Users, LineChart } from "lucide-react";
import { useLiveData } from "@/hooks/useLiveData";
import { useCurrency } from "@/hooks/useCurrency";

interface Profile {
  full_name: string | null;
  total_balance: number;
  profit: number;
  deposit: number;
  account_level: string;
  status: string;
  assigned_expert_id: string | null;
}

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

const Overview = () => {
  const { user } = useAuth();
  const { format, ready: currencyReady } = useCurrency();
  const { data, refresh } = useLiveData(async () => {
    if (!user) return { profile: null as Profile | null, txs: [] as Tx[], expert: null as Expert | null };
    const [p, t] = await Promise.all([
      supabase.from("profiles").select("full_name, total_balance, profit, deposit, account_level, status, assigned_expert_id").eq("user_id", user.id).maybeSingle(),
      supabase.from("transactions").select("id, type, method, amount_usd, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
    ]);
    if (p.error) console.warn("[overview] profile fetch error:", p.error.message);
    if (t.error) console.warn("[overview] tx fetch error:", t.error.message);
    const profile = (p.data as Profile | null) ?? null;
    let expert: Expert | null = null;
    if (profile?.assigned_expert_id) {
      const { data: ex } = await supabase
        .from("expert_traders")
        .select("id, name, handle, specialty")
        .eq("id", profile.assigned_expert_id)
        .maybeSingle();
      expert = (ex as Expert | null) ?? null;
    }
    return { profile, txs: (t.data as Tx[] | null) ?? [], expert };
  }, [user?.id], { cacheKey: user ? `overview:${user.id}` : undefined });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`overview-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, refresh]);

  const profile = data?.profile ?? null;
  const txs = data?.txs ?? [];
  const expert = data?.expert ?? null;
  const isSuspended = profile?.status === "suspended";

  const profileLoaded = !!profile;
  const moneyReady = profileLoaded && currencyReady;
  const moneyOrSkeleton = (n: number) =>
    moneyReady ? format(n) : (<span className="inline-block h-7 w-24 rounded bg-muted animate-pulse" />);

  const stats = [
    { icon: Wallet, label: "Total Balance", value: moneyOrSkeleton(Number(profile?.total_balance ?? 0)) },
    { icon: TrendingUp, label: "Profit", value: moneyOrSkeleton(Number(profile?.profit ?? 0)) },
    { icon: Banknote, label: "Deposit", value: moneyOrSkeleton(Number(profile?.deposit ?? 0)) },
    { icon: Star, label: "Account Level", value: profile?.account_level ?? (profileLoaded ? "Basic" : <span className="inline-block h-7 w-20 rounded bg-muted animate-pulse" />) },
  ];

  const quick = [
    { to: "/dashboard/deposit", label: "Deposit", icon: ArrowDownToLine },
    { to: "/dashboard/withdraw", label: "Withdraw", icon: ArrowUpFromLine },
    { to: "/dashboard/copy-experts", label: "Copy Experts", icon: Users },
    { to: "/dashboard/plans", label: "Trading Plans", icon: LineChart },
  ];

  const firstName = profile?.full_name?.trim()?.split(" ")[0];

  return (
    <div className="space-y-8">
      {isSuspended && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5">
          <p className="font-display text-lg text-destructive mb-1">Account Suspended</p>
          <p className="text-[13px] text-muted-foreground">
            All actions are blocked. Contact{" "}
            <a className="text-primary underline" href="mailto:support@teslavest.com">
              support@teslavest.com
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
    {/* Live pulse dot */}
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
    </span>

    {/* Avatar */}
    <span className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground text-[8px] font-bold shrink-0">
      {expert.name.split(" ").map((s) => s[0]).join("")}
    </span>

    {/* Text */}
    <span className="text-[13px] text-muted-foreground whitespace-nowrap">
      You're Copying <span className="text-foreground font-semibold">{expert.name}</span>
      <span className="text-muted-foreground/50"> {expert.handle}</span>
    </span>
  </Link>
)}



      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                <s.icon className="w-4 h-4 text-foreground/70" />
              </div>
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
    </div>
  );
};

export default Overview;
