import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const LAST_ACTIVITY_KEY = "tv:last-activity";
const FORCE_LOGOUT_KEY = "tv:force-logout";

const AUTH_STORAGE_PATTERNS = [/supabase\.auth/i, /^sb-.*-auth-token$/i, /^sb-.*-code-verifier$/i];

const isAuthStorageKey = (key: string) => AUTH_STORAGE_PATTERNS.some((pattern) => pattern.test(key));

const clearAuthStorage = () => {
  [window.localStorage, window.sessionStorage].forEach((storage) => {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (key) keys.push(key);
    }
    keys.forEach((key) => {
      if (isAuthStorageKey(key)) storage.removeItem(key);
    });
  });
};

const clearAuthCookies = () => {
  document.cookie.split(";").forEach((cookie) => {
    const [rawName] = cookie.split("=");
    const name = rawName?.trim();
    if (!name || !isAuthStorageKey(name)) return;

    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });
};

export function useAutoLogout() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let heartbeat: ReturnType<typeof setInterval> | null = null;
    let active = true;
    let loggingOut = false;

    const logout = async () => {
      if (!active || loggingOut) return;
      loggingOut = true;

      try {
        localStorage.setItem(FORCE_LOGOUT_KEY, String(Date.now()));
      } catch {
        /* ignore */
      }

      try {
        await supabase.auth.signOut({ scope: "global" });
      } catch {
        /* ignore */
      }

      clearAuthStorage();
      clearAuthCookies();
      window.location.replace("/login");
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
      if (event.key === FORCE_LOGOUT_KEY) {
        clearAuthStorage();
        clearAuthCookies();
        window.location.replace("/login");
      }
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
  }, []);
}
