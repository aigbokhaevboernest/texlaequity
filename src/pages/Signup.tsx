import { useState, useEffect } from “react”;
import { Link, useNavigate } from “react-router-dom”;
import { z } from “zod”;
import { supabase } from “@/integrations/supabase/client”;
import { Button } from “@/components/ui/button”;
import { Input } from “@/components/ui/input”;
import { Label } from “@/components/ui/label”;
import { toast } from “sonner”;
import { Zap, Loader2, Bitcoin, Copy, ChevronRight } from “lucide-react”;
import { useAuth } from “@/hooks/useAuth”;

const countries = [
“Afghanistan”, “Albania”, “Algeria”, “American Samoa”, “Andorra”,
“Angola”, “Antigua and Barbuda”, “Argentina”, “Armenia”, “Australia”,
“Austria”, “Azerbaijan”, “Bahamas”, “Bahrain”, “Bangladesh”, “Barbados”,
“Belarus”, “Belgium”, “Belize”, “Benin”, “Bhutan”, “Bolivia”,
“Bosnia and Herzegovina”, “Botswana”, “Brazil”, “Brunei”, “Bulgaria”,
“Burkina Faso”, “Burundi”, “Cambodia”, “Cameroon”, “Canada”, “Chad”,
“Chile”, “China”, “Colombia”, “Congo”, “Costa Rica”, “Croatia”, “Cuba”,
“Cyprus”, “Czech Republic”, “Denmark”, “Dominican Republic”, “Ecuador”,
“Egypt”, “El Salvador”, “Estonia”, “Ethiopia”, “Fiji”, “Finland”,
“France”, “Gabon”, “Gambia”, “Georgia”, “Germany”, “Ghana”, “Greece”,
“Guatemala”, “Guinea”, “Guyana”, “Haiti”, “Honduras”, “Hong Kong”,
“Hungary”, “Iceland”, “India”, “Indonesia”, “Iran”, “Iraq”, “Ireland”,
“Israel”, “Italy”, “Jamaica”, “Japan”, “Jordan”, “Kazakhstan”, “Kenya”,
“Kuwait”, “Laos”, “Latvia”, “Lebanon”, “Liberia”, “Libya”, “Lithuania”,
“Luxembourg”, “Madagascar”, “Malawi”, “Malaysia”, “Maldives”, “Mali”,
“Malta”, “Mauritius”, “Mexico”, “Moldova”, “Mongolia”, “Montenegro”,
“Morocco”, “Mozambique”, “Myanmar”, “Namibia”, “Nepal”, “Netherlands”,
“New Zealand”, “Nicaragua”, “Niger”, “Nigeria”, “North Macedonia”,
“Norway”, “Oman”, “Pakistan”, “Palestine”, “Panama”, “Paraguay”, “Peru”,
“Philippines”, “Poland”, “Portugal”, “Qatar”, “Romania”, “Russia”,
“Rwanda”, “Saudi Arabia”, “Senegal”, “Serbia”, “Sierra Leone”,
“Singapore”, “Slovakia”, “Slovenia”, “Somalia”, “South Africa”,
“South Korea”, “Spain”, “Sri Lanka”, “Sudan”, “Sweden”, “Switzerland”,
“Syria”, “Taiwan”, “Tanzania”, “Thailand”, “Togo”, “Trinidad and Tobago”,
“Tunisia”, “Turkey”, “Uganda”, “Ukraine”, “United Arab Emirates”,
“United Kingdom”, “United States”, “Uruguay”, “Uzbekistan”, “Venezuela”,
“Vietnam”, “Yemen”, “Zambia”, “Zimbabwe”
];

const currencies = [“USD”, “EUR”, “GBP”, “AUD”, “CAD”, “NGN”, “AED”, “JPY”];

const genders = [“Male”, “Female”, “Non-binary”, “Prefer not to say”];

const accountTypes = [
{
id: “tesla”,
label: “Tesla Investment”,
desc: “Invest in Tesla stock & EV markets”,
icon: Zap,
color: “from-red-500/20 to-rose-500/10”,
border: “border-red-500/40”,
iconColor: “text-red-400”,
glow: “shadow-red-500/20”,
},
{
id: “crypto”,
label: “Crypto Trading”,
desc: “Trade BTC, ETH & top altcoins”,
icon: Bitcoin,
color: “from-amber-500/20 to-yellow-500/10”,
border: “border-amber-500/40”,
iconColor: “text-amber-400”,
glow: “shadow-amber-500/20”,
},
{
id: “copy”,
label: “Copy Trading”,
desc: “Mirror top traders automatically”,
icon: Copy,
color: “from-sky-500/20 to-blue-500/10”,
border: “border-sky-500/40”,
iconColor: “text-sky-400”,
glow: “shadow-sky-500/20”,
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

const selectClass = “mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring”;

const Signup = () => {
const { user, loading: authLoading, roleLoading } = useAuth();
const nav = useNavigate();
const [loading, setLoading] = useState(false);
const [step, setStep] = useState<1 | 2>(1);
const [accountType, setAccountType] = useState(””);
const [form, setForm] = useState({
full_name: “”, username: “”, email: “”, password: “”,
phone: “”, gender: “Male”, country: “United States”, currency: “USD”,
});

useEffect(() => {
if (authLoading || roleLoading || !user) return;
nav(”/dashboard”, { replace: true });
}, [user, authLoading, roleLoading, nav]);

const handleTypeSelect = (id: string) => {
setAccountType(id);
setTimeout(() => setStep(2), 300);
};

const submit = async (e: React.FormEvent) => {
e.preventDefault();
if (!accountType) { toast.error(“Please select an account type”); return; }
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
    console.error("Profile creation failed:", profileError);
    toast.error("Account created but profile setup failed. Please contact support.");
    setLoading(false);
    return;
  }
}

setLoading(false);
toast.success("Welcome to TeslaVest!");
```

};

return (
<div className="min-h-screen bg-hero flex items-center justify-center p-4 relative overflow-hidden">
<div className="absolute -top-40 -right-40 w-[500px] h-[500px] blob opacity-40 pointer-events-none" />
<div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] blob opacity-20 pointer-events-none" />

```
  <div className="w-full max-w-md relative z-10">
    <Link to="/" className="flex items-center gap-2 justify-center mb-6">
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-elegant">
        <Zap className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
      </div>
      <span className="font-display font-bold text-xl">TeslaVest</span>
    </Link>

    <div className="glass rounded-3xl p-7 shadow-elegant">

      {/* Step 1 — Account Type */}
      {step === 1 && (
        <div>
          <h1 className="font-display text-2xl font-bold mb-1">Choose account type</h1>
          <p className="text-sm text-muted-foreground mb-6">Select how you want to grow your wealth.</p>

          <div className="space-y-3">
            {accountTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border bg-gradient-to-r ${type.color} ${type.border} hover:shadow-lg ${type.glow} transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-left`}
                >
                  <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center shrink-0">
                    <Icon className={`w-5 h-5 ${type.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{type.label}</p>
                    <p className="text-xs text-muted-foreground">{type.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              );
            })}
          </div>

          <p className="text-sm text-center text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Log in</Link>
          </p>
        </div>
      )}

      {/* Step 2 — Details */}
      {step === 2 && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => setStep(1)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              ← Back
            </button>
            {accountType && (() => {
              const t = accountTypes.find(t => t.id === accountType)!;
              const Icon = t.icon;
              return (
                <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border bg-gradient-to-r ${t.color} ${t.border} ${t.iconColor}`}>
                  <Icon className="w-3 h-3" />{t.label}
                </span>
              );
            })()}
          </div>

          <h1 className="font-display text-2xl font-bold mb-1">Create your account</h1>
          <p className="text-sm text-muted-foreground mb-5">Start earning in minutes.</p>

          <form onSubmit={submit} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Full name</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="John Doe" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Username</Label>
                <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="johndoe" className="mt-1" />
              </div>
            </div>

            <div>
              <Label className="text-xs">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Phone</Label>
                <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Gender</Label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={selectClass}>
                  {genders.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Password</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" className="mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Country</Label>
                <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={selectClass}>
                  <option value="">Select Your Country</option>
                  {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">Currency</Label>
                <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={selectClass}>
                  <option value="">Select Currency</option>
                  {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <Button type="submit" className="w-full shadow-elegant mt-1" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create account →"}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground mt-5">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Log in</Link>
          </p>
        </div>
      )}
    </div>
  </div>
</div>
```

);
};

export default Signup;
