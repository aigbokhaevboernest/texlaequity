import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// ... SYMBOLS unchanged ...

export function useCurrency() {
  const { user } = useAuth();
  // unique id per hook instance, stable across re-renders
  const instanceId = useRef(Math.random().toString(36).slice(2)).current;

  // ... currency/ready state unchanged ...

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase.from("profiles").select("currency").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        // unchanged
      });

    const channel = supabase
      // 👇 unique per component instance, not just per user
      .channel(`profile-currency-${user.id}-${instanceId}`)
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        (payload) => {
          // unchanged
        })
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
  }, [user?.id]);

  // format() unchanged
}
