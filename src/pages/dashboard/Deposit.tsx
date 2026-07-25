import { useRef, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";
import { Loader2, Copy, Upload, X, ImageIcon, Landmark, Bitcoin } from "lucide-react";
import { z } from "zod";
import { validateFile, uploadToBucket, IMAGE_TYPES } from "@/lib/uploads";

const wallets: Record<string, string> = {
  BTC: "bc1q4h883jgnjaeq3dxzzakgxwnwt2hu6dxz92mg8a",
  ETH: "0xFde3363Bb1a94365493bCEAC2D1B780de35d843c",
  USDT: "TBZneYAbtDZop9Q4TmKM9RvuyAH7WEtYf6",
};

const amountSchema = z.coerce.number().positive("Amount must be positive");

type Bank = {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  routing_number: string | null;
  swift_code: string | null;
  is_active: boolean;
};

export default function Deposit() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [crypto, setCrypto] = useState({ coin: "BTC", amount: "" });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const proofRef = useRef<HTMLInputElement>(null);

  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [tab, setTab] = useState<"crypto" | "bank">("crypto");
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [bankAmount, setBankAmount] = useState("");
  const [bankProofFile, setBankProofFile] = useState<File | null>(null);
  const [bankProofPreview, setBankProofPreview] = useState<string | null>(null);
  const [uploadingBankProof, setUploadingBankProof] = useState(false);
  const bankProofRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const amountParam = searchParams.get("amount");
    if (amountParam) {
      setCrypto((c) => ({ ...c, amount: amountParam }));
      setBankAmount(amountParam);
    }
  }, [searchParams]);

  useEffect(() => {
    supabase
      .from("bank_deposit_info")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const active = (data as Bank[] | null) ?? [];
        setBanks(active);
        if (active.length > 0) setSelectedBankId(active[0].id);
        setBanksLoading(false);
      });
  }, []);

  const onPickProof = (f: File | null) => {
    if (!f) { setProofFile(null); setProofPreview(null); return; }
    const err = validateFile(f, { types: IMAGE_TYPES });
    if (err) { toast.error(err); return; }
    setProofFile(f);
    setProofPreview(URL.createObjectURL(f));
  };

  const onPickBankProof = (f: File | null) => {
    if (!f) { setBankProofFile(null); setBankProofPreview(null); return; }
    const err = validateFile(f, { types: IMAGE_TYPES });
    if (err) { toast.error(err); return; }
    setBankProofFile(f);
    setBankProofPreview(URL.createObjectURL(f));
  };

  const copy = (txt: string) => { navigator.clipboard.writeText(txt); toast.success("Copied"); };

  const submit = async (method: string, amt: string, extra: Record<string, unknown>, opts?: { requireProof?: boolean; file?: File | null }) => {
    if (!user) return;
    const a = amountSchema.safeParse(amt);
    if (!a.success) { toast.error(a.error.errors[0].message); return; }
    const file = opts?.file ?? null;
    if (opts?.requireProof && !file) { toast.error("Please attach proof of payment"); return; }
    setSubmitting(true);
    let proof_url: string | null = null;
    if (file) {
      setUploadingProof(true);
      const res = await uploadToBucket("deposit-proofs", user.id, file);
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
    return true;
  };

  const submitCrypto = async () => {
    const ok = await submit(`Crypto ${crypto.coin}`, crypto.amount, { wallet_address: wallets[crypto.coin] }, { requireProof: true, file: proofFile });
    if (ok) {
      setCrypto({ coin: "BTC", amount: "" });
      setProofFile(null); setProofPreview(null);
    }
  };

  const submitBank = async () => {
    const bank = banks.find((b) => b.id === selectedBankId);
    if (!bank) { toast.error("Select a bank"); return; }
    const ok = await submit(
      `Bank Transfer - ${bank.bank_name}`,
      bankAmount,
      { bank_name: bank.bank_name, account_number: bank.account_number, account_name: bank.account_name },
      { requireProof: true, file: bankProofFile }
    );
    if (ok) {
      setBankAmount("");
      setBankProofFile(null); setBankProofPreview(null);
    }
  };

  const ProofUploader = ({
    required, preview, fileName, fileSize, inputRef, onPick,
  }: {
    required?: boolean;
    preview: string | null;
    fileName?: string;
    fileSize?: number;
    inputRef: React.RefObject<HTMLInputElement>;
    onPick: (f: File | null) => void;
  }) => (
    <div>
      <Label>Proof of payment {required && <span className="text-primary">*</span>}</Label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
      {preview ? (
        <div className="mt-1.5 relative rounded-xl border border-border overflow-hidden bg-muted">
          <img src={preview} alt="Proof preview" className="w-full max-h-64 object-contain" />
          <button
            type="button"
            onClick={() => onPick(null)}
            className="absolute top-2 right-2 bg-background/90 backdrop-blur rounded-full p-1.5 hover:bg-background"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="px-3 py-2 text-[12px] text-muted-foreground bg-background/60 backdrop-blur flex items-center gap-2">
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="truncate">{fileName}</span>
            <span className="ml-auto">{((fileSize ?? 0) / 1024).toFixed(0)} KB</span>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-1.5 w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card py-6 text-[13px] text-muted-foreground hover:border-foreground/40 hover:text-foreground transition"
        >
          <Upload className="w-4 h-4" />
          Upload screenshot or receipt (JPG/PNG)
        </button>
      )}
    </div>
  );

  const selectedBank = banks.find((b) => b.id === selectedBankId);

  return (
    <div className="space-y-6">
      <div>
        <p className="label-mono text-muted-foreground mb-2">Fund account</p>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Deposit</h1>
        <p className="text-muted-foreground text-[14px] mt-1">Choose a method. Funds reflect after confirmation.</p>
      </div>

      {/* Tabs — Bank only shows if admin has an active bank configured */}
      {!banksLoading && banks.length > 0 && (
        <div className="flex gap-2 max-w-2xl">
          <button
            onClick={() => setTab("crypto")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-[13px] font-medium transition-all ${
              tab === "crypto" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"
            }`}
          >
            <Bitcoin className="w-4 h-4" /> Crypto
          </button>
          <button
            onClick={() => setTab("bank")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-[13px] font-medium transition-all ${
              tab === "bank" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"
            }`}
          >
            <Landmark className="w-4 h-4" /> Bank Transfer
          </button>
        </div>
      )}

      {tab === "crypto" && (
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
          <ProofUploader
            required
            preview={proofPreview}
            fileName={proofFile?.name}
            fileSize={proofFile?.size}
            inputRef={proofRef}
            onPick={onPickProof}
          />
          <Button disabled={submitting || uploadingProof} onClick={submitCrypto} className="w-full">
            {submitting || uploadingProof ? <Loader2 className="w-4 h-4 animate-spin" /> : "I've sent the deposit"}
          </Button>
        </div>
      )}

      {tab === "bank" && selectedBank && (
        <div className="rounded-2xl border border-border bg-card p-6 max-w-2xl space-y-5">
          {banks.length > 1 && (
            <div>
              <Label htmlFor="bank-select">Bank</Label>
              <select
                id="bank-select"
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>{b.bank_name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Label>Amount</Label>
            <Input value={bankAmount} onChange={(e) => setBankAmount(e.target.value)} placeholder="" />
          </div>

          <div className="rounded-xl bg-muted/40 p-4 space-y-2.5 text-[13px]">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Bank name</span>
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{selectedBank.bank_name}</span>
                <button type="button" onClick={() => copy(selectedBank.bank_name)}>
                  <Copy className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Account name</span>
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{selectedBank.account_name}</span>
                <button type="button" onClick={() => copy(selectedBank.account_name)}>
                  <Copy className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Account number</span>
              <div className="flex items-center gap-1.5">
                <span className="font-medium font-mono">{selectedBank.account_number}</span>
                <button type="button" onClick={() => copy(selectedBank.account_number)}>
                  <Copy className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
            </div>
            {selectedBank.routing_number && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Routing number</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium font-mono">{selectedBank.routing_number}</span>
                  <button type="button" onClick={() => copy(selectedBank.routing_number!)}>
                    <Copy className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
              </div>
            )}
            {selectedBank.swift_code && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">SWIFT code</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium font-mono">{selectedBank.swift_code}</span>
                  <button type="button" onClick={() => copy(selectedBank.swift_code!)}>
                    <Copy className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <ProofUploader
            required
            preview={bankProofPreview}
            fileName={bankProofFile?.name}
            fileSize={bankProofFile?.size}
            inputRef={bankProofRef}
            onPick={onPickBankProof}
          />
          <Button disabled={submitting || uploadingBankProof} onClick={submitBank} className="w-full">
            {submitting || uploadingBankProof ? <Loader2 className="w-4 h-4 animate-spin" /> : "I've sent the deposit"}
          </Button>
        </div>
      )}
    </div>
  );
}
