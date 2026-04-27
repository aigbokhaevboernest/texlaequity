import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Users, Banknote, FileCheck2, Car as CarIcon, ArrowRight } from "lucide-react";
import { formatUSD } from "@/lib/cars";

export default function AdminOverview() {
  const [s, setS] = useState({
    users: 0, pendingTx: 0, pendingKyc: 0, pendingOrders: 0,
    totalDeposits: 0, totalWithdrawals: 0,
  });

  useEffect(() => {
    (async () => {
      const [users, txPending, kycPending, ordersPending, depTotals, wdTotals] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("transactions").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("kyc_submissions").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("tesla_orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("transactions").select("amount_usd").eq("type", "deposit").eq("status", "approved"),
        supabase.from("transactions").select("amount_usd").eq("type", "withdrawal").eq("status", "approved"),
      ]);
      setS({
        users: users.count ?? 0,
        pendingTx: txPending.count ?? 0,
        pendingKyc: kycPending.count ?? 0,
        pendingOrders: ordersPending.count ?? 0,
        totalDeposits: (depTotals.data ?? []).reduce((a, r: any) => a + Number(r.amount_usd), 0),
        totalWithdrawals: (wdTotals.data ?? []).reduce((a, r: any) => a + Number(r.amount_usd), 0),
      });
    })();
  }, []);

  const cards = [
    { label: "Total users", value: s.users, icon: Users, to: "/admin/users", color: "bg-blue-50 text-blue-600 border-blue-200", iconBg: "bg-blue-100" },
    { label: "Pending transactions", value: s.pendingTx, icon: Banknote, to: "/admin/transactions", highlight: s.pendingTx > 0, color: "bg-amber-50 text-amber-600 border-amber-200", iconBg: "bg-amber-100" },
    { label: "Pending KYC", value: s.pendingKyc, icon: FileCheck2, to: "/admin/kyc", highlight: s.pendingKyc > 0, color: "bg-purple-50 text-purple-600 border-purple-200", iconBg: "bg-purple-100" },
    { label: "Pending orders", value: s.pendingOrders, icon: CarIcon, to: "/admin/orders", highlight: s.pendingOrders > 0, color: "bg-emerald-50 text-emerald-600 border-emerald-200", iconBg: "bg-emerald-100" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="label-mono text-muted-foreground mb-2">Admin console</p>
        <h1 className="font-display text-3xl md:text-4xl font-light tracking-[-0.03em]">Overview.</h1>
        <p className="text-muted-foreground text-[14px] mt-1">Moderate users, payouts, KYC and orders.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className={`rounded-2xl border p-5 hover:-translate-y-0.5 transition-all shadow-sm ${c.color} ${c.highlight ? "ring-1 ring-primary/30" : ""}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.iconBg}`}>
                <c.icon className="w-4 h-4" />
              </div>
              <ArrowRight className="w-4 h-4 opacity-50" />
            </div>
            <p className="text-[11px] uppercase tracking-wider mb-1 opacity-70">{c.label}</p>
            <p className="font-display text-2xl font-medium tracking-tight">{c.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 max-w-3xl">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-[11px] text-emerald-700 uppercase tracking-wider mb-1">Approved deposits</p>
          <p className="font-display text-3xl font-medium tracking-tight text-emerald-700">{formatUSD(s.totalDeposits)}</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <p className="text-[11px] text-blue-700 uppercase tracking-wider mb-1">Approved withdrawals</p>
          <p className="font-display text-3xl font-medium tracking-tight text-blue-700">{formatUSD(s.totalWithdrawals)}</p>
        </div>
      </div>
    </div>
  );
}