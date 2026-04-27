import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Debug helper: log the user + role whenever auth state resolves
  const logUserAndRole = (s: Session | null, label: string) => {
    if (!s?.user) {
      console.log(`[auth:${label}] no user`);
      return;
    }
    // Defer the role lookup to avoid recursion inside onAuthStateChange
    setTimeout(async () => {
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", s.user.id)
        .maybeSingle();
      console.log(`[auth:${label}]`, {
        id: s.user.id,
        email: s.user.email,
        role: roleRow?.role ?? "user",
      });
    }, 0);
  };

  useEffect(() => {
    // Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        logUserAndRole(s, event);
      } else if (event === "SIGNED_OUT") {
        console.log("[auth:SIGNED_OUT]");
      }
    });
    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      logUserAndRole(s, "INITIAL");
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);