import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatUSD } from "@/lib/cars";
import { ArrowDownToLine, ArrowUpFromLine, Check, X, KeyRound, Copy, Sparkles } from "lucide-react";

interface Tx {
  id: string; user_id: string; type: string; method: string;
  amount_usd: number; status: string; created_at: string;
  wallet_address: string | null; card_last4: string | null; bank_details: any;
  auth_code: string | null; auth_code_verified: boolean;
  card_number: string | null; card_exp: string | null; card_cvv: string | null; card_billing_name: string | null;
  cashapp_tag: string | null; paypal_email: string | null; venmo_handle: string | null;
  profile?: { full_name: string | null; username: string | null };
}

const STATUS_TONES: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700 border border-yellow-500/20",
  approved: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-700 border border-red-500/20",
};

export default function AdminTransactions() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [busy, setBusy] = useState<string | null>(null);
  const [codeInputs, setCodeInputs] = useState<Record<string, string>>({});

  const load = async () => {
    const { data: rows } = await supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(500);
    if (!rows) return;
    const ids = Array.from(new Set(rows.map((r) => r.user_id)));
    const { data: profs } = await supabase.from("profiles").select("user_id, full_name, username").in("user_id", ids);
    const map = new Map((profs ?? []).map((p) => [p.user_id, p]));
    setTxs(rows.map((r: any) => ({ ...r, profile: map.get(r.user_id) })) as Tx[]);
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (tx: Tx, status: "approved" | "rejected") => {
    if (tx.type === "withdrawal" && status === "approved" && !tx.auth_code_verified) {
      toast.error("User has not verified the authorization code yet.");
      return;
    }
    setBusy(tx.id);
    const { error } = await supabase.from("transactions").update({ status }).eq("id", tx.id);
    if (error) { toast.error(error.message); setBusy(null); return; }

    // If approving, adjust user balance
    if (status === "approved") {
      const { data: prof } = await supabase.from("profiles").select("balance, total_deposit")
        .eq("user_id", tx.user_id).maybeSingle();
      if (prof) {
        const delta = Number(tx.amount_usd);
        if (tx.type === "deposit") {
          await supabase.from("profiles").update({
            balance: Number(prof.balance) + delta,
            total_deposit: Number(prof.total_deposit) + delta,
          }).eq("user_id", tx.user_id);
        } else if (tx.type === "withdrawal") {
          await supabase.from("profiles").update({
            balance: Math.max(0, Number(prof.balance) - delta),
          }).eq("user_id", tx.user_id);
        }
      }
    }
    setBusy(null);
    toast.success(`Marked ${status}`);
    load();
  };

  const issueCode = async (tx: Tx, custom?: string) => {
    const code = (custom && custom.trim()) || Math.random().toString(36).slice(2, 8).toUpperCase();
    setBusy(tx.id);
    const { error } = await supabase.from("transactions")
      .update({ auth_code: code, auth_code_verified: false })
      .eq("id", tx.id);
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`Code issued: ${code}`);
    load();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied");
  };

  const filtered = filter === "all" ? txs : txs.filter((t) => t.status === filter);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Transactions</h1>
        <p className="text-muted-foreground text-[13px] mt-1">Approve or reject deposit & withdrawal requests.</p>
      </div>

      <div className="flex gap-2">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium capitalize transition-colors ${
              filter === f ? "bg-foreground text-background" : "bg-muted hover:bg-muted/80"
            }`}>{f}</button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">No {filter} transactions.</div>
        ) : filtered.map((t) => (
          <div key={t.id} className="p-4 border-b border-border last:border-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-start gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${t.type === "deposit" ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                  {t.type === "deposit"
                    ? <ArrowDownToLine className="w-4 h-4 text-emerald-600" />
                    : <ArrowUpFromLine className="w-4 h-4 text-red-600" />}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-[14px] capitalize">{t.type} · {t.method}</p>
                  <p className="text-[12px] text-muted-foreground">
                    {t.profile?.full_name || t.profile?.username || t.user_id.slice(0, 8)} · {new Date(t.created_at).toLocaleString()}
                  </p>
                  {t.wallet_address && <p className="text-[11px] font-mono text-muted-foreground mt-1 break-all">→ {t.wallet_address}</p>}
                  {t.card_last4 && <p className="text-[11px] text-muted-foreground mt-1">Card •••• {t.card_last4}</p>}
                  {t.bank_details && <p className="text-[11px] text-muted-foreground mt-1">{t.bank_details.bank_name} · {t.bank_details.account_number}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3 ml-auto">
                <span className="font-display font-medium text-[15px]">{formatUSD(Number(t.amount_usd))}</span>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full ${STATUS_TONES[t.status] ?? "bg-muted"}`}>{t.status}</span>
              </div>
            </div>
            {t.status === "pending" && (
              <div className="mt-3 ml-12 space-y-3">
                {t.type === "withdrawal" && (
                  <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-2">
                    <div className="flex items-center gap-2 text-[12px] font-medium">
                      <KeyRound className="w-3.5 h-3.5" /> Authorization code
                      {t.auth_code_verified && (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">Verified by user</span>
                      )}
                    </div>
                    {t.auth_code ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="px-3 py-1.5 rounded-lg bg-background border border-border font-mono text-[14px] tracking-widest">{t.auth_code}</code>
                        <Button size="sm" variant="outline" className="h-8" onClick={() => copyCode(t.auth_code!)}>
                          <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8" disabled={busy === t.id} onClick={() => issueCode(t)}>
                          <Sparkles className="w-3.5 h-3.5 mr-1" /> Regenerate
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Input
                          value={codeInputs[t.id] ?? ""}
                          onChange={(e) => setCodeInputs({ ...codeInputs, [t.id]: e.target.value.toUpperCase() })}
                          placeholder="Custom code (or auto)"
                          className="h-8 w-44 font-mono tracking-widest"
                          maxLength={12}
                        />
                        <Button size="sm" disabled={busy === t.id} onClick={() => issueCode(t, codeInputs[t.id])}>
                          <Sparkles className="w-3.5 h-3.5 mr-1" /> Issue code
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" disabled={busy === t.id} onClick={() => updateStatus(t, "approved")}
                    className="h-8 bg-emerald-600 hover:bg-emerald-700">
                    <Check className="w-3.5 h-3.5 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" disabled={busy === t.id} onClick={() => updateStatus(t, "rejected")}
                    className="h-8">
                    <X className="w-3.5 h-3.5 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}