import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { carImages, toBTC } from "@/lib/cars";
import { useCurrency } from "@/hooks/useCurrency";

interface Car {
  id: string; model: string; tagline: string | null; price_usd: number;
  range_mi: number | null; top_speed: number | null; zero_to_sixty: number | null;
}
interface Order {
  id: string; car_id: string; status: string; amount_usd: number; created_at: string;
}

const STATUS_TONES: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700 border border-yellow-500/20",
  in_transit: "bg-blue-500/10 text-blue-700 border border-blue-500/20",
  approved: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20",
  delivered: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20",
  on_hold: "bg-orange-500/10 text-orange-700 border border-orange-500/20",
};

export default function Cars() {
  const { user } = useAuth();
  const { format } = useCurrency();
  const [cars, setCars] = useState<Car[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Car | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [purchase, setPurchase] = useState({ name: "", address: "", phone: "", payment_method: "wallet" });

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("tesla_cars").select("*").order("sort_order"),
      supabase.from("tesla_orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("full_name, phone, address").eq("user_id", user.id).maybeSingle(),
    ]).then(([c, o, p]) => {
      if (c.data) setCars(c.data as Car[]);
      if (o.data) setOrders(o.data as Order[]);
      if (p.data) setPurchase((prev) => ({ ...prev, name: p.data!.full_name ?? "", phone: p.data!.phone ?? "", address: p.data!.address ?? "" }));
    });
  }, [user]);

  const submit = async () => {
    if (!user || !selected) return;
    if (!purchase.name || !purchase.address || !purchase.phone) { toast.error("Please fill all fields"); return; }
    setSubmitting(true);
    const { data, error } = await supabase.from("tesla_orders").insert({
      user_id: user.id, car_id: selected.id, buyer_name: purchase.name,
      address: purchase.address, phone: purchase.phone,
      payment_method: purchase.payment_method, amount_usd: selected.price_usd, status: "pending",
    }).select().single();
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    if (data) setOrders([data as Order, ...orders]);
    setSelected(null);
    toast.success("Order placed!");
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="label-mono text-muted-foreground mb-2">Tesla showroom</p>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Cars</h1>
        <p className="text-muted-foreground text-[14px] mt-1">Order a Tesla using your portfolio balance or crypto.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cars.map((car) => (
          <article key={car.id} className="rounded-2xl border border-border bg-card p-5 hover:border-foreground/40 transition-colors group">
            <div className="h-32 mb-4 flex items-center justify-center">
              <img src={carImages[car.model]} alt={car.model} loading="lazy" className="max-h-full object-contain group-hover:scale-105 transition-transform duration-500" />
            </div>
            <p className="font-display font-medium text-[15px]">{car.model}</p>
            <p className="text-[12px] text-muted-foreground mb-3 line-clamp-1">{car.tagline}</p>
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="font-display font-medium">{format(car.price_usd)}</p>
                <p className="text-[11px] text-muted-foreground">≈ {toBTC(car.price_usd)} BTC</p>
              </div>
              {car.zero_to_sixty && <p className="text-[11px] text-muted-foreground">{car.zero_to_sixty}s 0-60</p>}
            </div>
            <Button onClick={() => setSelected(car)} className="w-full rounded-full">Purchase</Button>
          </article>
        ))}
      </div>

      <section>
        <h2 className="font-display text-xl font-medium mb-4">Your orders</h2>
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {orders.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm">No orders yet.</div>
          ) : orders.map((o) => {
            const car = cars.find((c) => c.id === o.car_id);
            return (
              <div key={o.id} className="flex items-center justify-between p-4 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  {car && <img src={carImages[car.model]} alt="" className="w-14 h-12 object-contain" />}
                  <div>
                    <p className="font-medium text-[14px]">{car?.model ?? "Tesla"}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display font-medium text-[14px]">{format(Number(o.amount_usd))}</span>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full ${STATUS_TONES[o.status] ?? "bg-muted"}`}>{o.status.replace("_", " ")}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Purchase {selected?.model}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted p-4 flex items-center justify-between">
                <img src={carImages[selected.model]} alt="" className="w-20 h-14 object-contain" />
                <div className="text-right">
                  <p className="font-display font-medium">{format(selected.price_usd)}</p>
                  <p className="text-xs text-muted-foreground">≈ {toBTC(selected.price_usd)} BTC</p>
                </div>
              </div>
              <div><Label>Full name</Label><Input value={purchase.name} onChange={(e) => setPurchase({ ...purchase, name: e.target.value })} /></div>
              <div><Label>Delivery address</Label><Input value={purchase.address} onChange={(e) => setPurchase({ ...purchase, address: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={purchase.phone} onChange={(e) => setPurchase({ ...purchase, phone: e.target.value })} /></div>
              <div>
                <Label>Payment method</Label>
                <Select value={purchase.payment_method} onValueChange={(v) => setPurchase({ ...purchase, payment_method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wallet">Wallet balance</SelectItem>
                    <SelectItem value="btc">Bitcoin (BTC)</SelectItem>
                    <SelectItem value="eth">Ethereum (ETH)</SelectItem>
                    <SelectItem value="usdt">Tether (USDT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={submit} disabled={submitting} className="w-full">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm purchase"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}