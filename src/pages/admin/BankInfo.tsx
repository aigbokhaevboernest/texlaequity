import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Landmark } from "lucide-react";

interface BankInfo {
  id?: string;
  bank_name: string; account_name: string; account_number: string;
  routing_number: string; swift_code: string; notes: string | null;
}

const empty: BankInfo = {
  bank_name: "", account_name: "", account_number: "",
  routing_number: "", swift_code: "", notes: "",
};

export default function AdminBankInfo() {
  const [info, setInfo] = useState<BankInfo>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("bank_deposit_info").select("*").limit(1).maybeSingle()
      .then(({ data }) => { if (data) setInfo(data as BankInfo); setLoading(false); });
  }, []);

  const save = async () => {
    setSaving(true);
    const payload = { ...info, updated_at: new Date().toISOString() };
    const { error } = info.id
      ? await supabase.from("bank_deposit_info").update(payload).eq("id", info.id)
      : await supabase.from("bank_deposit_info").insert(payload);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Bank info updated");
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em] flex items-center gap-2"><Landmark className="w-6 h-6" /> Bank Deposit Info</h1>
        <p className="text-muted-foreground text-[13px] mt-1">This is shown to all users on the deposit page.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div><Label>Bank name</Label><Input value={info.bank_name} onChange={(e) => setInfo({ ...info, bank_name: e.target.value })} /></div>
        <div><Label>Account name</Label><Input value={info.account_name} onChange={(e) => setInfo({ ...info, account_name: e.target.value })} /></div>
        <div><Label>Account number</Label><Input value={info.account_number} onChange={(e) => setInfo({ ...info, account_number: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Routing</Label><Input value={info.routing_number} onChange={(e) => setInfo({ ...info, routing_number: e.target.value })} /></div>
          <div><Label>SWIFT</Label><Input value={info.swift_code} onChange={(e) => setInfo({ ...info, swift_code: e.target.value })} /></div>
        </div>
        <div><Label>Notes (optional)</Label><Textarea value={info.notes ?? ""} onChange={(e) => setInfo({ ...info, notes: e.target.value })} rows={2} /></div>
        <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}</Button>
      </div>
    </div>
  );
}
