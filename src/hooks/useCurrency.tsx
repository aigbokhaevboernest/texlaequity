import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/currency";

/**
 * Returns the current user's preferred currency code (from profiles.currency)
 * and a `format(usd)` helper that converts a USD amount to that currency
 * for display. Listens to profile changes so updates propagate live.
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

  const format = useCallback((usd: number) => formatMoney(Number(usd ?? 0), currency), [currency]);
  return { currency, format };
}
