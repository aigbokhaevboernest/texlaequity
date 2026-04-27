import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, X, FileImage } from "lucide-react";

interface Kyc {
  id: string; user_id: string; document_type: string; document_number: string | null;
  id_front_url: string | null; id_back_url: string | null; selfie_url: string | null;
  status: string; created_at: string;
  profile?: { full_name: string | null; username: string | null };
}

const TONES: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700 border border-yellow-500/20",
  approved: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-700 border border-red-500/20",
};

export default function AdminKyc() {
  const [rows, setRows] = useState<Kyc[]>([]);
  const [signed, setSigned] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from("kyc_submissions").select("*").order("created_at", { ascending: false });
    if (!data) return;
    const ids = Array.from(new Set(data.map((r) => r.user_id)));
    const { data: profs } = await supabase.from("profiles").select("user_id, full_name, username").in("user_id", ids);
    const map = new Map((profs ?? []).map((p) => [p.user_id, p]));
    const merged = data.map((r: any) => ({ ...r, profile: map.get(r.user_id) })) as Kyc[];
    setRows(merged);

    // Sign all URLs in parallel
    const paths: string[] = [];
    merged.forEach((r) => {
      [r.id_front_url, r.id_back_url, r.selfie_url].forEach((p) => p && paths.push(p));
    });
    if (paths.length) {
      const { data: urls } = await supabase.storage.from("kyc-documents").createSignedUrls(paths, 3600);
      const next: Record<string, string> = {};
      (urls ?? []).forEach((u: any) => { if (u.signedUrl) next[u.path] = u.signedUrl; });
      setSigned(next);
    }
  };

  useEffect(() => { load(); }, []);

  const update = async (k: Kyc, status: "approved" | "rejected") => {
    setBusy(k.id);
    const { error } = await supabase.from("kyc_submissions").update({ status }).eq("id", k.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`KYC ${status}`);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em]">KYC review</h1>
        <p className="text-muted-foreground text-[13px] mt-1">{rows.filter((r) => r.status === "pending").length} pending</p>
      </div>

      <div className="space-y-3">
        {rows.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground text-sm">
            No KYC submissions yet.
          </div>
        )}
        {rows.map((k) => (
          <div key={k.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
              <div>
                <p className="font-medium">{k.profile?.full_name || k.profile?.username || k.user_id.slice(0, 8)}</p>
                <p className="text-[12px] text-muted-foreground capitalize">{k.document_type.replace("_", " ")} · {k.document_number || "no number"}</p>
                <p className="text-[11px] text-muted-foreground">{new Date(k.created_at).toLocaleString()}</p>
              </div>
              <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full ${TONES[k.status] ?? "bg-muted"}`}>{k.status}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: "ID front", path: k.id_front_url },
                { label: "ID back", path: k.id_back_url },
                { label: "Selfie", path: k.selfie_url },
              ].map((d) => (
                <a key={d.label} href={d.path ? signed[d.path] : "#"} target="_blank" rel="noreferrer"
                  className="aspect-[4/3] rounded-lg border border-border bg-muted/40 overflow-hidden flex items-center justify-center hover:border-foreground/40 transition-colors group">
                  {d.path && signed[d.path] ? (
                    <img src={signed[d.path]} alt={d.label} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-muted-foreground text-[11px]">
                      <FileImage className="w-5 h-5 mx-auto mb-1" />
                      {d.label}
                    </div>
                  )}
                </a>
              ))}
            </div>

            {k.status === "pending" && (
              <div className="flex gap-2">
                <Button size="sm" disabled={busy === k.id} onClick={() => update(k, "approved")} className="bg-emerald-600 hover:bg-emerald-700">
                  <Check className="w-3.5 h-3.5 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="outline" disabled={busy === k.id} onClick={() => update(k, "rejected")}>
                  <X className="w-3.5 h-3.5 mr-1" /> Reject
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}