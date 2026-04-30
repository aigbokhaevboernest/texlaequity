import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, Banknote, Star, ArrowDownToLine, ArrowUpFromLine, Users, LineChart } from "lucide-react";
import { useLiveData } from "@/hooks/useLiveData";
import { useCurrency } from "@/hooks/useCurrency";

interface Profile {
  full_name: string | null;
  balance: number;
  profit: number;
  total_deposit: number;
  account_level: string;
  status: string;
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
  const { format } = useCurrency();
  const { data } = useLiveData(async () => {
    if (!user) return { profile: null as Profile | null, txs: [] as Tx[] };
    const [p, t] = await Promise.all([
      supabase.from("profiles").select("full_name, balance, profit, total_deposit, account_level, status").eq("user_id", user.id).maybeSingle(),
      supabase.from("transactions").select("id, type, method, amount_usd, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
    ]);
    return { profile: (p.data as Profile | null) ?? null, txs: (t.data as Tx[] | null) ?? [] };
  }, [user?.id]);
  const profile = data?.profile ?? null;
  const txs = data?.txs ?? [];

  const stats = [
    { icon: Wallet, label: "Total Balance", value: format(Number(profile?.balance ?? 0)) },
    { icon: TrendingUp, label: "Profit", value: format(Number(profile?.profit ?? 0)) },
    { icon: Banknote, label: "Total Deposit", value: format(Number(profile?.total_deposit ?? 0)) },
    { icon: Star, label: "Account Level", value: profile?.account_level ?? "Basic" },
  ];

  const quick = [
    { to: "/dashboard/deposit", label: "Deposit", icon: ArrowDownToLine },
    { to: "/dashboard/withdraw", label: "Withdraw", icon: ArrowUpFromLine },
    { to: "/dashboard/copy-experts", label: "Copy Experts", icon: Users },
    { to: "/dashboard/plans", label: "Trading Plans", icon: LineChart },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="label-mono text-muted-foreground mb-2">Welcome back</p>
        <h1 className="font-display text-3xl md:text-4xl font-light tracking-[-0.03em]">
          {profile?.full_name?.split(" ")[0] ?? "Trader"}.
        </h1>
        <p className="text-muted-foreground text-[14px] mt-1">Here's a snapshot of your portfolio.</p>
      </div>

      {/* Stats */}
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

      {/* Quick actions */}
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

      {/* Recent transactions */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <h2 className="font-display text-xl font-medium">Recent activity</h2>
          <Link to="/dashboard/transactions" className="text-[13px] text-primary hover:underline">View all</Link>
        </div>
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {txs.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm">
              No transactions yet. <Link to="/dashboard/deposit" className="text-primary hover:underline">Make a deposit</Link>.
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
