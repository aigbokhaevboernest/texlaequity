import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Search, KeyRound, Loader2, Copy, Sparkles, Trash2, ShieldCheck, Receipt, Percent,
} from "lucide-react";

type CodeType = "auth" | "cot" | "tax";

interface UserRow {
  user_id: string;
  email: string | null;
  full_name: string | null;
  username: string | null;
}

interface AccountCode {
  id: string;
  user_id: string;
  code_type: CodeType;
  code: string;
  verified: boolean;
  updated_at: string;
}

const TYPE_META: Record<CodeType, { label: string; icon: typeof KeyRound; help: string }> = {
  auth: { label: "Authentication", icon: ShieldCheck, help: "Default withdrawal authorization code." },
  cot:  { label: "COT (Cost of Transfer)", icon: Percent, help: "Required to cover transfer cost." },
  tax:  { label: "Tax", icon: Receipt, help: "Required to clear withholding tax." },
};

const TYPES: CodeType[] = ["auth", "cot", "tax"];

const randomCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export default function AdminAccountCodes() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [codesByUser, setCodesByUser] = useState<Record<string, AccountCode[]>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [drafts, setDrafts] = useState<Record<CodeType, string>>({ auth: "", cot: "", tax: "" });
  const [enabled, setEnabled] = useState<Record<CodeType, boolean>>({ auth: true, cot: false, tax: false });
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: usersData, error: usersErr }, { data: codesData }] = await Promise.all([
      supabase.rpc("admin_list_users"),
      supabase.from("account_withdrawal_codes").select("*").order("updated_at", { ascending: false }),
    ]);
    if (usersErr) {
      toast.error(usersErr.message);
      setLoading(false);
      return;
    }
    setUsers((usersData ?? []) as UserRow[]);
    const map: Record<string, AccountCode[]> = {};
    (codesData ?? []).forEach((c: any) => {
      (map[c.user_id] ||= []).push(c as AccountCode);
    });
    setCodesByUser(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter((u) =>
      u.email?.toLowerCase().includes(s) ||
      u.full_name?.toLowerCase().includes(s) ||
      u.username?.toLowerCase().includes(s),
    );
  }, [users, q]);

  const openAssign = (u: UserRow) => {
    const existing = codesByUser[u.user_id] ?? [];
    const find = (t: CodeType) => existing.find((c) => c.code_type === t)?.code ?? "";
    setSelected(u);
    setDrafts({ auth: find("auth"), cot: find("cot"), tax: find("tax") });
    setEnabled({
      auth: !!find("auth") || true, // auth is the default
      cot: !!find("cot"),
      tax: !!find("tax"),
    });
  };

  const saveCodes = async () => {
    if (!selected) return;
    setSaving(true);
    const rows = TYPES
      .filter((t) => enabled[t])
      .map((t) => ({
        user_id: selected.user_id,
        code_type: t,
        code: (drafts[t] || randomCode()).toUpperCase(),
        verified: false,
      }));
    if (rows.length === 0) {
      setSaving(false);
      toast.error("Enable at least one code type.");
      return;
    }
    // Upsert each (unique on user_id+code_type)
    const { error } = await supabase
      .from("account_withdrawal_codes")
      .upsert(rows, { onConflict: "user_id,code_type" });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Codes assigned");
    setSelected(null);
    load();
  };

  const removeCode = async (c: AccountCode) => {
    setBusyId(c.id);
    const { error } = await supabase.from("account_withdrawal_codes").delete().eq("id", c.id);
    setBusyId(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`${TYPE_META[c.code_type].label} code removed`);
    load();
  };

  const copy = (v: string) => { navigator.clipboard.writeText(v); toast.success("Copied"); };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Withdrawal Codes</h1>
        <p className="text-muted-foreground text-[13px] mt-1">
          Assign account-level codes (Authentication, COT, Tax). Required during the user's withdrawal in order: Auth → COT → Tax.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email, name, username…" className="pl-9" />
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">No users found</div>
        ) : filtered.map((u) => {
          const codes = codesByUser[u.user_id] ?? [];
          return (
            <div key={u.user_id} className="p-4 border-b border-border last:border-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="font-medium text-[14px]">{u.email || "—"}</p>
                  <p className="text-[12px] text-muted-foreground">
                    {u.full_name || "—"}{u.username ? ` · @${u.username}` : ""}
                  </p>
                </div>
                <Button size="sm" onClick={() => openAssign(u)} className="h-8">
                  <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                  {codes.length ? "Manage codes" : "Assign codes"}
                </Button>
              </div>

              {codes.length > 0 && (
                <div className="mt-3 grid sm:grid-cols-3 gap-2">
                  {TYPES.map((t) => {
                    const c = codes.find((x) => x.code_type === t);
                    const Meta = TYPE_META[t];
                    if (!c) {
                      return (
                        <div key={t} className="rounded-xl border border-dashed border-border p-3 text-[12px] text-muted-foreground">
                          <div className="flex items-center gap-1.5 mb-1"><Meta.icon className="w-3.5 h-3.5" /> {Meta.label}</div>
                          <span className="text-[11px]">Not assigned</span>
                        </div>
                      );
                    }
                    return (
                      <div key={t} className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[12px] font-medium">
                            <Meta.icon className="w-3.5 h-3.5" /> {Meta.label}
                          </div>
                          {c.verified && (
                            <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-500/5 text-[10px]">
                              verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <code className="px-2.5 py-1 rounded-md bg-background border border-border font-mono text-[13px] tracking-widest">
                            {c.code}
                          </code>
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => copy(c.code)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm" variant="ghost" className="h-7 px-2 text-destructive"
                            disabled={busyId === c.id}
                            onClick={() => removeCode(c)}
                          >
                            {busyId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Assign / manage dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign codes</DialogTitle>
            <DialogDescription>{selected?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {TYPES.map((t) => {
              const Meta = TYPE_META[t];
              return (
                <div key={t} className={`rounded-xl border p-3 ${enabled[t] ? "border-border bg-muted/30" : "border-dashed border-border"}`}>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="flex items-center gap-2 text-[13px] font-medium">
                      <Meta.icon className="w-4 h-4" /> {Meta.label}
                    </span>
                    <input
                      type="checkbox"
                      checked={enabled[t]}
                      onChange={(e) => setEnabled({ ...enabled, [t]: e.target.checked })}
                      className="h-4 w-4 accent-primary"
                    />
                  </label>
                  <p className="text-[11px] text-muted-foreground mt-1">{Meta.help}</p>
                  {enabled[t] && (
                    <div className="mt-2 flex items-center gap-2">
                      <Input
                        value={drafts[t]}
                        onChange={(e) => setDrafts({ ...drafts, [t]: e.target.value.toUpperCase() })}
                        placeholder="Custom code (or auto-generate)"
                        className="h-8 font-mono tracking-widest"
                        maxLength={12}
                      />
                      <Button
                        size="sm" variant="outline" type="button" className="h-8"
                        onClick={() => setDrafts({ ...drafts, [t]: randomCode() })}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={saveCodes} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save codes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
