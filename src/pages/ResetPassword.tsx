import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Zap, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const pwdSchema = z
  .object({
    pwd: z.string().min(8, "Password must be at least 8 characters").max(72, "Password too long"),
    confirm: z.string(),
  })
  .refine((d) => d.pwd === d.confirm, { message: "Passwords don't match", path: ["confirm"] });

const ResetPassword = () => {
  const nav = useNavigate();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when the user lands from a recovery link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // Also handle case where session is already established (hash already processed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = pwdSchema.safeParse({ pwd, confirm });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.pwd });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDone(true);
    toast.success("Password updated");
    setTimeout(() => nav(isAdmin ? "/admin" : "/dashboard"), 1200);
  };

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] blob opacity-40 pointer-events-none" />
      <div className="w-full max-w-md relative">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-elegant">
            <Zap className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-xl">TeslaVest</span>
        </Link>

        <div className="glass rounded-3xl p-8 shadow-elegant">
          {done ? (
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-7 h-7 text-success" />
              </div>
              <h1 className="font-display text-2xl font-light mb-2">Password updated</h1>
              <p className="text-sm text-muted-foreground">Redirecting you to your dashboard…</p>
            </div>
          ) : !ready ? (
            <div className="text-center py-6">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Verifying your reset link… If nothing happens, request a new link from{" "}
                <Link to="/forgot-password" className="text-primary hover:underline">Forgot password</Link>.
              </p>
            </div>
          ) : (
            <>
              <h1 className="font-display text-3xl font-light mb-2">Set a new password</h1>
              <p className="text-sm text-muted-foreground mb-6">Choose a strong password you haven't used before.</p>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <Label htmlFor="pwd">New password</Label>
                  <Input
                    id="pwd"
                    type="password"
                    autoComplete="new-password"
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    placeholder="Min 8 characters"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="confirm">Confirm new password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full shadow-elegant" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update password"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;