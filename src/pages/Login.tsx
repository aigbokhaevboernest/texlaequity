import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";

const REMEMBER_KEY = "tv_remember_email";

const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your username or email").max(255),
  password: z.string().min(1, "Enter your password").max(72),
});

const Login = () => {
  const { user, loading: authLoading, roleLoading } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [email, setEmail] = useState(
    typeof window !== "undefined" ? localStorage.getItem(REMEMBER_KEY) ?? "" : ""
  );
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState<boolean>(
    typeof window !== "undefined" ? !!localStorage.getItem(REMEMBER_KEY) : false
  );

  useEffect(() => {
    if (authLoading || roleLoading || !user) return;
    nav("/dashboard", { replace: true });
  }, [user, authLoading, roleLoading, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const identifier = email.trim();
    const parsed = loginSchema.safeParse({ identifier: identifier.toLowerCase(), password });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);

    let loginEmail = parsed.data.identifier;
    if (!loginEmail.includes("@")) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("email" as never)
        .eq("username", identifier)
        .maybeSingle();
      const found = (prof as { email?: string } | null)?.email;
      if (!found) {
        setLoading(false);
        toast.error("No account found with that username.");
        return;
      }
      loginEmail = found;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: parsed.data.password,
    });
    setLoading(false);
    if (error) {
      const msg = /invalid login credentials/i.test(error.message)
        ? "Wrong email or password"
        : /email not confirmed/i.test(error.message)
        ? "Please confirm your email first — check your inbox"
        : error.message;
      toast.error(msg);
      return;
    }

    const { data: { user: loggedUser } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("user_id", loggedUser?.id!)
      .maybeSingle();

    if (profile?.status === "blocked") {
      await supabase.auth.signOut();
      toast.error("Your account has been restricted. Please contact support.");
      return;
    }

    if (remember) localStorage.setItem(REMEMBER_KEY, identifier);
    else localStorage.removeItem(REMEMBER_KEY);
    toast.success("Welcome back");
  };

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] blob opacity-40 pointer-events-none" />
      <div className="w-full max-w-md relative">
        <Link to="/" className="flex items-center justify-center mb-8">
          <img src="/tesla-wordmark.png" alt="Tesla" className="h-6 w-auto" />
        </Link>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="glass rounded-3xl p-8 shadow-elegant"
        >
          <h1 className="font-display text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-sm text-muted-foreground mb-6">Log in to continue investing.</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="email">Username or Email</Label>
              <Input
                id="email"
                type="text"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="username or you@example.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle password"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="text-primary font-medium hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <Button type="submit" className="w-full shadow-elegant" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log in"}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>

      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </div>
  );
};

export default Login;
