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
  const [currency, setCurrency] = useState<string>("USD");

  useEffect(() => {
    if (!user) { setCurrency("USD"); return; }
    let active = true;
    supabase.from("profiles").select("currency").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (active && data?.currency) setCurrency(data.currency); });

    const channel = supabase
      .channel(`profile-currency-${user.id}`)
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const next = (payload.new as { currency?: string })?.currency;
          if (next) setCurrency(next);
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

  return { currency, format };
}
