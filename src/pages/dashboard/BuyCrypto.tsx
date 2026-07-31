import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, MessageCircle, X } from "lucide-react";
import { useState } from "react";

interface ExchangeEntry {
  name: string;
  domain: string; // used for favicon lookup
  buyUrl: string;
}

// Order here is display order — Transak listed first, no special styling.
//
// URLs verified to go as directly as possible to an actual buy/purchase
// flow (not just a homepage or trading dashboard). A few notes:
// - Paxful removed: the exchange shut down entirely (wound down Nov 2025).
// - Kraken/Gemini/Bitfinex/Crypto.com previously pointed at generic pages
//   that don't reliably land on a buy flow; replaced with direct ones.
// These exchanges control their own URLs and can restructure their sites
// at any time, so it's worth spot-checking this list periodically.
const EXCHANGES: ExchangeEntry[] = [
  { name: "Transak", domain: "transak.com", buyUrl: "https://global.transak.com/" },
  { name: "Coinbase", domain: "coinbase.com", buyUrl: "https://www.coinbase.com/buy" },
  { name: "Binance", domain: "binance.com", buyUrl: "https://www.binance.com/en/buy-sell-crypto" },
  { name: "MoonPay", domain: "moonpay.com", buyUrl: "https://buy.moonpay.com/" },
  { name: "Kraken", domain: "kraken.com", buyUrl: "https://www.kraken.com/buy/btc" },
  { name: "Crypto.com", domain: "crypto.com", buyUrl: "https://crypto.com/app" },
  { name: "OKX", domain: "okx.com", buyUrl: "https://www.okx.com/buy-crypto" },
  { name: "Bybit", domain: "bybit.com", buyUrl: "https://www.bybit.com/en/buy-sell-crypto/" },
  { name: "KuCoin", domain: "kucoin.com", buyUrl: "https://www.kucoin.com/buy-crypto" },
  { name: "Gemini", domain: "gemini.com", buyUrl: "https://www.gemini.com/how-to-buy/bitcoin" },
  { name: "Gate.io", domain: "gate.io", buyUrl: "https://www.gate.io/buy-sell-crypto" },
  { name: "Bitstamp", domain: "bitstamp.net", buyUrl: "https://www.bitstamp.net/buy-crypto/" },
  { name: "Bitpanda", domain: "bitpanda.com", buyUrl: "https://www.bitpanda.com/en/buy-bitcoin" },
  { name: "Bitfinex", domain: "bitfinex.com", buyUrl: "https://www.bitfinex.com/how-to-buy-bitcoin/" },
  { name: "HTX (Huobi)", domain: "htx.com", buyUrl: "https://www.htx.com/en-us/buy-crypto/" },
  { name: "MEXC", domain: "mexc.com", buyUrl: "https://www.mexc.com/buy-crypto" },
  { name: "Uphold", domain: "uphold.com", buyUrl: "https://uphold.com/en-us/buy-crypto" },
];

// Clearbit's logo API (logo.clearbit.com) was shut down permanently on
// Dec 8, 2025 — that's why logos weren't showing. Google's favicon service
// is used here instead since it requires no API key/signup. Quality is
// lower (favicon-sized, not full logos) but it's free and reliable; the
// initials fallback below still covers anything it can't find.
const faviconUrl = (domain: string) =>
  `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;

const ExchangeLogo = ({ domain, name }: { domain: string; name: string }) => {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center text-[13px] font-semibold text-foreground/70">
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={faviconUrl(domain)}
      alt={`${name} logo`}
      className="w-11 h-11 rounded-xl object-contain bg-white border border-border p-1.5"
      onError={() => setFailed(true)}
    />
  );
};

export default function BuyCrypto() {
  const [pendingExchange, setPendingExchange] = useState<ExchangeEntry | null>(null);

  const confirmAndRedirect = () => {
    if (!pendingExchange) return;
    window.open(pendingExchange.buyUrl, "_blank", "noopener,noreferrer");
    setPendingExchange(null);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard/deposit"
          className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-light tracking-[-0.03em]">Buy Crypto</h1>
          <p className="text-muted-foreground text-[13px] mt-0.5">
            Don't have crypto yet? Pick an exchange below.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-muted/40 p-4 text-[13px] leading-relaxed">
        Visit your preferred exchange, buy crypto, and return to the deposit page to complete your
        deposit. Make sure to contact support for confirmation and assistance before and after
        sending the funds.
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {EXCHANGES.map((ex) => (
          <button
            key={ex.name}
            type="button"
            onClick={() => setPendingExchange(ex)}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition hover:-translate-y-0.5 hover:border-foreground/40"
          >
            <ExchangeLogo domain={ex.domain} name={ex.name} />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-[14px]">{ex.name}</p>
              <p className="text-[12px] text-muted-foreground">Buy crypto</p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3">
        <MessageCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-[13px] text-muted-foreground">
          Need help after purchasing? Contact support and we'll confirm your transaction and assist
          with the next steps.
        </p>
      </div>

      {pendingExchange && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPendingExchange(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-card border border-border p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <ExchangeLogo domain={pendingExchange.domain} name={pendingExchange.name} />
                <p className="font-display text-lg font-medium">
                  Continue to {pendingExchange.name}?
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPendingExchange(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[13px] text-muted-foreground leading-relaxed">
              You'll be taken to {pendingExchange.name}'s website in a new tab to buy crypto.
              Once your purchase is complete, come back here and return to the deposit page to
              finish depositing. Contact support before and after sending funds so we can confirm
              and assist you.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPendingExchange(null)}
                className="flex-1 rounded-full border border-border py-2.5 text-[13px] font-medium hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAndRedirect}
                className="flex-1 rounded-full bg-primary text-primary-foreground py-2.5 text-[13px] font-medium hover:opacity-90 transition"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
