import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "@/lib/sendEmail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Zap, Loader2, ArrowLeft } from "lucide-react";

const emailSchema = z.string().trim().email("Enter a valid email").max(255);

type Step = "email" | "code";

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const ForgotPassword = () => {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const parsed = emailSchema.safeParse(cleanEmail);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
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

      await supabase.from("password_reset_codes").update({ used: true }).eq("id", data.id);

      setLoading(false);
      nav("/reset-password", { state: { email: email.trim().toLowerCase(), code: code.trim() } });
    } catch (err: any) {
      setLoading(false);
      toast.error(err.message ?? "Invalid or expired code");
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
          <span className="font-display font-bold text-xl">Tesla Equity</span>
        </Link>

        <div className="glass rounded-3xl p-8 shadow-elegant">
          {step === "email" && (
            <>
              <h1 className="font-display text-3xl font-light mb-2">Reset your password</h1>
              <p className="text-sm text-muted-foreground mb-6">
                Enter your email and we'll send you a 6-digit reset code.
              </p>
              <form onSubmit={submitEmail} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
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
                className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Use a different email
              </button>
            </>
          )}

          <Link
            to="/login"
            className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to log in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
