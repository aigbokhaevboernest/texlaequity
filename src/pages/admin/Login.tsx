import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldCheck, Loader2, Zap, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(1, "Enter your password").max(72),
});

const AdminLogin = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // If already logged in as admin, jump straight to /admin
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) nav("/admin", { replace: true });
      });
    return () => { cancelled = true; };
  }, [user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const parsed = loginSchema.safeParse({ email: cleanEmail, password });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);

    // 1. Sign in
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });

    if (signInError || !signInData.user) {
      setLoading(false);
      const msg = /invalid login credentials/i.test(signInError?.message ?? "")
        ? "Wrong email or password"
        : signInError?.message ?? "Login failed";
      toast.error(msg);
      return;
    }

    // 2. Verify admin role server-side via RLS-protected query
    const { data: roleRow, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", signInData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleRow) {
      // Not an admin — sign them back out so this stays an admin-only door
      await supabase.auth.signOut();
      setLoading(false);
      toast.error("Access denied — this account is not an administrator");
      return;
    }

    setLoading(false);
    toast.success("Welcome, admin");
    nav("/admin", { replace: true });
  };

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] blob opacity-30 pointer-events-none" />
      <div className="w-full max-w-md relative">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-lg bg-foreground text-background flex items-center justify-center shadow-elegant">
            <Zap className="w-4 h-4" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-xl">
            Tesla<span className="text-primary">Vest</span>
          </span>
        </Link>

        <div className="glass rounded-3xl p-8 shadow-elegant border border-primary/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold leading-none">Admin access</h1>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">
                Restricted area
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Sign in with your administrator credentials. Regular accounts will be rejected.
          </p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="email">Admin email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@yourdomain.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full shadow-elegant" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in to admin"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <Link to="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to site
            </Link>
            <Link to="/login" className="hover:text-foreground transition-colors">
              User login →
            </Link>
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-4">
          This page is monitored. Unauthorized access attempts are logged.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
