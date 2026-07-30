import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// Currency symbols (display only)
const SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", AUD: "A$", CAD: "C$", JPY: "¥",
  SGD: "S$", AED: "AED ", NGN: "₦", BRL: "R$", INR: "₹",
};

// Free, no-API-key exchange rate feed (ExchangeRate-API open access,
// base USD, updated daily). See https://www.exchangerate-api.com/docs/free
const RATES_URL = "https://open.er-api.com/v6/latest/USD";
const RATES_CACHE_KEY = "fx:usd-rates";
const RATES_CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12h — feed itself only updates daily

type RatesCache = { rates: Record<string, number>; fetchedAt: number };

function readRatesCache(): RatesCache | null {
  try {
    const raw = localStorage.getItem(RATES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RatesCache;
    if (!parsed?.rates || !parsed?.fetchedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeRatesCache(rates: Record<string, number>) {
  try {
    localStorage.setItem(RATES_CACHE_KEY, JSON.stringify({ rates, fetchedAt: Date.now() }));
  } catch { /* ignore */ }
}

/**
 * Returns the user's registration currency (profiles.currency) and a
 * `format(usdAmount)` helper that converts a USD amount into that currency
 * using live exchange rates, then formats it with the currency's symbol.
 *
 * Rates are fetched once per session (and cached in localStorage for up to
 * 12h) rather than on every call. If the feed is unreachable, `format`
 * falls back to displaying the raw USD number with the target currency's
 * symbol (old behavior) rather than throwing — conversion is a display
 * concern and shouldn't break the page if the FX feed is down.
 */
export function useCurrency() {
  const { user } = useAuth();
  const [currency, setCurrency] = useState<string>(() => {
    if (typeof window === "undefined") return "USD";
    try {
      const uid = user?.id;
      if (uid) {
        const v = localStorage.getItem(`currency:${uid}`);
        if (v) return v;
      }
      return localStorage.getItem("currency:last") || "USD";
    } catch { return "USD"; }
  });
  const [ready, setReady] = useState<boolean>(() => {
    if (typeof window === "undefined" || !user) return false;
    return !!localStorage.getItem(`currency:${user.id}`);
  });

  const [rates, setRates] = useState<Record<string, number> | null>(() => {
    const cached = readRatesCache();
    if (cached && Date.now() - cached.fetchedAt < RATES_CACHE_TTL_MS) return cached.rates;
    return null;
  });
  const ratesFetchedRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase.from("profiles").select("currency").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        if (data?.currency) {
          setCurrency(data.currency);
          try {
            localStorage.setItem(`currency:${user.id}`, data.currency);
            localStorage.setItem("currency:last", data.currency);
          } catch { /* ignore */ }
        }
        setReady(true);
      });

    const channel = supabase
      .channel(`profile-currency-${user.id}`)
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const next = (payload.new as { currency?: string })?.currency;
          if (next) {
            setCurrency(next);
            try {
              localStorage.setItem(`currency:${user.id}`, next);
              localStorage.setItem("currency:last", next);
            } catch { /* ignore */ }
          }
        })
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
  }, [user?.id]);

  // Fetch live FX rates once (or reuse a fresh cache), independent of auth —
  // conversion should work the moment a currency is known.
  useEffect(() => {
    if (rates || ratesFetchedRef.current) return;
    ratesFetchedRef.current = true;

    const cached = readRatesCache();
    if (cached && Date.now() - cached.fetchedAt < RATES_CACHE_TTL_MS) {
      setRates(cached.rates);
      return;
    }

    fetch(RATES_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`FX feed returned ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data?.result === "success" && data?.rates) {
          setRates(data.rates);
          writeRatesCache(data.rates);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch live exchange rates:", err);
        // Fall back to a stale cache if we have one, even past TTL, rather
        // than showing unconverted USD.
        const stale = readRatesCache();
        if (stale?.rates) setRates(stale.rates);
      });
  }, [rates]);

  const format = useCallback((usdAmount: number) => {
    const usd = Number(usdAmount ?? 0);
    const rate = currency === "USD" ? 1 : rates?.[currency];
    // If we don't have a rate yet (feed still loading / failed and no
    // cache), fall back to showing the raw USD number so the UI never
    // shows a broken value — just an unconverted one, temporarily.
    const converted = typeof rate === "number" ? usd * rate : usd;

    const sym = SYMBOLS[currency] ?? "";
    const noDecimals = ["JPY", "NGN", "INR"].includes(currency) || Math.abs(converted) >= 1000;
    const formatted = converted.toLocaleString("en-US", {
      maximumFractionDigits: noDecimals ? 0 : 2,
      minimumFractionDigits: 0,
    });
    return sym ? `${sym}${formatted}` : `${currency} ${formatted}`;
  }, [currency, rates]);

  return { currency, format, ready, ratesReady: rates !== null };
}
