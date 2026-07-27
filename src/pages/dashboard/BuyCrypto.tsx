import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, MessageCircle } from "lucide-react";
import { useState } from "react";

interface ExchangeEntry {
  name: string;
  domain: string; // used for logo.clearbit.com lookup
  buyUrl: string;
  featured?: boolean;
}

// Transak is intentionally first (featured). The rest follow, ordered by
// general recognizability — adjust freely, order in this array is display order.
const EXCHANGES: ExchangeEntry[] = [
  { name: "Transak", domain: "transak.com", buyUrl: "https://global.transak.com/", featured: true },
  { name: "Coinbase", domain: "coinbase.com", buyUrl: "https://www.coinbase.com/buy" },
  { name: "Binance", domain: "binance.com", buyUrl: "https://www.binance.com/en/buy-sell-crypto" },
  { name: "MoonPay", domain: "moonpay.com", buyUrl: "https://buy.moonpay.com/" },
  { name: "Kraken", domain: "kraken.com", buyUrl: "https://www.kraken.com/buy-sell-crypto" },
  { name: "Crypto.com", domain: "crypto.com", buyUrl: "https://crypto.com/exchange" },
  { name: "OKX", domain: "okx.com", buyUrl: "https://www.okx.com/buy-crypto" },
  { name: "Bybit", domain: "bybit.com", buyUrl: "https://www.bybit.com/en/buy-sell-crypto/" },
  { name: "KuCoin", domain: "kucoin.com", buyUrl: "https://www.kucoin.com/buy-crypto" },
  { name: "Gemini", domain: "gemini.com", buyUrl: "https://www.gemini.com/prices" },
  { name: "Gate.io", domain: "gate.io", buyUrl: "https://www.gate.io/buy-sell-crypto" },
  { name: "Bitstamp", domain: "bitstamp.net", buyUrl: "https://www.bitstamp.net/buy-crypto/" },
  { name: "Bitpanda", domain: "bitpanda.com", buyUrl: "https://www.bitpanda.com/en/buy-bitcoin" },
  { name: "Bitfinex", domain: "bitfinex.com", buyUrl: "https://www.bitfinex.com/" },
  { name: "Paxful", domain: "paxful.com", buyUrl: "https://paxful.com/buy-bitcoin" },
  { name: "HTX (Huobi)", domain: "htx.com", buyUrl: "https://www.htx.com/en-us/buy-crypto/" },
  { name: "MEXC", domain: "mexc.com", buyUrl: "https://www.mexc.com/buy-crypto" },
  { name: "Uphold", domain: "uphold.com", buyUrl: "https://uphold.com/en-us/buy-crypto" },
];

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
      src={`https://logo.clearbit.com/${domain}`}
      alt={`${name} logo`}
      className="w-11 h-11 rounded-xl object-contain bg-white border border-border p-1.5"
      onError={() => setFailed(true)}
    />
  );
};

export default function BuyCrypto() {
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
        Visit your preferred exchange, buy Bitcoin (or your chosen coin), and return to this website
        to complete your deposit. Make sure to contact support for confirmation and assistance once
        you've sent your funds.
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {EXCHANGES.map((ex) => (
          <a
            key={ex.name}
            href={ex.buyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-3 rounded-2xl border p-4 transition hover:-translate-y-0.5 ${
              ex.featured
                ? "border-primary bg-primary/5 hover:border-primary"
                : "border-border bg-card hover:border-foreground/40"
            }`}
          >
            <ExchangeLogo domain={ex.domain} name={ex.name} />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-[14px] flex items-center gap-1.5">
                {ex.name}
                {ex.featured && (
                  <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
                    Recommended
                  </span>
                )}
              </p>
              <p className="text-[12px] text-muted-foreground">Buy crypto</p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
          </a>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3">
        <MessageCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-[13px] text-muted-foreground">
          Need help after purchasing? Contact support and we'll confirm your transaction and assist
          with the next steps.
        </p>
      </div>
    </div>
  );
}
