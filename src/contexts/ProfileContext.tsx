import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from "react";
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

interface ProfileContextValue {
  profile: Profile | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

/**
 * Single live source of truth for the logged-in user's profile row.
 * Fetches once, then patches state in place on every Postgres change
 * (via Supabase Realtime) — no polling, no manual refresh required.
 *
 * Mount this ONCE, above DashboardLayout, so every page/component
 * that calls useProfile() shares the same subscription and state.
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
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
    if (error) console.warn("[profile] fetch error:", error.message);
    setProfile((data as Profile | null) ?? null);
    setLoading(false);
  }, [user?.id]);

  // Initial (and user-change) fetch
  useEffect(() => {
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
          // Merge instead of replace so we never briefly show partial/undefined fields
          setProfile((prev) => ({ ...(prev as Profile), ...(payload.new as Partial<Profile>) }));
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
