import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, TrendingUp, Award, Check, BadgeCheck, Loader2 } from "lucide-react";
import { HARDCODED_EXPERTS } from "@/lib/experts";

type Expert = {
  id: string;
  name: string;
  handle: string | null;
  specialty: string | null;
  avatar_url: string | null;
  win_rate: number | null;
  total_profit_usd: number | null;
  followers: number | null;
  min_copy_amount: number | null;
  isStatic?: boolean;
};

// TODO: replace with this project's real admin notification address.
const ADMIN_EMAIL = "admin@texlaequity.com";

const PLAN_OPTIONS = [
  { amount: 1500,  label: "Regular Plan" },
  { amount: 5000,  label: "Silver Plan" },
  { amount: 9500,  label: "Advanced" },
  { amount: 12600, label: "Premium" },
  { amount: 21300, label: "Elite" },
  { amount: 26800, label: "Ultra" },
  { amount: 38950, label: "VIP" },
  { amount: 47200, label: "Ultimate" },
];

const initialsOf = (name: string) =>
  name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

// Module-level cache so revisiting this page does not re-fetch from scratch.
let cache: { experts: Expert[]; assignedExpertId: string | null } | null = null;

export default function CopyExperts() {
  const { user } = useAuth();
  const { format } = useCurrency();
  const navigate = useNavigate();
  const [experts, setExperts] = useState<Expert[]>(cache?.experts ?? []);
  const [assignedExpertId, setAssignedExpertId] = useState<string | null>(cache?.assignedExpertId ?? null);
  const [loading, setLoading] = useState(!cache);
  const [modalExpert, setModalExpert] = useState<Expert | null>(null);
  const [planAmount, setPlanAmount] = useState<string>("");
  const [recurring, setRecurring] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [{ data: list }, profRes] = await Promise.all([
        supabase.from("expert_traders").select("*").eq("is_active", true).order("sort_order"),
        user
          ? supabase.from("profiles").select("assigned_expert_id").eq("user_id", user.id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      if (cancelled) return;

      const dbRows: Expert[] = ((list as Expert[] | null) ?? []).map((d) => ({ ...d, isStatic: false }));
      const dbIds = new Set(dbRows.map((d) => d.id));
      const fromStatic: Expert[] = HARDCODED_EXPERTS
        .filter((s) => !dbIds.has(s.id))
        .map((s) => ({
          id: s.id, name: s.name, handle: s.handle, specialty: s.specialty, avatar_url: s.avatar_url,
          win_rate: s.win_rate, total_profit_usd: s.total_profit_usd, followers: s.followers,
          min_copy_amount: s.min_copy_amount, isStatic: true,
        }));

      // Admin-added (DB) experts at the top, hardcoded at the bottom.
      const merged = [...dbRows, ...fromStatic];
      const aid = (profRes?.data as { assigned_expert_id?: string } | null)?.assigned_expert_id ?? null;
      cache = { experts: merged, assignedExpertId: aid };
      setExperts(merged);
      setAssignedExpertId(aid);
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [user?.id]);

  const openModal = (e: Expert) => {
    setModalExpert(e);
    setPlanAmount("");
    setRecurring(false);
  };

  const completeSubscription = async () => {
    if (!user || !modalExpert) return;
    const amt = Number(planAmount);
    if (!amt) { toast.warning("Please choose a plan amount"); return; }

    setSubmitting(true);
    const selected = PLAN_OPTIONS.find((p) => p.amount === amt);
    const planLabel = selected?.label ?? "";

    // Persist the request so it shows up on the admin "Copy-Expert Requests" panel.
    // trader_id is stored as text, so this works for both DB experts and hardcoded ones.
    const { error: insertError } = await supabase.from("copy_subscriptions").insert({
      user_id: user.id,
      trader_id: modalExpert.id,
      status: "pending",
      plan_amount: amt,
      plan_name: planLabel,
      recurring_monthly: recurring ? "true" : "false",
    });

    if (insertError) {
      setSubmitting(false);
      toast.error(insertError.message);
      return;
    }

    // Send notification emails (fire and forget).
    const userEmail = user.email ?? "";
    const userHtml = `
      <p>Hi,</p>
      <p>You have requested to subscribe to <strong>${modalExpert.name}</strong>.</p>
      <p><strong>Plan:</strong> ${planLabel} – ${amt.toLocaleString()}</p>
      <p>Please complete your deposit to activate this subscription.</p>
      <p>Expert: ${modalExpert.name} ${modalExpert.handle ?? ""}<br/>Specialty: ${modalExpert.specialty ?? "—"}</p>
      <p>Recurring: ${recurring ? "Yes (monthly)" : "No"}</p>
    `;
    const adminHtml = `
      <p>${userEmail || "A user"} has requested to copy <strong>${modalExpert.name}</strong> – ${planLabel} (${amt.toLocaleString()}).</p>
      <p>Awaiting deposit confirmation.</p>
    `;
    void supabase.functions.invoke("send-email", {
      body: { to: userEmail, subject: `Subscription request: ${modalExpert.name}`, html: userHtml },
    }).catch(() => {});
    void supabase.functions.invoke("send-email", {
      body: { to: ADMIN_EMAIL, subject: `Copy request from ${userEmail || "user"}`, html: adminHtml },
    }).catch(() => {});

    setSubmitting(false);
    setModalExpert(null);
    toast.success("Request submitted. Check your email for deposit instructions.");
    navigate(`/dashboard/deposit?amount=${amt}`);
  };

  // Render immediately when we have data cached or once first load completes — no full-page spinner on revisits.
  return (
    <div className="space-y-6">
      <div>
        <p className="label-mono text-muted-foreground mb-2">Mirror top traders</p>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Copy Experts</h1>
        <p className="text-muted-foreground text-[14px] mt-1">
          Browse our verified experts and start copying their trades.
        </p>
      </div>

      {loading && experts.length === 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      )}

      {experts.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {experts.map((e) => {
            const isAssigned = assignedExpertId === e.id;
            return (
              <Card key={e.id} className={`rounded-2xl p-5 flex flex-col ${isAssigned ? "border-emerald-500/40" : "border-border"}`}>
                <div className="flex items-center gap-3 mb-4">
                  {e.avatar_url ? (
                    <img src={e.avatar_url} alt={e.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground font-display text-base font-semibold shrink-0">
                      {initialsOf(e.name)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-display text-[15px] font-medium text-foreground truncate">{e.name}</p>
                      <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{e.handle}</p>
                    {e.specialty && <p className="text-[11px] text-primary truncate">{e.specialty}</p>}
                  </div>
                </div>

                {isAssigned && (
                  <div className="mb-3 inline-flex items-center gap-1.5 self-start rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-semibold">
                    <Check className="w-3 h-3" /> You are copying {e.name}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <StatBox icon={Award}      label="Win"     value={`${e.win_rate ?? 0}%`} />
                  <StatBox icon={TrendingUp} label="Profit"  value={format(Number(e.total_profit_usd ?? 0))} />
                  <StatBox icon={Users}      label="Copiers" value={(e.followers ?? 0).toLocaleString()} />
                </div>

                <p className="text-[11px] text-muted-foreground mb-4">
                  Min copy: <span className="text-foreground font-medium">{format(Number(e.min_copy_amount ?? 0))}</span>
                </p>

                <Button className="mt-auto w-full" onClick={() => openModal(e)}>
                  <TrendingUp className="h-4 w-4" />
                  Copy expert
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!modalExpert} onOpenChange={(o) => !o && setModalExpert(null)}>
        <DialogContent className="bg-white text-slate-900 rounded-2xl border-0 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">
              Subscribe to {modalExpert?.name}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Subscribe amount and plan
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-slate-700 text-sm">Plan</Label>
              <select
                value={planAmount}
                onChange={(e) => setPlanAmount(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-300 bg-white text-slate-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— Choose plan amount —</option>
                {PLAN_OPTIONS.map((p) => (
                  <option key={p.amount} value={p.amount}>
                    {p.amount.toLocaleString()} – {p.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <Checkbox checked={recurring} onCheckedChange={(c) => setRecurring(!!c)} />
              Recurring monthly
            </label>
          </div>

          <DialogFooter className="flex-row gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setModalExpert(null)}
              className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-100">
              Cancel
            </Button>
            <Button onClick={completeSubscription} disabled={submitting}
              className="flex-1">
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Complete subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const StatBox = ({ icon: Icon, label, value }: { icon: typeof TrendingUp; label: string; value: string }) => (
  <div className="rounded-lg bg-muted/40 p-2.5">
    <p className="text-[9px] uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-0.5">
      <Icon className="w-2.5 h-2.5" /> {label}
    </p>
    <p className="font-display font-medium text-[12px] truncate text-foreground">{value}</p>
  </div>
);
