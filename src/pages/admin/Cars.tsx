import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatUSD, carImages } from "@/lib/cars";
import { Loader2, Pencil, Plus, Trash2, Upload, Car as CarIcon } from "lucide-react";
import { validateFile, IMAGE_TYPES } from "@/lib/uploads";

interface Car {
  id: string;
  model: string;
  tagline: string | null;
  price_usd: number;
  range_mi: number | null;
  top_speed: number | null;
  zero_to_sixty: number | null;
  image_url: string | null;
  sort_order: number;
}

const empty: Omit<Car, "id"> = {
  model: "", tagline: "", price_usd: 0, range_mi: 0, top_speed: 0, zero_to_sixty: 0, image_url: "", sort_order: 0,
};

export default function AdminCars() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Car | null>(null);
  const [form, setForm] = useState<Omit<Car, "id">>(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("tesla_cars").select("*").order("sort_order");
    setCars((data ?? []) as Car[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };
  const openEdit = (c: Car) => {
    setEditing(c);
    setForm({
      model: c.model, tagline: c.tagline ?? "", price_usd: Number(c.price_usd),
      range_mi: c.range_mi ?? 0, top_speed: c.top_speed ?? 0, zero_to_sixty: Number(c.zero_to_sixty ?? 0),
      image_url: c.image_url ?? "", sort_order: c.sort_order,
    });
    setOpen(true);
  };

  const upload = async (file: File) => {
    const err = validateFile(file, { types: IMAGE_TYPES });
    if (err) { toast.error(err); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `cars/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("car-images").upload(path, file, { upsert: false });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("car-images").getPublicUrl(path);
    setForm((f) => ({ ...f, image_url: data.publicUrl }));
    setUploading(false);
    toast.success("Image uploaded");
  };

  const save = async () => {
    if (!form.model.trim()) { toast.error("Model name is required"); return; }
    if (!form.price_usd || form.price_usd <= 0) { toast.error("Price must be positive"); return; }
    setSaving(true);
    const payload = {
      model: form.model.trim(),
      tagline: form.tagline || null,
      price_usd: Number(form.price_usd),
      range_mi: Number(form.range_mi) || null,
      top_speed: Number(form.top_speed) || null,
      zero_to_sixty: Number(form.zero_to_sixty) || null,
      image_url: form.image_url || null,
      sort_order: Number(form.sort_order) || 0,
    };
    const { error } = editing
      ? await supabase.from("tesla_cars").update(payload).eq("id", editing.id)
      : await supabase.from("tesla_cars").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Car updated" : "Car added");
    setOpen(false);
    load();
  };

  const remove = async (c: Car) => {
    if (!confirm(`Delete ${c.model}?`)) return;
    const { error } = await supabase.from("tesla_cars").delete().eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Car deleted");
    load();
  };

  const resolveImg = (c: Car) => c.image_url || carImages[c.model] || "";

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Tesla Cars</h1>
          <p className="text-muted-foreground text-[13px] mt-1">Manage the public showroom catalog.</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1.5" /> Add car</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cars.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border bg-card overflow-hidden group">
              <div className="aspect-[16/10] bg-muted flex items-center justify-center overflow-hidden">
                {resolveImg(c) ? (
                  <img src={resolveImg(c)} alt={c.model} className="w-full h-full object-cover" />
                ) : (
                  <CarIcon className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display font-medium text-[16px]">{c.model}</p>
                    {c.tagline && <p className="text-[12px] text-muted-foreground line-clamp-1">{c.tagline}</p>}
                  </div>
                  <p className="font-display text-[15px] whitespace-nowrap">{formatUSD(Number(c.price_usd))}</p>
                </div>
                <div className="flex gap-3 text-[11px] text-muted-foreground">
                  {c.range_mi ? <span>{c.range_mi} mi</span> : null}
                  {c.top_speed ? <span>{c.top_speed} mph</span> : null}
                  {c.zero_to_sixty ? <span>{c.zero_to_sixty}s 0-60</span> : null}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1 h-8" onClick={() => openEdit(c)}>
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-red-600 hover:text-red-700" onClick={() => remove(c)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {cars.length === 0 && (
            <div className="col-span-full p-10 text-center text-muted-foreground text-sm rounded-2xl border border-border bg-card">
              No cars yet. Click "Add car" to create one.
            </div>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit car" : "Add car"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <Label>Image</Label>
              <div className="mt-1.5 flex items-center gap-3">
                <div className="w-24 h-16 rounded-lg bg-muted overflow-hidden flex items-center justify-center shrink-0">
                  {form.image_url ? (
                    <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <CarIcon className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
                />
                <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
                  Upload
                </Button>
              </div>
              <Input
                className="mt-2 text-xs font-mono"
                placeholder="…or paste image URL"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Model name</Label>
                <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Model S" />
              </div>
              <div>
                <Label>Price (USD)</Label>
                <Input type="number" value={form.price_usd} onChange={(e) => setForm({ ...form, price_usd: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>Tagline</Label>
              <Textarea
                value={form.tagline ?? ""}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                placeholder="The fastest production sedan ever built."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Range (mi)</Label>
                <Input type="number" value={form.range_mi ?? 0} onChange={(e) => setForm({ ...form, range_mi: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Top speed</Label>
                <Input type="number" value={form.top_speed ?? 0} onChange={(e) => setForm({ ...form, top_speed: Number(e.target.value) })} />
              </div>
              <div>
                <Label>0-60 (s)</Label>
                <Input type="number" step="0.1" value={form.zero_to_sixty ?? 0} onChange={(e) => setForm({ ...form, zero_to_sixty: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>Sort order</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={saving} onClick={save}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editing ? "Save changes" : "Add car")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
