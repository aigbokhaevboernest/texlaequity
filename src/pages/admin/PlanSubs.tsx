import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatUSD } from "@/lib/cars";

interface Sub {
  id: string; user_id: string; amount_usd: number; expected_return_usd: number;
  status: string; starts_at: string; ends_at: string | null;
  plan?: { name: string; roi_percent: number };
  profile?: { full_name: string | null; username: string | null };
}

export default function AdminPlanSubs() {
  const [rows, setRows] = useState<Sub[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("plan_subscriptions")
        .select("*, plan:trading_plans(name, roi_percent)")
        .order("created_at", { ascending: false });
      if (!data) return;
      const ids = Array.from(new Set(data.map((r) => r.user_id)));
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name, username").in("user_id", ids);
      const map = new Map((profs ?? []).map((p) => [p.user_id, p]));
      setRows(data.map((r: any) => ({ ...r, profile: map.get(r.user_id) })) as Sub[]);
    })();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Plan subscriptions</h1>
        <p className="text-muted-foreground text-[13px] mt-1">{rows.length} active investments</p>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-3 font-medium">User</th>
                <th className="text-left p-3 font-medium">Plan</th>
                <th className="text-right p-3 font-medium">Invested</th>
                <th className="text-right p-3 font-medium">Expected return</th>
                <th className="text-left p-3 font-medium">Started</th>
                <th className="text-left p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">No subscriptions yet</td></tr>
              ) : rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3">{r.profile?.full_name || r.profile?.username || r.user_id.slice(0, 8)}</td>
                  <td className="p-3">{r.plan?.name} · {r.plan?.roi_percent}%</td>
                  <td className="p-3 text-right font-display">{formatUSD(Number(r.amount_usd))}</td>
                  <td className="p-3 text-right font-display text-emerald-600">{formatUSD(Number(r.expected_return_usd))}</td>
                  <td className="p-3">{new Date(r.starts_at).toLocaleDateString()}</td>
                  <td className="p-3 capitalize">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}