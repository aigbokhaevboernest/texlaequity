import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatUSD } from "@/lib/cars";
import { Search, Pencil } from "lucide-react";

interface Profile {
  user_id: string; full_name: string | null; username: string | null;
  phone: string | null; country: string | null; account_level: string;
  balance: number; profit: number; total_deposit: number; created_at: string;
}

export default function AdminUsers() {
  const [rows, setRows] = useState<Profile[]>([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Profile | null>(null);
  const [form, setForm] = useState({ balance: "0", profit: "0", total_deposit: "0", account_level: "Basic" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(500)
      .then(({ data }) => { if (data) setRows(data as Profile[]); });
  };
  useEffect(load, []);

  const filtered = rows.filter((r) => {
    const s = q.toLowerCase();
    return !s || r.full_name?.toLowerCase().includes(s) || r.username?.toLowerCase().includes(s) || r.phone?.includes(s);
  });

  const openEdit = (p: Profile) => {
    setEditing(p);
    setForm({
      balance: String(p.balance), profit: String(p.profit),
      total_deposit: String(p.total_deposit), account_level: p.account_level,
    });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      balance: Number(form.balance),
      profit: Number(form.profit),
      total_deposit: Number(form.total_deposit),
      account_level: form.account_level,
    }).eq("user_id", editing.user_id);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("User updated"); setEditing(null); load(); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Users</h1>
        <p className="text-muted-foreground text-[13px] mt-1">{rows.length} total · click to edit balances</p>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, username, phone…" className="pl-9" />
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-3 font-medium">User</th>
                <th className="text-left p-3 font-medium">Phone</th>
                <th className="text-right p-3 font-medium">Balance</th>
                <th className="text-right p-3 font-medium">Profit</th>
                <th className="text-right p-3 font-medium">Deposits</th>
                <th className="text-left p-3 font-medium">Tier</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.user_id} className="border-t border-border hover:bg-muted/20">
                  <td className="p-3">
                    <p className="font-medium">{r.full_name || "—"}</p>
                    <p className="text-muted-foreground text-[11px]">@{r.username || "—"} · {r.country || "—"}</p>
                  </td>
                  <td className="p-3">{r.phone || "—"}</td>
                  <td className="p-3 text-right font-display">{formatUSD(Number(r.balance))}</td>
                  <td className="p-3 text-right font-display text-emerald-600">{formatUSD(Number(r.profit))}</td>
                  <td className="p-3 text-right font-display">{formatUSD(Number(r.total_deposit))}</td>
                  <td className="p-3">{r.account_level}</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(r)} className="h-8">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editing?.full_name || editing?.username}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Balance (USD)</Label><Input type="number" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} /></div>
            <div><Label>Profit (USD)</Label><Input type="number" value={form.profit} onChange={(e) => setForm({ ...form, profit: e.target.value })} /></div>
            <div><Label>Total deposit (USD)</Label><Input type="number" value={form.total_deposit} onChange={(e) => setForm({ ...form, total_deposit: e.target.value })} /></div>
            <div><Label>Account level</Label><Input value={form.account_level} onChange={(e) => setForm({ ...form, account_level: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}