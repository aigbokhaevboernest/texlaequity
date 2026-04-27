import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "moderator" | "user";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  isAdmin: boolean;
  loading: boolean;          // auth resolved
  roleLoading: boolean;      // role lookup resolved
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  session: null,
  role: null,
  isAdmin: false,
  loading: true,
  roleLoading: true,
  signOut: async () => {},
  refreshRole: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);

  // NOTE: Roles are stored in the secure `user_roles` table (not profiles)
  // to prevent client-side privilege escalation. We expose the resolved role
  // here so every page can read it via `useAuth()`.
  const fetchRole = async (uid: string | undefined, label: string) => {
    if (!uid) {
      setRole(null);
      setRoleLoading(false);
      console.log(`[auth:${label}] no user → role=null`);
      return;
    }
    setRoleLoading(true);
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .order("role", { ascending: true }) // 'admin' < 'moderator' < 'user' alphabetically: admin wins
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn(`[auth:${label}] role fetch error`, error.message);
      setRole("user");
    } else {
      const resolved = (data?.role as AppRole | undefined) ?? "user";
      setRole(resolved);
      console.log(`[auth:${label}]`, { uid, role: resolved });
    }
    setRoleLoading(false);
  };

  useEffect(() => {
    // 1. Subscribe FIRST so we never miss an event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      // Defer Supabase calls out of the auth callback to avoid deadlocks
      if (event === "SIGNED_OUT") {
        setRole(null);
        setRoleLoading(false);
        console.log("[auth:SIGNED_OUT]");
        return;
      }
      if (s?.user) {
        setTimeout(() => fetchRole(s.user.id, event), 0);
      }
    });

    // 2. THEN check existing session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      fetchRole(s?.user?.id, "INITIAL");
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
  };

  const refreshRole = async () => {
    await fetchRole(user?.id, "REFRESH");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        isAdmin: role === "admin",
        loading,
        roleLoading,
        signOut,
        refreshRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
