import { createContext, useContext, useCallback, useEffect, useRef, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Profile {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  account_level: string;
  status: string;
  total_balance: number;
  profit: number;
  deposit: number;
  assigned_expert_id: string | null;
}

const PROFILE_COLUMNS =
  "full_name, username, avatar_url, account_level, status, total_balance, profit, deposit, assigned_expert_id";

// A brand-new signup's profile row can lag a moment behind auth.signUp()
// resolving (the insert happens in a separate request right after). Retry
// a handful of times, briefly, before accepting "no profile" as final.
const MAX_FETCH_RETRIES = 6;
const RETRY_DELAY_MS = 500;

interface ProfileContextValue {
  profile: Profile | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

/**
 * Single live source of truth for the logged-in user's profile row.
 * Fetches once (retrying briefly if the row isn't there yet), then patches
 * state in place on every Postgres change (via Supabase Realtime) — no
 * polling, no manual refresh required after the initial load settles.
 *
 * Mount this ONCE, above DashboardLayout, so every page/component
 * that calls useProfile() shares the same subscription and state.
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Guards against a stale retry (e.g. user logs out mid-retry-loop)
  // applying state for the wrong user after the fact.
  const activeUserIdRef = useRef<string | null>(null);

  const fetchProfile = useCallback(async (attempt = 0) => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("user_id", user.id)
      .maybeSingle();

    if (activeUserIdRef.current !== user.id) return; // user changed while this was in flight

    if (error) console.warn("[profile] fetch error:", error.message);

    if (!data && !error && attempt < MAX_FETCH_RETRIES) {
      // No row yet (most likely: right after signup, insert hasn't landed).
      // Stay in "loading" and try again shortly rather than giving up.
      setTimeout(() => {
        if (activeUserIdRef.current === user.id) fetchProfile(attempt + 1);
      }, RETRY_DELAY_MS);
      return;
    }

    setProfile((data as Profile | null) ?? null);
    setLoading(false);
  }, [user?.id]);

  // Initial (and user-change) fetch
  useEffect(() => {
    activeUserIdRef.current = user?.id ?? null;
    setLoading(true);
    fetchProfile();
  }, [fetchProfile]);

  // Realtime subscription — patches state instantly on any change to this user's row
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setProfile(null);
            return;
          }
          // Merge instead of replace so we never briefly show partial/undefined
          // fields. Spreading `prev` when it's still null is a no-op in JS
          // (not an error), so this also correctly "sets" the profile the
          // first time an INSERT lands while we were mid-retry above.
          setProfile((prev) => ({ ...(prev as Profile), ...(payload.new as Partial<Profile>) }));
          setLoading(false);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return (
    <ProfileContext.Provider value={{ profile, loading, refresh: fetchProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within a ProfileProvider");
  return ctx;
}
