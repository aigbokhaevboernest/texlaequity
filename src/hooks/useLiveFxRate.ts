import { useEffect, useState, useRef } from "react";

// Free, no-API-key exchange rate feed (ExchangeRate-API open access,
// base USD, updated daily). https://www.exchangerate-api.com/docs/free
const RATES_URL = "https://open.er-api.com/v6/latest/USD";
const RATES_CACHE_KEY = "fx:usd-rates";
const RATES_CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12h — feed only updates daily

type RatesCache = { rates: Record<string, number>; fetchedAt: number };

function readCache(): RatesCache | null {
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

function writeCache(rates: Record<string, number>) {
  try {
    localStorage.setItem(RATES_CACHE_KEY, JSON.stringify({ rates, fetchedAt: Date.now() }));
  } catch { /* ignore */ }
}

/**
 * Live USD → target-currency exchange rate, for the rare cases where a
 * number genuinely IS in USD and needs real conversion for display
 * (e.g. Tesla Stock, priced in USD on NASDAQ regardless of account
 * currency). This is intentionally separate from useCurrency(), which
 * must never convert — DB balances are already in the user's currency.
 *
 * Returns null while loading / if the feed is unreachable and there's no
 * cache yet. Callers should fall back to showing the raw USD number in
 * that case, not a broken value.
 */
export function useLiveFxRate(targetCurrency: string): number | null {
  const [rates, setRates] = useState<Record<string, number> | null>(() => {
    const cached = readCache();
    if (cached && Date.now() - cached.fetchedAt < RATES_CACHE_TTL_MS) return cached.rates;
    return null;
  });
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (rates || fetchedRef.current) return;
    fetchedRef.current = true;

    const cached = readCache();
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
          writeCache(data.rates);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch live exchange rates:", err);
        const stale = readCache();
        if (stale?.rates) setRates(stale.rates);
      });
  }, [rates]);

  if (targetCurrency === "USD") return 1;
  return rates?.[targetCurrency] ?? null;
}
