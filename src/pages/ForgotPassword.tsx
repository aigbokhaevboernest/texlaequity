import BrandLogo from "@/components/BrandLogo";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "@/lib/sendEmail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";

const emailSchema = z.string().trim().email("Enter a valid email").max(255);

type Step = "email" | "code" | "password";

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const ForgotPassword = () => {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    // Only a valid email is accepted — anything else is rejected up front.
    const parsed = emailSchema.safeParse(cleanEmail);
    if (!parsed.success) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      // Check whether this email belongs to an existing account before
      // generating/sending a code.
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", parsed.data)
        .maybeSingle();

      if (profileError) throw new Error(profileError.message);

      if (!profile) {
        setLoading(false);
        toast.error("No account found with that email");
        return;
      }

      const resetCode = generateCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const { error: insertError } = await supabase.from("password_reset_codes").insert({
        email: parsed.data,
        code: resetCode,
        expires_at: expiresAt,
      });
      if (insertError) throw new Error(insertError.message);

      await sendEmail({
        email: parsed.data,
        subject: "Your password reset code",
        message: `<p>Your password reset code is:</p><p style="font-size:24px; font-weight:bold; letter-spacing:4px;">${resetCode}</p><p>This code expires in 10 minutes.</p>`,
      });

      setEmail(parsed.data);
      setLoading(false);
      setStep("code");
      toast.success("Code sent — check your inbox");
    } catch (err: any) {
      setLoading(false);
      toast.error(err.message ?? "Something went wrong");
    }
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("password_reset_codes")
        .select("*")
        .eq("email", email.trim().toLowerCase())
        .eq("code", code.trim())
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) throw new Error("Invalid or expired code");

      setLoading(false);
      setStep("password");
    } catch (err: any) {
      setLoading(false);
      toast.error(err.message ?? "Invalid or expired code");
    }
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("reset_password_with_code", {
        p_email: email.trim().toLowerCase(),
        p_code: code.trim(),
        p_new_password: newPassword,
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setLoading(false);
      toast.success("Password changed successfully. You can now sign in.");
      nav("/login", { replace: true });
    } catch (err: any) {
      setLoading(false);
      toast.error(err.message ?? "Failed to update password.");
    }
  };

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] blob opacity-40 pointer-events-none" />
      <div className="w-full max-w-md relative">
        <Link to="/" className="flex items-center justify-center mb-8">
          <BrandLogo className="h-4 w-auto" />
        </Link>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="glass rounded-3xl p-8 shadow-elegant"
        >
          {step === "email" && (
            <>
              <h1 className="font-display text-3xl font-light mb-2">Reset your password</h1>
              <p className="text-sm text-muted-foreground mb-6">
                Enter the email address on your account and we'll send you a 6-digit reset code.
              </p>
              <form onSubmit={submitEmail} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <Button type="submit" className="w-full shadow-elegant" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send reset code"}
                </Button>
              </form>
            </>
          )}

          {step === "code" && (
            <>
              <h1 className="font-display text-3xl font-light mb-2">Enter your code</h1>
              <p className="text-sm text-muted-foreground mb-6">
                We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>.
              </p>
              <form onSubmit={submitCode} className="space-y-4">
                <div>
                  <Label htmlFor="code">6-digit code</Label>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="text-center text-xl tracking-widest font-mono"
                    required
                  />
                </div>
                <Button type="submit" className="w-full shadow-elegant" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify code"}
                </Button>
              </form>
              <button
                type="button"
                onClick={() => setStep("email")}
                className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Use a different email
              </button>
            </>
          )}

          {step === "password" && (
            <>
              <h1 className="font-display text-3xl font-light mb-2">Set new password</h1>
              <p className="text-sm text-muted-foreground mb-6">
                Choose a new password. Must be at least 8 characters.
              </p>
              <form onSubmit={submitPassword} className="space-y-4">
                <div>
                  <Label htmlFor="new-pwd">New password</Label>
                  <div className="relative">
                    <Input
                      id="new-pwd"
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirm-pwd">Confirm new password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-pwd"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full shadow-elegant" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Change password"}
                </Button>
              </form>
            </>
          )}

          <Link
            to="/login"
            className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to log in
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
