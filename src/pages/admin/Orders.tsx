import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatUSD } from "@/lib/cars";
import { Check, X, Truck } from "lucide-react";

interface Order {
  id: string; user_id: string; car_id: string; buyer_name: string;
  phone: string; address: string; payment_method: string;
  amount_usd: number; status: string; created_at: string;
  car?: { model: string };
}

const TONES: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700 border border-yellow-500/20",
  approved: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20",
  shipped: "bg-blue-500/10 text-blue-700 border border-blue-500/20",
  rejected: "bg-red-500/10 text-red-700 border border-red-500/20",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from("tesla_orders").select("*, car:tesla_cars(model)").order("created_at", { ascending: false });
    if (data) setOrders(data as any);
  };
  useEffect(() => { load(); }, []);

  const update = async (o: Order, status: string) => {
    setBusy(o.id);
    const { error } = await supabase.from("tesla_orders").update({ status }).eq("id", o.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`Order ${status}`);
    load();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Car orders</h1>
        <p className="text-muted-foreground text-[13px] mt-1">{orders.filter((o) => o.status === "pending").length} pending fulfillment</p>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">No orders yet.</div>
        ) : orders.map((o) => (
          <div key={o.id} className="p-5 border-b border-border last:border-0">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
              <div>
                <p className="font-medium">{o.car?.model || "Tesla"} · {o.buyer_name}</p>
                <p className="text-[12px] text-muted-foreground">{o.phone} · {o.payment_method}</p>
                <p className="text-[12px] text-muted-foreground mt-1">{o.address}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{new Date(o.created_at).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="font-display font-medium text-[16px]">{formatUSD(Number(o.amount_usd))}</p>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full inline-block mt-1 ${TONES[o.status] ?? "bg-muted"}`}>{o.status}</span>
              </div>
            </div>
            {o.status !== "shipped" && o.status !== "rejected" && (
              <div className="flex gap-2">
                {o.status === "pending" && (
                  <Button size="sm" disabled={busy === o.id} onClick={() => update(o, "approved")} className="bg-emerald-600 hover:bg-emerald-700">
                    <Check className="w-3.5 h-3.5 mr-1" /> Approve
                  </Button>
                )}
                {o.status === "approved" && (
                  <Button size="sm" disabled={busy === o.id} onClick={() => update(o, "shipped")} className="bg-blue-600 hover:bg-blue-700">
                    <Truck className="w-3.5 h-3.5 mr-1" /> Mark shipped
                  </Button>
                )}
                <Button size="sm" variant="outline" disabled={busy === o.id} onClick={() => update(o, "rejected")}>
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