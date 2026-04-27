import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { useLiveData } from "@/hooks/useLiveData";
import { useCurrency } from "@/hooks/useCurrency";

interface Tx {
  id: string; type: string; method: string; amount_usd: number; status: string; created_at: string;
}

const STATUS_TONES: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700 border border-yellow-500/20",
  approved: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20",
  completed: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-700 border border-red-500/20",
};

export default function Transactions() {
  const { user } = useAuth();
  const { format } = useCurrency();
  const [filter, setFilter] = useState<"all" | "deposit" | "withdrawal">("all");
  const { data: txs = [] } = useLiveData<Tx[]>(async () => {
    if (!user) return [];
    const { data } = await supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    return (data as Tx[] | null) ?? [];
  }, [user?.id]);

  const list = txs ?? [];
  const filtered = filter === "all" ? list : list.filter((t) => t.type === filter);

  return (
    <div className="space-y-6">
      <div>
        <p className="label-mono text-muted-foreground mb-2">History</p>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Transactions</h1>
      </div>

      <div className="flex gap-1 border-b border-border">
        {(["all", "deposit", "withdrawal"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-[13px] font-medium capitalize border-b-2 transition-colors ${
              filter === f ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">No transactions yet.</div>
        ) : (
          filtered.map((t) => (
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
    </div>
  );
}