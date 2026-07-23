// src/components/dashboard/WithdrawalHistory.tsx
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  History as HistoryIcon,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useLiveData } from "@/hooks/useLiveData";

interface WithdrawalHistoryRow {
  id: string;
  method: string;
  amount_usd: number;
  status: string;
  created_at: string;
}

interface WithdrawalHistoryProps {
  // Currency comes from the parent so this component doesn't open its own
  // duplicate `useCurrency()` realtime channel (was causing a
  // "postgres_changes callbacks after subscribe()" error when this component
  // is rendered inside a page that also calls useCurrency()).
  format: (amount: number) => string;
  currencyReady: boolean;
}

const STATUS_META: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  pending: { label: "Pending", className: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Clock },
  approved: { label: "Approved", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle2 },
  completed: { label: "Completed", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle2 },
  rejected: { label: "Rejected", className: "bg-red-500/10 text-red-600 border-red-500/20", icon: XCircle },
  failed: { label: "Failed", className: "bg-red-500/10 text-red-600 border-red-500/20", icon: XCircle },
};

function statusMeta(status: string) {
  return STATUS_META[status] ?? { label: status, className: "bg-muted text-muted-foreground border-border", icon: Clock };
}

export default function WithdrawalHistory({ format, currencyReady }: WithdrawalHistoryProps) {
  const { user } = useAuth();

  // Withdrawal history: every withdrawal transaction made by this user.
  const { data: historyData, refresh: refreshHistory } = useLiveData(async () => {
    if (!user) return { rows: [] as WithdrawalHistoryRow[] };
    const { data } = await supabase
      .from("transactions")
      .select("id, method, amount_usd, status, created_at")
      .eq("user_id", user.id)
      .eq("type", "withdrawal")
      .order("created_at", { ascending: false });
    return { rows: (data as WithdrawalHistoryRow[]) ?? [] };
  }, [user?.id], { cacheKey: user ? `withdraw-history:${user.id}` : undefined });

  const history = historyData?.rows ?? [];
  const historyReady = historyData !== null;

  // Realtime: reflect new withdrawals / status changes (e.g. admin approving/rejecting).
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`withdraw-history-${user.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` },
        () => refreshHistory())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, refreshHistory]);

  return (
    <div className="space-y-3 max-w-2xl">
      <div className="flex items-center gap-2">
        <HistoryIcon className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-medium">Withdrawal history</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {!historyReady ? (
          <div className="p-6 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="p-10 flex flex-col items-center text-center gap-2">
            <HistoryIcon className="w-6 h-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No withdrawals yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {history.map((row) => {
              const meta = statusMeta(row.status);
              const StatusIcon = meta.icon;
              const date = new Date(row.created_at);
              return (
                <li key={row.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{row.method}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      {" · "}
                      {date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-medium">
                      {currencyReady ? format(Number(row.amount_usd)) : `$${Number(row.amount_usd).toFixed(2)}`}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full border ${meta.className}`}>
                      <StatusIcon className="w-3 h-3" />
                      {meta.label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
