import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatUSD } from "@/lib/cars";
import {
  Search, Pencil, Loader2, UserX, UserCheck, Trash2, AlertCircle, Eye, EyeOff,
} from "lucide-react";

interface AdminUserRow {
  user_id: string;
  email: string | null;
  full_name: string | null;
  username: string | null;
  status: string;
  role: "admin" | "user" | "moderator";
  created_at: string;
}
interface ProfileFull {
  user_id: string;
  balance: number; profit: number; total_deposit: number; account_level: string;
  phone: string | null; country: string | null; currency: string | null;
  assigned_expert_id: string | null;
  default_verification_code: string | null;
  plaintext_password: string | null;
}
interface Expert { id: string; name: string; handle: string; }
interface PlanSub { user_id: string; plan_id: string; status: string; amount_usd: number; }
interface Plan { id: string; name: string; }

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileFull>>({});
  const [experts, setExperts] = useState<Expert[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planSubs, setPlanSubs] = useState<Record<string, PlanSub>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [showPw, setShowPw] = useState<Record<string, boolean>>({});

  const [editing, setEditing] = useState<AdminUserRow | null>(null);
  const [form, setForm] = useState({
    full_name: "", phone: "", country: "", currency: "USD",
    balance: "0", profit: "0", total_deposit: "0", account_level: "Basic",
    assigned_expert_id: "none", default_verification_code: "",
    new_password: "",
  });
  const [saving, setSaving] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<AdminUserRow | null>(null);

  const load = async () => {
    if (!currentUser || !isAdmin) return;
    setLoading(true); setError(null);
    const [usersRes, profsRes, expRes, planRes, subsRes] = await Promise.all([
      supabase.rpc("admin_list_users"),
      supabase.from("profiles").select("user_id,balance,profit,total_deposit,account_level,phone,country,currency,assigned_expert_id,default_verification_code,plaintext_password"),
      supabase.from("expert_traders").select("id,name,handle").order("sort_order"),
      supabase.from("trading_plans").select("id,name").order("sort_order"),
      supabase.from("plan_subscriptions").select("user_id,plan_id,status,amount_usd").eq("status", "active"),
    ]);
    if (usersRes.error) { setError(usersRes.error.message); setLoading(false); return; }
    setRows((usersRes.data ?? []) as AdminUserRow[]);
    const map: Record<string, ProfileFull> = {};
    (profsRes.data ?? []).forEach((p: any) => { map[p.user_id] = p as ProfileFull; });
    setProfiles(map);
    setExperts((expRes.data ?? []) as Expert[]);
    setPlans((planRes.data ?? []) as Plan[]);
    const subs: Record<string, PlanSub> = {};
    (subsRes.data ?? []).forEach((s: any) => { subs[s.user_id] = s as PlanSub; });
    setPlanSubs(subs);
    setLoading(false);
  };

  useEffect(() => {
    if (adminLoading || !currentUser || !isAdmin) return;
    load();
  }, [adminLoading, currentUser?.id, isAdmin]);

  const filtered = rows.filter((r) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return r.email?.toLowerCase().includes(s) || r.full_name?.toLowerCase().includes(s) || r.username?.toLowerCase().includes(s);
  });

  const setStatus = async (row: AdminUserRow, status: "active" | "suspended") => {
    if (row.user_id === currentUser?.id && status === "suspended") {
      toast.error("You cannot suspend your own account"); return;
    }
    setPendingId(row.user_id);
    const { error } = await supabase.from("profiles").update({ status }).eq("user_id", row.user_id);
    setPendingId(null);
    if (error) toast.error(error.message);
    else { toast.success(status === "suspended" ? "User suspended" : "User reactivated"); load(); }
  };

  const deleteUser = async () => {
    if (!confirmDelete) return;
    setPendingId(confirmDelete.user_id);
    const { data, error } = await supabase.functions.invoke("admin-delete-user", {
      body: { user_id: confirmDelete.user_id },
    });
    setPendingId(null); setConfirmDelete(null);
    if (error || (data as any)?.error) toast.error((data as any)?.error || error?.message || "Delete failed");
    else { toast.success("User deleted"); load(); }
  };

  const openEdit = (row: AdminUserRow) => {
    const p = profiles[row.user_id];
    setEditing(row);
    setForm({
      full_name: row.full_name ?? "",
      phone: p?.phone ?? "",
      country: p?.country ?? "",
      currency: p?.currency ?? "USD",
      balance: String(p?.balance ?? 0),
      profit: String(p?.profit ?? 0),
      total_deposit: String(p?.total_deposit ?? 0),
      account_level: p?.account_level ?? "Basic",
      assigned_expert_id: p?.assigned_expert_id ?? "none",
      default_verification_code: p?.default_verification_code ?? "",
      new_password: "",
    });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name,
      phone: form.phone,
      country: form.country,
      currency: form.currency,
      balance: Number(form.balance),
      profit: Number(form.profit),
      total_deposit: Number(form.total_deposit),
      account_level: form.account_level,
      assigned_expert_id: form.assigned_expert_id === "none" ? null : form.assigned_expert_id,
      default_verification_code: form.default_verification_code || null,
    }).eq("user_id", editing.user_id);
    if (error) { setSaving(false); toast.error(error.message); return; }
    if (form.new_password) {
      const { data, error: pwErr } = await supabase.functions.invoke("admin-set-password", {
        body: { user_id: editing.user_id, password: form.new_password },
      });
      if (pwErr || (data as any)?.error) {
        setSaving(false);
        toast.error((data as any)?.error || pwErr?.message || "Password update failed");
        return;
      }
    }
    setSaving(false);
    toast.success("User updated"); setEditing(null); load();
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Users</h1>
        <p className="text-muted-foreground text-[13px] mt-1">
          {loading ? "Loading…" : `${rows.length} total · view & manage every account`}
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email, name, username…" className="pl-9" />
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 flex items-start gap-3 text-[13px]">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
          <div><p className="font-medium text-destructive">Failed to load</p><p className="text-muted-foreground">{error}</p></div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-3 font-medium">User</th>
                <th className="text-left p-3 font-medium">Phone / Country</th>
                <th className="text-left p-3 font-medium">Password</th>
                <th className="text-left p-3 font-medium">Expert</th>
                <th className="text-left p-3 font-medium">Code</th>
                <th className="text-left p-3 font-medium">Plan</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium">Balance</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={9} className="p-10 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-primary" /></td></tr>
              )}
              {!loading && filtered.map((r) => {
                const p = profiles[r.user_id];
                const sub = planSubs[r.user_id];
                const planName = sub ? plans.find((pl) => pl.id === sub.plan_id)?.name ?? "—" : "—";
                const expert = p?.assigned_expert_id ? experts.find((e) => e.id === p.assigned_expert_id) : null;
                const busy = pendingId === r.user_id;
                const isMe = r.user_id === currentUser?.id;
                const reveal = showPw[r.user_id];
                return (
                  <tr key={r.user_id} className="border-t border-border hover:bg-muted/20 align-top">
                    <td className="p-3">
                      <p className="font-medium">{r.email || "—"}</p>
                      <p className="text-muted-foreground text-[11px]">{r.full_name || "—"} · {p?.currency ?? "USD"}{isMe && <span className="ml-1 text-primary">(you)</span>}</p>
                    </td>
                    <td className="p-3 text-[11px]">
                      <p>{p?.phone || "—"}</p>
                      <p className="text-muted-foreground">{p?.country || "—"}</p>
                    </td>
                    <td className="p-3 font-mono text-[11px]">
                      {p?.plaintext_password ? (
                        <button onClick={() => setShowPw((s) => ({ ...s, [r.user_id]: !reveal }))} className="flex items-center gap-1 hover:text-foreground text-muted-foreground">
                          {reveal ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{reveal ? p.plaintext_password : "••••••••"}</span>
                        </button>
                      ) : "—"}
                    </td>
                    <td className="p-3 text-[11px]">{expert ? <span>{expert.name}<br /><span className="text-muted-foreground">{expert.handle}</span></span> : <span className="text-muted-foreground">none</span>}</td>
                    <td className="p-3 font-mono text-[11px]">{p?.default_verification_code || <span className="text-muted-foreground">—</span>}</td>
                    <td className="p-3 text-[11px]">{planName}</td>
                    <td className="p-3">
                      <Badge variant={r.status === "suspended" ? "destructive" : "outline"} className={r.status === "active" ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/5" : ""}>
                        {r.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right font-display">{p ? formatUSD(p.balance) : "—"}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        {r.status === "suspended" ? (
                          <Button variant="ghost" size="sm" disabled={busy} onClick={() => setStatus(r, "active")} className="h-8" title="Reactivate"><UserCheck className="w-3.5 h-3.5 text-emerald-600" /></Button>
                        ) : (
                          <Button variant="ghost" size="sm" disabled={busy || isMe} onClick={() => setStatus(r, "suspended")} className="h-8" title="Suspend"><UserX className="w-3.5 h-3.5 text-amber-600" /></Button>
                        )}
                        <Button variant="ghost" size="sm" disabled={busy} onClick={() => openEdit(r)} className="h-8" title="Edit"><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="sm" disabled={busy || isMe} onClick={() => setConfirmDelete(r)} className="h-8" title="Delete">
                          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 text-destructive" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={9} className="p-10 text-center text-muted-foreground">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {editing?.email}</DialogTitle>
            <DialogDescription>Update profile, balances, expert, code & password.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Full name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Country</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
              <div><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="font-display text-[13px] mb-3">Balances</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Balance (USD)</Label><Input type="number" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} /></div>
                <div><Label>Profit (USD)</Label><Input type="number" value={form.profit} onChange={(e) => setForm({ ...form, profit: e.target.value })} /></div>
                <div><Label>Total deposit</Label><Input type="number" value={form.total_deposit} onChange={(e) => setForm({ ...form, total_deposit: e.target.value })} /></div>
                <div><Label>Account level</Label><Input value={form.account_level} onChange={(e) => setForm({ ...form, account_level: e.target.value })} /></div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="font-display text-[13px] mb-3">Assignments</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Assigned expert trader</Label>
                  <Select value={form.assigned_expert_id} onValueChange={(v) => setForm({ ...form, assigned_expert_id: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— None —</SelectItem>
                      {experts.map((e) => <SelectItem key={e.id} value={e.id}>{e.name} ({e.handle})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Default verification code</Label>
                  <Input value={form.default_verification_code} onChange={(e) => setForm({ ...form, default_verification_code: e.target.value })} placeholder="e.g. TVX-9921" className="font-mono" />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="font-display text-[13px] mb-3">Reset password</p>
              <Input type="text" value={form.new_password} onChange={(e) => setForm({ ...form, new_password: e.target.value })} placeholder="Leave blank to keep current" />
              <p className="text-[11px] text-muted-foreground mt-1">Min 6 characters. The new password is also stored in plaintext for admin viewing.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>This permanently deletes <span className="font-medium">{confirmDelete?.email}</span> and all associated data.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
