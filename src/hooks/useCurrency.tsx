import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// Currency symbols (display only — no FX conversion)
const SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", AUD: "A$", CAD: "C$", JPY: "¥",
  SGD: "S$", AED: "AED ", NGN: "₦", BRL: "R$", INR: "₹",
};

/**
 * Returns the user's registration currency (profiles.currency) and a
 * `format(amount)` helper that displays the raw stored number with that
 * currency's symbol — NO conversion is performed.
 */
export function useCurrency() {
  const { user } = useAuth();
  const cacheKey = user ? `currency:${user.id}` : null;
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

  const format = useCallback((amount: number) => {
    const n = Number(amount ?? 0);
    const sym = SYMBOLS[currency] ?? "";
    const noDecimals = ["JPY", "NGN", "INR"].includes(currency) || Math.abs(n) >= 1000;
    const formatted = n.toLocaleString("en-US", {
      maximumFractionDigits: noDecimals ? 0 : 2,
      minimumFractionDigits: 0,
    });
    return sym ? `${sym}${formatted}` : `${currency} ${formatted}`;
  }, [currency]);

  return { currency, format, ready };
}
