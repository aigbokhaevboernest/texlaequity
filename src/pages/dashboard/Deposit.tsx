import { useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Copy, Bitcoin, Landmark, CreditCard, Upload, X, ImageIcon } from "lucide-react";
import { z } from "zod";
import { validateFile, uploadToBucket, IMAGE_TYPES } from "@/lib/uploads";
import { useCurrency } from "@/hooks/useCurrency";

const wallets: Record<string, string> = {
  BTC: "bc1q9h6tq79q3dx4n0vftk2sv3y8a8sjxr7c8tqd23",
  ETH: "0x3F9aE2b1C5D0e8a3F2D1e4B9C7a1e2f5b6c8d9e0",
  USDT: "TXyZz2u5K1pQwErT7uIop8Dc4hjn3lkPq",
};

const amountSchema = z.coerce.number().positive("Amount must be positive").max(1_000_000, "Too large");

export default function Deposit() {
  const { user } = useAuth();
  const { format, currency } = useCurrency();
  const [submitting, setSubmitting] = useState(false);
  const [crypto, setCrypto] = useState({ coin: "BTC", amount: "" });
  const [bank, setBank] = useState({ amount: "", reference: "" });
  const [card, setCard] = useState({ amount: "", number: "", name: "", exp: "", cvc: "" });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const proofRef = useRef<HTMLInputElement>(null);

  const onPickProof = (f: File | null) => {
    if (!f) { setProofFile(null); setProofPreview(null); return; }
    const err = validateFile(f, { types: IMAGE_TYPES });
    if (err) { toast.error(err); return; }
    setProofFile(f);
    setProofPreview(URL.createObjectURL(f));
  };

  const copy = (txt: string) => { navigator.clipboard.writeText(txt); toast.success("Copied"); };

  const submit = async (method: string, amt: string, extra: Record<string, unknown>, opts?: { requireProof?: boolean }) => {
    if (!user) return;
    const a = amountSchema.safeParse(amt);
    if (!a.success) { toast.error(a.error.errors[0].message); return; }
    if (opts?.requireProof && !proofFile) { toast.error("Please attach proof of payment"); return; }
    setSubmitting(true);
    let proof_url: string | null = null;
    if (proofFile) {
      setUploadingProof(true);
      const res = await uploadToBucket("deposit-proofs", user.id, proofFile);
      setUploadingProof(false);
      if (res.error) { setSubmitting(false); toast.error(res.error); return; }
      proof_url = res.path;
    }
    const { error } = await supabase.from("transactions").insert({
      user_id: user.id, type: "deposit", method, amount_usd: a.data, status: "pending",
      ...(proof_url ? { proof_url } : {}), ...extra,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Deposit request submitted.");
    setCrypto({ coin: "BTC", amount: "" });
    setBank({ amount: "", reference: "" });
    setCard({ amount: "", number: "", name: "", exp: "", cvc: "" });
    setProofFile(null); setProofPreview(null);
  };

  const ProofUploader = ({ required }: { required?: boolean }) => (
    <div>
      <Label>Proof of payment {required && <span className="text-primary">*</span>}</Label>
      <input
        ref={proofRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onPickProof(e.target.files?.[0] ?? null)}
      />
      {proofPreview ? (
        <div className="mt-1.5 relative rounded-xl border border-border overflow-hidden bg-muted">
          <img src={proofPreview} alt="Proof preview" className="w-full max-h-64 object-contain" />
          <button
            type="button"
            onClick={() => onPickProof(null)}
            className="absolute top-2 right-2 bg-background/90 backdrop-blur rounded-full p-1.5 hover:bg-background"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="px-3 py-2 text-[12px] text-muted-foreground bg-background/60 backdrop-blur flex items-center gap-2">
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="truncate">{proofFile?.name}</span>
            <span className="ml-auto">{((proofFile?.size ?? 0) / 1024).toFixed(0)} KB</span>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => proofRef.current?.click()}
          className="mt-1.5 w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card py-6 text-[13px] text-muted-foreground hover:border-foreground/40 hover:text-foreground transition"
        >
          <Upload className="w-4 h-4" />
          Upload screenshot or receipt (JPG/PNG)
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="label-mono text-muted-foreground mb-2">Fund account</p>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Deposit</h1>
        <p className="text-muted-foreground text-[14px] mt-1">Choose a method. Funds reflect after confirmation.</p>
      </div>

      <Tabs defaultValue="crypto" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="crypto"><Bitcoin className="w-3.5 h-3.5 mr-1.5" /> Crypto</TabsTrigger>
          <TabsTrigger value="bank"><Landmark className="w-3.5 h-3.5 mr-1.5" /> Bank</TabsTrigger>
          <TabsTrigger value="card"><CreditCard className="w-3.5 h-3.5 mr-1.5" /> Card</TabsTrigger>
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
              <Label>Send to wallet address</Label>
              <div className="flex gap-2">
                <Input readOnly value={wallets[crypto.coin]} className="font-mono text-xs" />
                <Button type="button" variant="outline" size="icon" onClick={() => copy(wallets[crypto.coin])}>
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Network: {crypto.coin === "USDT" ? "TRC-20" : crypto.coin}.</p>
            </div>
            <ProofUploader required />
            <Button disabled={submitting || uploadingProof} onClick={() => submit(`Crypto ${crypto.coin}`, crypto.amount, { wallet_address: wallets[crypto.coin] }, { requireProof: true })} className="w-full">
              {submitting || uploadingProof ? <Loader2 className="w-4 h-4 animate-spin" /> : "I've sent the deposit"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="bank" className="mt-6">
          <div className="rounded-2xl border border-border bg-card p-6 max-w-2xl space-y-5">
            <div className="rounded-xl bg-muted p-4 text-[13px] space-y-1">
              <p><span className="text-muted-foreground">Bank:</span> JPMorgan Chase</p>
              <p><span className="text-muted-foreground">Account name:</span> TeslaVest Holdings LLC</p>
              <p><span className="text-muted-foreground">Account no:</span> 4421 0098 7733</p>
              <p><span className="text-muted-foreground">Routing:</span> 021000021</p>
              <p><span className="text-muted-foreground">SWIFT:</span> CHASUS33</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Amount (USD)</Label>
                <Input value={bank.amount} onChange={(e) => setBank({ ...bank, amount: e.target.value })} placeholder="1000" />
                {bank.amount && !isNaN(Number(bank.amount)) && currency !== "USD" && (
                  <p className="text-[11px] text-muted-foreground mt-1">≈ {format(Number(bank.amount))}</p>
                )}
              </div>
              <div>
                <Label>Transfer reference</Label>
                <Input value={bank.reference} onChange={(e) => setBank({ ...bank, reference: e.target.value })} placeholder="REF#..." />
              </div>
            </div>
            <ProofUploader required />
            <Button disabled={submitting || uploadingProof} onClick={() => submit("Bank transfer", bank.amount, { bank_details: { reference: bank.reference } }, { requireProof: true })} className="w-full">
              {submitting || uploadingProof ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit deposit"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="card" className="mt-6">
          <div className="rounded-2xl border border-border bg-card p-6 max-w-2xl space-y-5">
            <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-3 text-[12px] text-yellow-800">
              Card processor in sandbox mode. No real charges.
            </div>
            <div><Label>Cardholder name</Label><Input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} /></div>
            <div><Label>Card number</Label><Input value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} placeholder="4242 4242 4242 4242" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Expiry</Label><Input value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} placeholder="MM/YY" /></div>
              <div><Label>CVC</Label><Input value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} placeholder="123" /></div>
              <div><Label>Amount</Label><Input value={card.amount} onChange={(e) => setCard({ ...card, amount: e.target.value })} placeholder="500" /></div>
            </div>
            <Button disabled={submitting} onClick={() => submit("Card", card.amount, { card_last4: card.number.slice(-4) })} className="w-full">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pay & deposit"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}