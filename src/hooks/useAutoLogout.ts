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

  // Also clear the auto-logout bookkeeping keys. Previously these
  // survived logout forever, so a stale "last activity" timestamp
  // from a prior session would make the very next login compute a
  // negative time-remaining and log the user out instantly.
  try {
    window.localStorage.removeItem(LAST_ACTIVITY_KEY);
    window.localStorage.removeItem(FORCE_LOGOUT_KEY);
  } catch {
    /* ignore */
  }
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

    // Events that count as genuine user activity and should push the
    // 30-minute window forward.
    //
    // NOTE: "focus" was deliberately removed from this list. The
    // window/tab "focus" event fires whenever the browser becomes the
    // active app again -- including when a laptop wakes from sleep or
    // a phone is unlocked with the tab already open. That is NOT user
    // activity, and treating it as one caused the exact bug reported:
    // waking the device silently reset the idle timer to a fresh 30
    // minutes, so the session never expired even after being idle
    // (asleep) far longer than the timeout. Regaining focus should
    // only trigger a RECHECK of the existing deadline (see the
    // separate "focus" listener below, wired to armTimer, not reset),
    // never a reset of the deadline itself.
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
    ];

    // Always treat the moment this hook mounts (i.e. right after a
    // successful login, when the dashboard first renders) as fresh
    // activity. Previously this only ran if the key was missing, so
    // a leftover timestamp from a much earlier session would survive
    // and immediately expire on the next login.
    setLastActivity(Date.now());

    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    window.addEventListener("storage", syncFromStorage);

    // Recheck-only listeners: these fire when the tab/window regains
    // visibility or focus (e.g. after device sleep/wake, tab switch,
    // or app foregrounding). They must call armTimer() -- which
    // recomputes the remaining time against the existing
    // lastActivity timestamp -- and must NEVER call reset(), or a
    // wake/focus event would silently grant a full new timeout window
    // regardless of how long the device was actually idle.
    document.addEventListener("visibilitychange", armTimer);
    window.addEventListener("focus", armTimer);

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
      window.removeEventListener("focus", armTimer);
    };
  }, []);
}
