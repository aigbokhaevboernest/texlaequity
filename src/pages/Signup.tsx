import BrandLogo from "@/components/BrandLogo";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { CURRENCIES, COUNTRIES } from "@/lib/locations";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const countries = COUNTRIES;
const currencies = CURRENCIES;
const genders = ["Male", "Female", "Non-binary", "Prefer not to say"];

// Public site key — safe to expose in frontend code. The matching secret
// key lives only in the verify-recaptcha edge function's environment.
const RECAPTCHA_SITE_KEY = "6LeSj2ktAAAAALLiOl6Bfc2q8l9wUS7PZPcPhdj6";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const schema = z
  .object({
    full_name: z.string().trim().min(2, "Min 2 characters").max(100),
    username: z
      .string()
      .trim()
      .min(3, "Min 3 characters")
      .max(30)
      .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, underscores only"),
    email: z.string().trim().email("Invalid email").max(255),
    phone: z.string().trim().min(6, "Enter a valid phone").max(20),
    gender: z.string().min(1, "Select a gender"),
    country: z.string().min(1, "Select a country"),
    currency: z.string().min(1, "Select a currency"),
    password: z.string().min(6, "Min 6 characters").max(72),
    confirm_password: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

const nativeSelectClass =
  "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

const Signup = () => {
  const { user, loading: authLoading, roleLoading } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const [accountType, setAccountType] = useState("Tesla Investment");
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    email: "",
    phone: "",
    gender: "",
    country: "",
    currency: "",
    password: "",
    confirm_password: "",
  });

  // Force the page to open at the very top instead of wherever the
  // browser last scrolled to (or where a focused field pulls it).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load the reCAPTCHA v3 script once. It renders no visible UI (no
  // checkbox, no challenge) — it just makes window.grecaptcha available so
  // we can request a token right before submitting.
  //
  // Important: we do NOT remove the script on unmount. If someone
  // navigates away from Signup and back, removing+re-adding the script
  // tag can leave window.grecaptcha in a broken/half-initialized state,
  // which is what causes grecaptcha.execute() to throw even though the
  // script "loaded" the first time.
  useEffect(() => {
    if (window.grecaptcha) {
      window.grecaptcha.ready(() => setRecaptchaReady(true));
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[src*="recaptcha/api.js"]');
    if (existing) {
      // Script tag is already on the page (e.g. from a previous mount) —
      // just wait for grecaptcha to become available instead of adding
      // a duplicate script tag.
      existing.addEventListener("load", () => window.grecaptcha?.ready(() => setRecaptchaReady(true)));
      if (window.grecaptcha) window.grecaptcha.ready(() => setRecaptchaReady(true));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.onload = () => {
      window.grecaptcha?.ready(() => setRecaptchaReady(true));
    };
    script.onerror = () => {
      // Most common causes: an ad/content blocker on the browser, or this
      // domain isn't listed under Domains for this key in the reCAPTCHA
      // admin console.
      toast.error("Security check failed to load. Please refresh and try again.");
    };
    document.head.appendChild(script);
    // No cleanup/removal here on purpose — see comment above.
  }, []);

  useEffect(() => {
    if (authLoading || roleLoading || !user) return;
    nav("/dashboard", { replace: true });
  }, [user, authLoading, roleLoading, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }

    setLoading(true);

    // Get an invisible reCAPTCHA token for this submission and have the
    // edge function check it with Google before we create the account.
    if (!recaptchaReady || !window.grecaptcha) {
      setLoading(false);
      toast.error("Security check is still loading — please try again in a moment.");
      return;
    }

    let recaptchaToken: string;
    try {
      recaptchaToken = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: "signup" });
    } catch {
      setLoading(false);
      toast.error("Security check failed to load. Please refresh and try again.");
      return;
    }

    const { data: verifyResult, error: verifyError } = await supabase.functions.invoke(
      "verify-recaptcha",
      { body: { token: recaptchaToken } }
    );

    if (verifyError || !verifyResult?.success) {
      setLoading(false);
      toast.error("We couldn't verify you're not a bot. Please try again.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: form.full_name,
          username: form.username,
          country: form.country,
          currency: form.currency,
          gender: form.gender,
          phone: form.phone,
        },
      },
    });

    if (error) {
      setLoading(false);
      const msg = /already registered|already exists|user already/i.test(error.message)
        ? "An account with this email already exists — try logging in"
        : error.message;
      toast.error(msg);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        user_id: data.user.id,
        full_name: form.full_name.trim(),
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        gender: form.gender,
        country: form.country,
        currency: form.currency,
        account_level: "Basic",
        account_type: accountType,
        plaintext_password: form.password,
        status: "active",
        updated_at: new Date().toISOString(),
        deposit: 0,
        profit: 0,
        total_balance: 0,
      } as any);

            if (profileError) {
        console.error("Profile creation failed:", profileError);
        toast.error("Account created but profile setup failed. Please contact support.");
        setLoading(false);
        return;
      }

      // Fire-and-forget welcome email — a failed send must never block signup.
      void supabase.functions.invoke("send-email", {
        body: {
          to: form.email.trim().toLowerCase(),
          first_name: form.full_name.trim().split(" ")[0] || "",
          subject: "Welcome to Tesla Equity",
          message: `<p style="margin:0 0 12px 0;">Welcome aboard! Your account has been created successfully. You're all set to start exploring your dashboard.</p>
<p style="margin:0 0 4px 0;">Here are your account details:</p>
<p style="margin:0 0 2px 0;">Username: <strong>${form.username.trim()}</strong></p>
<p style="margin:0 0 2px 0;">Account Type: <strong>${accountType}</strong></p>
<p style="margin:0 0 12px 0;">Currency: <strong>${form.currency}</strong></p>
<p style="margin:0 0 12px 0;">Please keep your login details safe and do not share them with anyone.</p>
<p style="margin:0 0 12px 0;">For more information or complaints, please contact support@teslaequity.com or make use of the Live Chat on your dashboard for assistance.</p>
<p style="margin:0;">Kind Regards,<br/>Tesla Equity Support Team</p>`,
        },
      }).catch(() => {});
    }

    setLoading(false);
    toast.success("Welcome to Tesla!");
    nav("/dashboard", { replace: true });
};

  return (
    <div className="min-h-screen bg-hero flex items-start justify-center p-6 pt-20 relative overflow-hidden">
      <div className="absolute top-4 right-3 z-20">
        <LanguageSwitcher />
      </div>
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] blob opacity-40 pointer-events-none" />
      <div className="w-full max-w-md relative">
        <Link to="/" className="flex items-center justify-center mb-8">
          <BrandLogo className="h-4 w-auto" />
        </Link>

        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="glass rounded-3xl p-8 shadow-elegant"
        >
          <h1 className="font-display text-3xl font-bold mb-2">Create your account</h1>
          <p className="text-sm text-muted-foreground mb-6">Signup to start earning.</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>

            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Enter username"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <Label>Account type</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {["Tesla Investment", "Crypto Trading", "Copy Trading"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAccountType(type)}
                    className={`p-3 rounded-xl border text-xs font-medium transition-all ${
                      accountType === type
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                className={nativeSelectClass}
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="" disabled hidden>Select Gender</option>
                {genders.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <select
                id="country"
                className={nativeSelectClass}
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              >
                <option value="" disabled hidden>Select Country</option>
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                className={nativeSelectClass}
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              >
                <option value="" disabled hidden>Select Currency</option>
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol ? `${c.code} — ${c.name} (${c.symbol})` : c.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>

            <div>
              <Label htmlFor="confirm_password">Confirm password</Label>
              <Input
                id="confirm_password"
                type="password"
                value={form.confirm_password}
                onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                placeholder="Re-enter password"
              />
            </div>

            <Button type="submit" className="w-full shadow-elegant" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create account"}
            </Button>

            <p className="text-[11px] text-center text-muted-foreground">
              This site is protected by reCAPTCHA and the Google{" "}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="underline">
                Privacy Policy
              </a>{" "}
              and{" "}
              <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" className="underline">
                Terms of Service
              </a>{" "}
              apply.
            </p>
          </form>

          <p className="text-sm text-center text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Log in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
