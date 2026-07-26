import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogTitle, DialogHeader,
} from "@/components/ui/dialog";

type Row = { id: string; amount: number; method: string | null; status: string; created_at: string };

interface Props {
  refreshKey: number;
  symbol?: string;
  onResume: (txId: string, txAmount: number) => void;
}

// Light-theme tones — same status colors used in Transactions.tsx, so the
// badges look consistent wherever they appear in the app.
const STATUS_TONES: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700 border border-yellow-500/20",
  awaiting_code: "bg-yellow-500/10 text-yellow-700 border border-yellow-500/20",
  approved: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20",
  completed: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-700 border border-red-500/20",
  failed: "bg-red-500/10 text-red-700 border border-red-500/20",
  cancelled: "bg-muted text-muted-foreground border border-border",
};

function StatusPill({ status }: { status: string }) {
  const tone = STATUS_TONES[status] ?? "bg-muted text-muted-foreground border border-border";
  return (
    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full whitespace-nowrap ${tone}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default function WithdrawalHistory({ refreshKey, onResume }: Props) {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [detail, setDetail] = useState<Row | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = () => supabase
      .from("transactions")
      // amount_usd is the actual column name on this table; aliased to `amount`
      // so the rest of this component can stay unchanged.
      .select("id, amount:amount_usd, method, status, created_at")
      .eq("user_id", user.id)
      .eq("type", "withdrawal")
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (!cancelled) setRows((data as Row[] | null) ?? []); });
    load();

    const ch = supabase
      .channel(`wd-history-${user.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` },
        () => load())
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [user?.id, refreshKey]);

  return (
    <Card className="border-border p-0 overflow-hidden" style={{ backgroundColor: "#F2F2F2" }}>
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-foreground font-bold text-sm">Withdrawal History</h3>
      </div>
      {rows === null && (
        <div className="divide-y divide-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1 space-y-1.5">
                <div className="skeleton-shimmer h-4 w-24" />
                <div className="skeleton-shimmer h-3 w-40" />
              </div>
              <div className="skeleton-shimmer h-5 w-20 rounded-full" />
              <div className="skeleton-shimmer h-8 w-20 rounded-md" />
            </div>
          ))}
        </div>
      )}
      {rows !== null && rows.length === 0 && (
        <div className="p-6 text-center text-muted-foreground text-sm">No withdrawals yet.</div>
      )}
      {rows && rows.length > 0 && (
        <div className="divide-y divide-border">
          {rows.map((r) => {
            // "cancelled"     -> user exited the verification modal before finishing -> Continue (resume same tx)
            // "awaiting_code" -> admin assigned a further code (e.g. COT/tax) -> Continue (resume same tx)
            // anything else (pending, approved, failed, rejected) -> read-only View
            const showResume = r.status === "cancelled" || r.status === "awaiting_code";
            return (
              <div key={r.id} className="px-4 py-3 flex items-center gap-3 text-sm">
                <div className="flex-1 min-w-0">
                  <div className="text-foreground font-semibold tabular-nums">
                    {Number(r.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {r.method || "—"} · {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>
                <StatusPill status={r.status} />
                {showResume ? (
                  <Button size="sm" variant="default" onClick={() => onResume(r.id, Number(r.amount))}>
                    Continue
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="border-border text-foreground hover:bg-muted" onClick={() => setDetail(r)}>
                    View
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="bg-white text-slate-900 rounded-2xl border-0 max-w-sm">
          <DialogHeader>
            <DialogTitle>Transaction details</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-2 text-sm">
              <DetailRow k="Amount" v={Number(detail.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} />
              <DetailRow k="Method" v={detail.method || "—"} />
              <DetailRow k="Status" v={detail.status} />
              <DetailRow k="Date" v={new Date(detail.created_at).toLocaleString()} />
              <DetailRow k="Reference" v={detail.id.slice(0, 8).toUpperCase()} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

const DetailRow = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between border-b border-slate-100 py-1.5">
    <span className="text-slate-500">{k}</span>
    <span className="font-semibold capitalize">{v}</span>
  </div>
);
