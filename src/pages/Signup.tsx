import BrandLogo from "@/components/BrandLogo";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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

const RECAPTCHA_SITE_KEY = "6Lfvsm0tAAAAABVVIirzrrbjdg40WLnjtJULU7SL";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      render: (
        container: string | HTMLElement,
        params: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => number;
      getResponse: (widgetId?: number) => string;
      reset: (widgetId?: number) => void;
    };
  }
}

const nativeSelectClass =
  "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

// Inline field error component
const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-[11px] text-red-500 mt-1">{msg}</p> : null;

const Signup = () => {
  const { user, loading: authLoading, roleLoading } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [widgetId, setWidgetId] = useState<number | null>(null);
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

  // Per-field inline errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const renderWidget = () => {
      if (!window.grecaptcha) return;
      const container = document.getElementById("recaptcha-container");
      if (!container || container.childElementCount > 0) return;
      const id = window.grecaptcha.render(container, {
        sitekey: RECAPTCHA_SITE_KEY,
        callback: (token: string) => setRecaptchaToken(token),
        "expired-callback": () => setRecaptchaToken(null),
        "error-callback": () => setRecaptchaToken(null),
      });
      setWidgetId(id);
      setRecaptchaReady(true);
    };

    if (window.grecaptcha) {
      window.grecaptcha.ready(renderWidget);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[src*="recaptcha/api.js"]');
    if (existing) {
      existing.addEventListener("load", () => window.grecaptcha?.ready(renderWidget));
      return;
    }

    const loadScript = (src: string, onFail: () => void) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => window.grecaptcha?.ready(renderWidget);
      script.onerror = () => { script.remove(); onFail(); };
      document.head.appendChild(script);
    };

    loadScript("https://www.google.com/recaptcha/api.js?render=explicit", () => {
      loadScript("https://www.recaptcha.net/recaptcha/api.js?render=explicit", () => {
        toast.error("Security check failed to load. Please refresh and try again.");
      });
    });
  }, []);

  useEffect(() => {
    if (authLoading || roleLoading || !user) return;
    nav("/dashboard", { replace: true });
  }, [user, authLoading, roleLoading, nav]);

  // Validate a single field and return error string or ""
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "full_name":
        if (!value.trim()) return "Full name is required";
        if (value.trim().length < 2) return "Full name must be at least 2 characters";
        return "";
      case "username":
        if (!value.trim()) return "Username is required";
        if (value.trim().length < 2) return "Username must be at least 2 characters";
        return "";
      case "email":
        if (!value.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Enter a valid email address";
        return "";
      case "phone":
        if (!value.trim()) return "Phone number is required";
        if (value.trim().length < 6) return "Enter a valid phone number";
        return "";
      case "gender":
        if (!value) return "Please select a gender";
        return "";
      case "country":
        if (!value) return "Please select a country";
        return "";
      case "currency":
        if (!value) return "Please select a currency";
        return "";
      case "password":
        if (!value) return "Password is required";
        if (value.length < 6) return "Password must be at least 6 characters";
        return "";
      case "confirm_password":
        if (!value) return "Please confirm your password";
        if (value !== form.password) return "Passwords do not match";
        return "";
      default:
        return "";
    }
  };

  const handleChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error on change, re-validate if field already had an error
    const err = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  // Validate all fields, return true if valid
  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};
    let valid = true;
    (Object.keys(form) as Array<keyof typeof form>).forEach((key) => {
      const err = validateField(key, form[key]);
      if (err) { newErrors[key] = err; valid = false; }
    });
    setErrors(newErrors);
    // Scroll to first error
    if (!valid) {
      const firstKey = Object.keys(newErrors)[0];
      const el = document.getElementById(firstKey);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return valid;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAll()) return;

    setLoading(true);

    if (!recaptchaReady || !recaptchaToken) {
      setLoading(false);
      toast.error("Please check the box to confirm you're not a robot.");
      return;
    }

    const { data: verifyResult, error: verifyError } = await supabase.functions.invoke(
      "verify-recaptcha",
      { body: { token: recaptchaToken } }
    );

    if (verifyError || !verifyResult?.success) {
      setLoading(false);
      if (widgetId !== null) window.grecaptcha?.reset(widgetId);
      setRecaptchaToken(null);
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
      setErrors((prev) => ({ ...prev, email: msg }));
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

      void supabase.functions.invoke("send-email", {
        body: {
          email: form.email.trim().toLowerCase(),
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

          <form onSubmit={submit} className="space-y-4" noValidate>

            <div>
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                placeholder="Enter full name"
                className={errors.full_name ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              <FieldError msg={errors.full_name} />
            </div>

            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => handleChange("username", e.target.value)}
                placeholder="Enter username"
                className={errors.username ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              <FieldError msg={errors.username} />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Enter email"
                className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              <FieldError msg={errors.email} />
            </div>

            <div>
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Enter phone number"
                className={errors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              <FieldError msg={errors.phone} />
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
                className={`${nativeSelectClass} ${errors.gender ? "border-red-500" : ""}`}
                value={form.gender}
                onChange={(e) => handleChange("gender", e.target.value)}
              >
                <option value="" disabled hidden>Select Gender</option>
                {genders.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <FieldError msg={errors.gender} />
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <select
                id="country"
                className={`${nativeSelectClass} ${errors.country ? "border-red-500" : ""}`}
                value={form.country}
                onChange={(e) => handleChange("country", e.target.value)}
              >
                <option value="" disabled hidden>Select Country</option>
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <FieldError msg={errors.country} />
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                className={`${nativeSelectClass} ${errors.currency ? "border-red-500" : ""}`}
                value={form.currency}
                onChange={(e) => handleChange("currency", e.target.value)}
              >
                <option value="" disabled hidden>Select Currency</option>
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol ? `${c.code} — ${c.name} (${c.symbol})` : c.code}
                  </option>
                ))}
              </select>
              <FieldError msg={errors.currency} />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="Enter password"
                className={errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              <FieldError msg={errors.password} />
            </div>

            <div>
              <Label htmlFor="confirm_password">Confirm password</Label>
              <Input
                id="confirm_password"
                type="password"
                value={form.confirm_password}
                onChange={(e) => handleChange("confirm_password", e.target.value)}
                placeholder="Re-enter password"
                className={errors.confirm_password ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              <FieldError msg={errors.confirm_password} />
            </div>

            <div id="recaptcha-container" className="flex justify-center py-1" />

            <Button type="submit" className="w-full shadow-elegant" disabled={loading || !recaptchaToken}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create account"}
            </Button>
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
