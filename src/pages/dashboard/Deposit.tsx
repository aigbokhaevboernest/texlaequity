import { useRef, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";
import { Loader2, Copy, Upload, X, ImageIcon } from "lucide-react";
import { z } from "zod";
import { validateFile, uploadToBucket, IMAGE_TYPES } from "@/lib/uploads";

const wallets: Record<string, string> = {
  BTC: "bc1q4h883jgnjaeq3dxzzakgxwnwt2hu6dxz92mg8a",
  ETH: "0xFde3363Bb1a94365493bCEAC2D1B780de35d843c",
  USDT: "0xFde3363Bb1a94365493bCEAC2D1B780de35d843c",
};

const amountSchema = z.coerce.number().positive("Amount must be positive");

export default function Deposit() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [crypto, setCrypto] = useState({ coin: "BTC", amount: "" });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const proofRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const amountParam = searchParams.get("amount");
    if (amountParam) {
      setCrypto((c) => ({ ...c, amount: amountParam }));
    }
  }, [searchParams]);

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

      <div className="rounded-2xl border border-border bg-card p-6 max-w-2xl space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="coin">Coin</Label>
            <select
              id="coin"
              value={crypto.coin}
              onChange={(e) => setCrypto({ ...crypto, coin: e.target.value })}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
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
    </div>
  );
}
