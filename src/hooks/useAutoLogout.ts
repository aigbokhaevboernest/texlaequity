import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const LAST_ACTIVITY_KEY = "tv:last-activity";

export function useAutoLogout() {
  const nav = useNavigate();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let heartbeat: ReturnType<typeof setInterval> | null = null;
    let active = true;

    const logout = async () => {
      if (!active) return;
      await supabase.auth.signOut();
      nav("/login", { replace: true });
    };

    const getLastActivity = () => {
      try {
        const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
        return raw ? Number(raw) : Date.now();
      } catch {
        return Date.now();
      }
    };

    const setLastActivity = (value: number) => {
      try {
        localStorage.setItem(LAST_ACTIVITY_KEY, String(value));
      } catch {
        /* ignore */
      }
    };

    const armTimer = () => {
      if (timer) clearTimeout(timer);
      const remaining = Math.max(TIMEOUT_MS - (Date.now() - getLastActivity()), 0);
      timer = setTimeout(logout, remaining || 0);
    };

    const reset = () => {
      const now = Date.now();
      setLastActivity(now);
      armTimer();
    };

    const syncFromStorage = (event: StorageEvent) => {
      if (event.key === LAST_ACTIVITY_KEY) armTimer();
    };

    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "click",
      "scroll",
      "keydown",
      "keypress",
      "touchstart",
      "touchmove",
      "pointerdown",
      "pointermove",
      "focus",
    ];

    if (!localStorage.getItem(LAST_ACTIVITY_KEY)) {
      setLastActivity(Date.now());
    }

    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    window.addEventListener("storage", syncFromStorage);
    document.addEventListener("visibilitychange", armTimer);

    armTimer();
    heartbeat = setInterval(() => {
      if (document.hidden) return;
      const inactiveFor = Date.now() - getLastActivity();
      if (inactiveFor >= TIMEOUT_MS) logout();
    }, 15000);

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      if (heartbeat) clearInterval(heartbeat);
      events.forEach((e) => window.removeEventListener(e, reset));
      window.removeEventListener("storage", syncFromStorage);
      document.removeEventListener("visibilitychange", armTimer);
    };
  }, [nav]);
}
