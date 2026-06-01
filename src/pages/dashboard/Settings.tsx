import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { InputSkeleton } from "@/components/ui/SkeletonBlock";

import { CURRENCIES, COUNTRIES } from "@/lib/locations";

const genders = ["Male", "Female", "Non-binary", "Prefer not to say"];

const nativeSelectClass =
  "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

interface ProfileForm {
  full_name: string; username: string; phone: string; gender: string;
  country: string; currency: string; address: string;
}

const EMPTY: ProfileForm = {
  full_name: "", username: "", phone: "", gender: "", country: "", currency: "USD", address: "",
};

const cacheKey = (uid: string) => `settings:${uid}`;

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  // Hydrate synchronously from cache so fields appear instantly on refresh.
  const [form, setForm] = useState<ProfileForm | null>(() => {
    if (typeof window === "undefined" || !user) return null;
    try {
      const raw = localStorage.getItem(cacheKey(user.id));
      return raw ? { ...EMPTY, ...JSON.parse(raw) } : null;
    } catch { return null; }
  });
  const [pw, setPw] = useState({ next: "", confirm: "" });

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (!data) return;
      const next: ProfileForm = {
        full_name: data.full_name ?? "",
        username: data.username ?? "",
        phone: data.phone ?? "",
        gender: data.gender ?? "",
        country: data.country ?? "",
        currency: data.currency ?? "USD",
        address: data.address ?? "",
      };
      setForm(next);
      try { localStorage.setItem(cacheKey(user.id), JSON.stringify(next)); } catch { /* ignore */ }
    };
    load();

    // Realtime — reflect changes from admin panel or anywhere else.
    const channel = supabase
      .channel(`settings-${user.id}`)
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const update = <K extends keyof ProfileForm>(k: K, v: ProfileForm[K]) => {
    setForm((f) => (f ? { ...f, [k]: v } : { ...EMPTY, [k]: v }));
  };

  const save = async () => {
    if (!user || !form) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name, username: form.username, phone: form.phone,
      gender: form.gender, country: form.country, currency: form.currency, address: form.address,
    }).eq("user_id", user.id);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    try { localStorage.setItem(cacheKey(user.id), JSON.stringify(form)); } catch { /* ignore */ }
    toast.success("Profile updated");
  };

  const updatePw = async () => {
    if (pw.next.length < 8) { toast.error("Min 8 characters"); return; }
    if (pw.next !== pw.confirm) { toast.error("Passwords don't match"); return; }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw.next });
    setPwLoading(false);
    if (error) { toast.error(error.message); return; }
    setPw({ next: "", confirm: "" });
    toast.success("Password updated");
  };

  // Loading skeletons mirror real input layout — no blank inputs.
  if (!form) {
    return (
      <div className="space-y-6">
        <div>
          <p className="label-mono text-muted-foreground mb-2">Account</p>
          <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Settings</h1>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 max-w-2xl space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <InputSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="label-mono text-muted-foreground mb-2">Account</p>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Settings</h1>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 max-w-2xl space-y-4">
        <h2 className="font-display text-lg font-medium mb-2">Profile</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Full name</Label><Input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} /></div>
          <div><Label>Username</Label><Input value={form.username} onChange={(e) => update("username", e.target.value)} /></div>
          <div><Label>Email</Label><Input value={user?.email ?? ""} disabled /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => update("phone", e.target.value)} /></div>
          <div>
            <Label htmlFor="gender">Gender</Label>
            <select id="gender" className={nativeSelectClass} value={form.gender} onChange={(e) => update("gender", e.target.value)}>
              <option value="" disabled hidden>Select Gender</option>
              {genders.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <select id="currency" className={nativeSelectClass} value={form.currency} onChange={(e) => update("currency", e.target.value)}>
              {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name} ({c.symbol})</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="country">Country</Label>
            <select id="country" className={nativeSelectClass} value={form.country} onChange={(e) => update("country", e.target.value)}>
              <option value="" disabled hidden>Select country</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2"><Label>Address</Label><Input value={form.address} onChange={(e) => update("address", e.target.value)} /></div>
        </div>
        <Button onClick={save} disabled={loading} className="rounded-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save changes"}
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 max-w-2xl space-y-4">
        <h2 className="font-display text-lg font-medium mb-2">Password</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>New password</Label><Input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></div>
          <div><Label>Confirm password</Label><Input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></div>
        </div>
        <Button onClick={updatePw} disabled={pwLoading} variant="outline" className="rounded-full">
          {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update password"}
        </Button>
      </div>
    </div>
  );
}
