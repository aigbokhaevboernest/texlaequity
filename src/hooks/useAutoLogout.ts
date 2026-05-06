import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function useAutoLogout() {
  const nav = useNavigate();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const logout = async () => {
      await supabase.auth.signOut();
      nav("/login", { replace: true });
    };

    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(logout, TIMEOUT_MS);
    };

    const events: (keyof WindowEventMap)[] = ["touchstart", "touchmove", "keydown", "scroll", "click"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [nav]);
}
