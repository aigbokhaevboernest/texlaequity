import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";

type ForgotStep = "email" | "code" | "password";

const ForgotPasswordModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [step, setStep] = useState<ForgotStep>("email");
  const [loading, setLoading] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const resetModal = () => {
    setStep("email");
    setEmailInput("");
    setCodeInput("");
    setNewPassword("");
    setConfirmPassword("");
    setLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const callResetFn = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("password-reset", { body });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const handleEmailSubmit = async () => {
    if (!emailInput.trim()) return;
    setLoading(true);
    try {
      await callResetFn({ action: "request", email: emailInput.trim().toLowerCase() });
      setLoading(false);
      setStep("code");
      toast.success("Code sent! Check your email.");
    } catch (err: any) {
      setLoading(false);
      toast.error(err.message ?? "Something went wrong.");
    }
  };

  const handleCodeSubmit = async () => {
    if (codeInput.length !== 6) return;
    setLoading(true);
    try {
      await callResetFn({
        action: "verify",
        email: emailInput.trim().toLowerCase(),
        code: codeInput.trim(),
      });
      setLoading(false);
      setStep("password");
    } catch (err: any) {
      setLoading(false);
      toast.error(err.message ?? "Invalid or expired code.");
    }
  };

  const handlePasswordSubmit = async () => {
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
      await callResetFn({
        action: "reset",
        email: emailInput.trim().toLowerCase(),
        code: codeInput.trim(),
        new_password: newPassword,
      });
      setLoading(false);
      toast.success("Password changed successfully. You can now sign in.");
      handleClose();
    } catch (err: any) {
      setLoading(false);
      toast.error(err.message ?? "Failed to update password.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step !== "email" && (
              <button
                type="button"
                onClick={() => setStep(step === "code" ? "email" : "code")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <DialogTitle>
              {step === "email" && "Reset your password"}
              {step === "code" && "Enter your code"}
              {step === "password" && "Set new password"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          {step === "email" && (
            <>
              <p className="text-sm text-muted-foreground">
                Enter the email address on your account and we'll send you a reset code.
              </p>
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email address</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="you@example.com"
                  onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
                />
              </div>
              <Button onClick={handleEmailSubmit} disabled={loading || !emailInput.trim()} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset code"}
              </Button>
            </>
          )}

          {step === "code" && (
            <>
              <p className="text-sm text-muted-foreground">
                We sent a 6-digit code to <strong>{emailInput}</strong>. Enter it below.
              </p>
              <div className="space-y-2">
                <Label htmlFor="reset-code">6-digit code</Label>
                <Input
                  id="reset-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="text-center text-xl tracking-widest font-mono"
                  onKeyDown={(e) => e.key === "Enter" && handleCodeSubmit()}
                />
              </div>
              <Button onClick={handleCodeSubmit} disabled={loading || codeInput.length !== 6} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify code"}
              </Button>
            </>
          )}

          {step === "password" && (
            <>
              <p className="text-sm text-muted-foreground">
                Choose a new password. Must be at least 8 characters.
              </p>
              <div className="space-y-2">
                <Label htmlFor="new-pwd">New password</Label>
                <div className="relative">
                  <Input
                    id="new-pwd"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-pwd">Confirm new password</Label>
                <div className="relative">
                  <Input
                    id="confirm-pwd"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                onClick={handlePasswordSubmit}
                disabled={loading || !newPassword || !confirmPassword}
                className="w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Change password"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordModal;
