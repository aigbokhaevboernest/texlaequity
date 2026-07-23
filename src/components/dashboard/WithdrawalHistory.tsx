import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogTitle, DialogHeader,
} from "@/components/ui/dialog";
import { StatusPill } from "@/pages/dashboard/Dashboard";

type Row = { id: string; amount: number; method: string | null; status: string; created_at: string };

interface Props {
  refreshKey: number;
  symbol?: string;
  onResume: (txId: string, txAmount: number) => void;
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
      .select("id, amount, method, status, created_at")
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
    <Card className="border-white/10 p-0 overflow-hidden" style={{ backgroundColor: "#0F1629" }}>
      <div className="px-5 py-4 border-b border-white/10">
        <h3 className="text-white font-bold text-sm">Withdrawal History</h3>
      </div>
      {rows === null && (
        <div className="divide-y divide-white/10">
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
        <div className="p-6 text-center text-white/50 text-sm">No withdrawals yet.</div>
      )}
      {rows && rows.length > 0 && (
        <div className="divide-y divide-white/10">
          {rows.map((r) => {
            // "cancelled"     -> user exited the verification modal before finishing -> Continue (resume same tx)
            // "awaiting_code" -> admin assigned a further code (e.g. COT/tax) -> Continue (resume same tx)
            // anything else (pending, approved, failed, rejected) -> read-only View
            const showResume = r.status === "cancelled" || r.status === "awaiting_code";
            return (
              <div key={r.id} className="px-4 py-3 flex items-center gap-3 text-sm">
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold tabular-nums">
                    {Number(r.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-white/50 truncate">
                    {r.method || "—"} · {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>
                <StatusPill status={r.status} />
                {showResume ? (
                  <Button size="sm" variant="gold" onClick={() => onResume(r.id, Number(r.amount))}>
                    Continue
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="border-white/20 text-white/80 hover:bg-white/10" onClick={() => setDetail(r)}>
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
