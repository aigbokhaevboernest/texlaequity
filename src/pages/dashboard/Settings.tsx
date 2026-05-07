import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { CURRENCIES, COUNTRIES } from "@/lib/locations";

const genders = ["Male", "Female", "Non-binary", "Prefer not to say"];

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "", username: "", phone: "", gender: "", country: "", currency: "USD", address: "",
  });
  const [pw, setPw] = useState({ next: "", confirm: "" });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) setForm({
          full_name: data.full_name ?? "",
          username: data.username ?? "",
          phone: data.phone ?? "",
          gender: data.gender ?? "",
          country: data.country ?? "",
          currency: data.currency ?? "USD",
          address: data.address ?? "",
        });
      });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name, username: form.username, phone: form.phone,
      gender: form.gender, country: form.country, currency: form.currency, address: form.address,
    }).eq("user_id", user.id);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
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

  return (
    <div className="space-y-6">
      <div>
        <p className="label-mono text-muted-foreground mb-2">Account</p>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Settings</h1>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 max-w-2xl space-y-4">
        <h2 className="font-display text-lg font-medium mb-2">Profile</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Full name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
          <div><Label>Username</Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
          <div><Label>Email</Label><Input value={user?.email ?? ""} disabled /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div>
            <Label>Gender</Label>
            <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{genders.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Currency</Label>
            <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.code} — {c.name} ({c.symbol})</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>Country</Label>
            <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
              <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
              <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
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