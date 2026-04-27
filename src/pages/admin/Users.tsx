import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
import { toast } from "sonner";
import { formatUSD } from "@/lib/cars";
import {
  Search, Pencil, Loader2, ShieldCheck, ShieldOff,
  UserX, UserCheck, Trash2, AlertCircle,
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

interface ProfileBalances {
  balance: number;
  profit: number;
  total_deposit: number;
  account_level: string;
  phone: string | null;
  country: string | null;
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [balances, setBalances] = useState<Record<string, ProfileBalances>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const [editing, setEditing] = useState<AdminUserRow | null>(null);
  const [form, setForm] = useState({
    balance: "0", profit: "0", total_deposit: "0", account_level: "Basic",
  });
  const [saving, setSaving] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<AdminUserRow | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const [{ data: usersData, error: usersErr }, { data: balData }] =
      await Promise.all([
        supabase.rpc("admin_list_users"),
        supabase.from("profiles").select(
          "user_id, balance, profit, total_deposit, account_level, phone, country",
        ),
      ]);

    if (usersErr) {
      setError(usersErr.message);
      setLoading(false);
      return;
    }
    setRows((usersData ?? []) as AdminUserRow[]);
    const map: Record<string, ProfileBalances> = {};
    (balData ?? []).forEach((b: any) => {
      map[b.user_id] = {
        balance: Number(b.balance), profit: Number(b.profit),
        total_deposit: Number(b.total_deposit),
        account_level: b.account_level, phone: b.phone, country: b.country,
      };
    });
    setBalances(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return (
      r.email?.toLowerCase().includes(s) ||
      r.full_name?.toLowerCase().includes(s) ||
      r.username?.toLowerCase().includes(s)
    );
  });

  const toggleRole = async (row: AdminUserRow) => {
    if (row.user_id === currentUser?.id) {
      toast.error("You cannot change your own admin role");
      return;
    }
    setPendingId(row.user_id);
    const newRole = row.role === "admin" ? "user" : "admin";
    const { error } = await supabase.rpc("admin_set_role", {
      _target_user: row.user_id, _role: newRole,
    });
    setPendingId(null);
    if (error) toast.error(error.message);
    else {
      toast.success(`Role changed to ${newRole}`);
      load();
    }
  };

  const setStatus = async (row: AdminUserRow, status: "active" | "suspended") => {
    if (row.user_id === currentUser?.id && status === "suspended") {
      toast.error("You cannot suspend your own account");
      return;
    }
    setPendingId(row.user_id);
    const { error } = await supabase
      .from("profiles")
      .update({ status })
      .eq("user_id", row.user_id);
    setPendingId(null);
    if (error) toast.error(error.message);
    else {
      toast.success(status === "suspended" ? "User suspended" : "User reactivated");
      load();
    }
  };

  const deleteUser = async () => {
    if (!confirmDelete) return;
    setPendingId(confirmDelete.user_id);
    const { data, error } = await supabase.functions.invoke("admin-delete-user", {
      body: { user_id: confirmDelete.user_id },
    });
    setPendingId(null);
    setConfirmDelete(null);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || "Delete failed");
    } else {
      toast.success("User deleted");
      load();
    }
  };

  const openEdit = (row: AdminUserRow) => {
    const b = balances[row.user_id];
    setEditing(row);
    setForm({
      balance: String(b?.balance ?? 0),
      profit: String(b?.profit ?? 0),
      total_deposit: String(b?.total_deposit ?? 0),
      account_level: b?.account_level ?? "Basic",
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
    else {
      toast.success("User updated");
      setEditing(null);
      load();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Users</h1>
        <p className="text-muted-foreground text-[13px] mt-1">
          {loading ? "Loading…" : `${rows.length} total · manage roles, status & balances`}
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search email, name, username…"
          className="pl-9"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 flex items-start gap-3 text-[13px]">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
          <div>
            <p className="font-medium text-destructive">Failed to load users</p>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-3 font-medium">Email / Name</th>
                <th className="text-left p-3 font-medium">Role</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium">Balance</th>
                <th className="text-left p-3 font-medium">Joined</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="p-10 text-center">
                    <Loader2 className="w-5 h-5 animate-spin inline text-primary" />
                  </td>
                </tr>
              )}
              {!loading && filtered.map((r) => {
                const b = balances[r.user_id];
                const busy = pendingId === r.user_id;
                const isMe = r.user_id === currentUser?.id;
                return (
                  <tr key={r.user_id} className="border-t border-border hover:bg-muted/20">
                    <td className="p-3">
                      <p className="font-medium">{r.email || "—"}</p>
                      <p className="text-muted-foreground text-[11px]">
                        {r.full_name || "—"} {r.username && `· @${r.username}`}
                        {isMe && <span className="ml-1 text-primary">(you)</span>}
                      </p>
                    </td>
                    <td className="p-3">
                      <Badge variant={r.role === "admin" ? "default" : "secondary"}>
                        {r.role}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={r.status === "suspended" ? "destructive" : "outline"}
                        className={r.status === "active"
                          ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/5"
                          : ""}
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right font-display">
                      {b ? formatUSD(b.balance) : "—"}
                    </td>
                    <td className="p-3 text-muted-foreground text-[12px]">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost" size="sm" disabled={busy || isMe}
                          onClick={() => toggleRole(r)} className="h-8"
                          title={r.role === "admin" ? "Demote to user" : "Promote to admin"}
                        >
                          {r.role === "admin"
                            ? <ShieldOff className="w-3.5 h-3.5" />
                            : <ShieldCheck className="w-3.5 h-3.5" />}
                        </Button>
                        {r.status === "suspended" ? (
                          <Button
                            variant="ghost" size="sm" disabled={busy}
                            onClick={() => setStatus(r, "active")} className="h-8"
                            title="Reactivate"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost" size="sm" disabled={busy || isMe}
                            onClick={() => setStatus(r, "suspended")} className="h-8"
                            title="Suspend"
                          >
                            <UserX className="w-3.5 h-3.5 text-amber-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost" size="sm" disabled={busy} onClick={() => openEdit(r)}
                          className="h-8" title="Edit balances"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="sm" disabled={busy || isMe}
                          onClick={() => setConfirmDelete(r)} className="h-8"
                          title="Delete user"
                        >
                          {busy
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5 text-destructive" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit balances dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editing?.email}</DialogTitle>
            <DialogDescription>
              Update wallet balances and account tier.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Balance (USD)</Label>
              <Input type="number" value={form.balance}
                onChange={(e) => setForm({ ...form, balance: e.target.value })} />
            </div>
            <div>
              <Label>Profit (USD)</Label>
              <Input type="number" value={form.profit}
                onChange={(e) => setForm({ ...form, profit: e.target.value })} />
            </div>
            <div>
              <Label>Total deposit (USD)</Label>
              <Input type="number" value={form.total_deposit}
                onChange={(e) => setForm({ ...form, total_deposit: e.target.value })} />
            </div>
            <div>
              <Label>Account level</Label>
              <Input value={form.account_level}
                onChange={(e) => setForm({ ...form, account_level: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes <span className="font-medium">{confirmDelete?.email}</span>,
              their profile and all role assignments. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
