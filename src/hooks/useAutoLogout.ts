import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes (testing only)
const LAST_ACTIVITY_KEY = "tv:last-activity";
const FORCE_LOGOUT_KEY = "tv:force-logout";
const WRITE_THROTTLE_MS = 5000;

const AUTH_STORAGE_PATTERNS = [/supabase\.auth/i, /^sb-.*-auth-token$/i, /^sb-.*-code-verifier$/i];
const isAuthStorageKey = (key: string) => AUTH_STORAGE_PATTERNS.some((p) => p.test(key));

const clearIdleKeys = () => {
  try {
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    localStorage.removeItem(FORCE_LOGOUT_KEY);
  } catch {
    /* ignore */
  }
};

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
  clearIdleKeys();
};

const clearAuthCookies = () => {
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0]?.trim();
    if (!name || !isAuthStorageKey(name)) return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });
};

let loggingOut = false;

/**
 * The ONE logout path. Used by the Logout buttons AND by idle expiry.
 * Signs out, wipes auth + idle keys, then hard-navigates to /login
 * (a full reload avoids races with GuestOnly bouncing back to /dashboard).
 */
export async function performLogout() {
  if (loggingOut) return;
  loggingOut = true;

  try {
    localStorage.setItem(FORCE_LOGOUT_KEY, String(Date.now())); // tells other tabs
  } catch {
    /* ignore */
  }

  try {
    // Don't let a dead network hang the logout forever.
    await Promise.race([
      supabase.auth.signOut({ scope: "global" }),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
  } catch {
    /* ignore */
  }

  clearAuthStorage();
  clearAuthCookies();
  window.location.replace("/login");
}

/**
 * Mount ONCE at app root (see AutoLogoutBridge). Not per page.
 * enabled = a user is logged in; loading = auth still resolving.
 */
export function useAutoLogout(enabled: boolean, loading: boolean) {
  useEffect(() => {
    // While auth is resolving, do nothing (otherwise a page refresh would
    // look like "logged out" and wipe the idle clock).
    if (loading) return;

    // Logged out: make sure no stale timestamp survives to the next login.
    if (!enabled) {
      clearIdleKeys();
      return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastWrite = 0;

    const getLast = (): number => {
      try {
        const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
        const n = raw ? Number(raw) : NaN;
        return Number.isFinite(n) ? n : NaN;
      } catch {
        return NaN;
      }
    };

    const setLast = (v: number) => {
      try {
        localStorage.setItem(LAST_ACTIVITY_KEY, String(v));
      } catch {
        /* ignore */
      }
    };

    // Recompute against the stored deadline. Never grants new time.
    const check = () => {
      const last = getLast();
      if (Number.isNaN(last)) {
        setLast(Date.now());
        arm(TIMEOUT_MS);
        return;
      }
      const remaining = TIMEOUT_MS - (Date.now() - last);
      if (remaining <= 0) {
        performLogout();
        return;
      }
      arm(remaining);
    };

    const arm = (ms: number) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(check, ms);
    };

    // Real interaction only. No mousemove / pointermove / touchmove:
    // those fire constantly and kept sessions alive forever.
    const onActivity = () => {
      const now = Date.now();
      const last = getLast();
      // If the window already expired (e.g. device just woke up), a tap must
      // NOT revive the session.
      if (!Number.isNaN(last) && now - last >= TIMEOUT_MS) {
        performLogout();
        return;
      }
      if (now - lastWrite < WRITE_THROTTLE_MS) return;
      lastWrite = now;
      setLast(now);
      arm(TIMEOUT_MS);
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === FORCE_LOGOUT_KEY && e.newValue) {
        clearAuthStorage();
        clearAuthCookies();
        window.location.replace("/login");
      } else if (e.key === LAST_ACTIVITY_KEY) {
        check();
      }
    };

    const events: (keyof WindowEventMap)[] = ["mousedown", "keydown", "touchstart", "scroll", "click", "wheel"];

    // Fresh login => key was cleared while logged out, so this starts a new
    // window. A returning session with an old key is checked, not refreshed.
    check();

    events.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));
    window.addEventListener("storage", onStorage);
    // Wake / tab-switch: recheck only, never reset.
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    const heartbeat = setInterval(check, 15000);

    return () => {
      if (timer) clearTimeout(timer);
      clearInterval(heartbeat);
      events.forEach((ev) => window.removeEventListener(ev, onActivity));
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, [enabled, loading]);
}
