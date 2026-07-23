import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, Loader2, ShieldCheck, Clock, X, FileText } from "lucide-react";
import { validateFile, DOC_TYPES } from "@/lib/uploads";

interface Submission {
  id: string; document_type: string; status: string; created_at: string;
  rejection_reason: string | null;
}

export default function Kyc() {
  const { user } = useAuth();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loading, setLoading] = useState(false);

  const [docType, setDocType] = useState("Passport");
  const [docNumber, setDocNumber] = useState("");
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoadingStatus(true);
    supabase.from("kyc_submissions").select("id, document_type, status, created_at, rejection_reason")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => {
        setSubmission((data as Submission) ?? null);
        setLoadingStatus(false);
      });
  }, [user]);

  const upload = async (file: File, key: string) => {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
    const path = `${user!.id}/${Date.now()}-${key}-${safeName}`;
    const { error } = await supabase.storage
      .from("kyc-documents")
      .upload(path, file, { upsert: true, contentType: file.type || "application/octet-stream" });
    if (error) throw new Error(`Upload failed (${key}): ${error.message}`);
    return path;
  };

  const submit = async () => {
  if (!user) return;
  if (!docNumber || !front || !selfie) { toast.error("Please fill all required fields"); return; }
  setLoading(true);
  try {
    const id_front_url = await upload(front, "front");
    const id_back_url = back ? await upload(back, "back") : null;
    const selfie_url = await upload(selfie, "selfie");
    const { data, error } = await supabase.from("kyc_submissions").insert({
      user_id: user.id, document_type: docType, document_number: docNumber,
      id_front_url, id_back_url, selfie_url, status: "pending",
    }).select("id, document_type, status, created_at, rejection_reason").maybeSingle();
    if (error) throw error;
    setSubmission((data as Submission) ?? {
      id: crypto.randomUUID(),
      document_type: docType,
      status: "pending",
      created_at: new Date().toISOString(),
      rejection_reason: null,
    });
    toast.success("KYC submitted. Pending review.");
    } catch (e) {
    toast.error(e instanceof Error ? e.message : "Upload failed");
  } finally {

    setLoading(false);
  }
};


  const FileSlot = ({ label, file, onChange, required }: { label: string; file: File | null; onChange: (f: File | null) => void; required?: boolean }) => (
    <div>
      <Label>{label} {required && <span className="text-primary">*</span>}</Label>
      {file ? (
        <div className="mt-1 rounded-xl border border-border overflow-hidden bg-muted/40">
          {file.type.startsWith("image/") ? (
            <img src={URL.createObjectURL(file)} alt={label} className="w-full max-h-48 object-contain bg-muted" />
          ) : (
            <div className="flex items-center justify-center py-8 bg-muted">
              <FileText className="w-10 h-10 text-muted-foreground" />
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-2 text-[12px] bg-card">
            <span className="truncate flex-1">{file.name}</span>
            <span className="text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</span>
            <button type="button" onClick={() => onChange(null)} className="hover:text-red-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <label className="mt-1 flex items-center gap-3 rounded-xl border border-dashed border-border p-3 cursor-pointer hover:border-foreground/40">
          <Upload className="w-4 h-4 text-muted-foreground" />
          <span className="text-[13px] truncate flex-1 text-muted-foreground">Click to upload (JPG/PNG/PDF, max 8MB)</span>
          <input
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              if (!f) return;
              const err = validateFile(f, { types: DOC_TYPES });
              if (err) { toast.error(err); return; }
              onChange(f);
            }}
          />
        </label>
      )}
    </div>
  );

  const showStatusCard = !!submission && submission.status !== "rejected";
  const showForm = !loadingStatus && (!submission || submission.status === "rejected");

  return (
    <div className="space-y-6">
      <div>
        <p className="label-mono text-muted-foreground mb-2">Identity verification</p>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em]">AML / KYC</h1>
        <p className="text-muted-foreground text-[14px] mt-1">To maintain a secure and transparent financial process, you are required to confirm your identity. </p>
      </div>

      {loadingStatus && (
        <div className="rounded-2xl border border-border bg-card p-5 max-w-2xl flex items-center gap-4">
          <div className="w-5 h-5 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 rounded bg-muted animate-pulse" />
            <div className="h-3 w-56 rounded bg-muted animate-pulse" />
          </div>
        </div>
      )}

      {!loadingStatus && showStatusCard && submission && (
        <div className={`rounded-2xl border p-5 max-w-2xl flex items-center gap-4 ${
          submission.status === "approved" ? "border-emerald-500/30 bg-emerald-500/5" :
          submission.status === "rejected" ? "border-red-500/30 bg-red-500/5" :
          "border-yellow-500/30 bg-yellow-500/5"
        }`}>
          {submission.status === "approved" ? <ShieldCheck className="w-5 h-5 text-emerald-600" /> :
           submission.status === "rejected" ? <X className="w-5 h-5 text-red-600" /> :
           <Clock className="w-5 h-5 text-yellow-600" />}
          <div className="flex-1">
            <p className="font-medium text-[14px] capitalize">Status: {submission.status}</p>
            <p className="text-[12px] text-muted-foreground">
              {submission.document_type} · submitted {new Date(submission.created_at).toLocaleDateString()}
            </p>
            {submission.rejection_reason && (
              <p className="text-[12px] text-red-700 mt-1">Reason: {submission.rejection_reason}</p>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <div className="rounded-2xl border border-border bg-card p-6 max-w-2xl space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="kyc-doc">Document type</Label>
              <select id="kyc-doc" value={docType} onChange={(e) => setDocType(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="Passport">Passport</option>
                <option value="National ID">National ID</option>
                <option value="Driver License">Driver's license</option>
              </select>
            </div>
            <div>
              <Label>Document number</Label>
              <Input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} />
            </div>
          </div>

          <FileSlot label="ID front" file={front} onChange={setFront} required />
          <FileSlot label="ID back (if applicable)" file={back} onChange={setBack} />
          <FileSlot label="Selfie holding ID" file={selfie} onChange={setSelfie} required />

          <Button onClick={submit} disabled={loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit for verification"}
          </Button>
        </div>
      )}
    </div>
  );
}
