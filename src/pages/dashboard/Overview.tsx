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
  const { data, refresh } = useLiveData(async () => {
    if (!user) return { profile: null as Profile | null, txs: [] as Tx[] };
    const [p, t] = await Promise.all([
      supabase.from("profiles").select("full_name, total_balance, profit, deposit, account_level, status").eq("user_id", user.id).maybeSingle(),
      supabase.from("transactions").select("id, type, method, amount_usd, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
    ]);
    if (p.error) console.warn("[overview] profile fetch error:", p.error.message);
    if (t.error) console.warn("[overview] tx fetch error:", t.error.message);
    return { profile: (p.data as Profile | null) ?? null, txs: (t.data as Tx[] | null) ?? [] };
  }, [user?.id]);

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

  const isSuspended = profile?.status === "suspended";

  const stats = [
    { icon: Wallet, label: "Total Balance", value: format(Number(profile?.total_balance ?? 0)) },
    { icon: TrendingUp, label: "Profit", value: isSuspended ? "————" : format(Number(profile?.profit ?? 0)) },
    { icon: Banknote, label: "Total Deposit", value: isSuspended ? "————" : format(Number(profile?.deposit ?? 0)) },
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
      {isSuspended && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5">
          <p className="font-display text-lg text-destructive mb-1">Account Suspended</p>
          <p className="text-[13px] text-muted-foreground">All actions are blocked. Your balance and profit are visible. Contact <a className="text-primary underline" href="mailto:support@teslavest.com">support@teslavest.com</a>.</p>
        </div>
      )}
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
              <div className="w-9​​​​​​​​​​​​​​​​
