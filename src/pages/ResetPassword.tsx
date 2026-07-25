import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Zap, Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";

const ResetPassword = () => {
  const nav = useNavigate();
  const location = useLocation();
  const state = location.state as { email?: string; code?: string } | null;
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const ready = !!state?.email && !!state?.code;

  const callResetFn = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("password-reset", { body });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await callResetFn({
        action: "reset",
        email: state!.email,
        code: state!.code,
        new_password: password,
      });
      setLoading(false);
      toast.success("Password updated — you can now log in");
      nav("/login", { replace: true });
    } catch (err: any) {
      setLoading(false);
      toast.error(err.message ?? "Couldn't update password");
    }
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
          <h1 className="font-display text-3xl font-light mb-2">Set a new password</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {ready
              ? "Choose a strong password you haven't used before."
              : "Start the reset process from the login page to continue."}
          </p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="pwd">New password</Label>
              <div className="relative">
                <Input
                  id="pwd"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  disabled={!ready}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle password"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type={show ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                placeholder="Repeat password"
                disabled={!ready}
              />
            </div>

            <Button type="submit" className="w-full shadow-elegant" disabled={!ready || loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update password"}
            </Button>
          </form>

          <Link
            to={ready ? "/login" : "/forgot-password"}
            className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {ready ? "Back to log in" : "Start over"}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
