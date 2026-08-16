import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ArrowRight, PackageCheck, Clock, CheckCircle2, XCircle } from "lucide-react";
import { vehicles, badgeStyles } from "@/lib/inventory";
import { useCurrency } from "@/hooks/useCurrency";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_EMAIL = "support@teslagrowthequity.com";

const parsePrice = (priceStr: string): number => {
  const n = Number(priceStr.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
};

type OrderStatus = "awaiting_deposit" | "processing" | "approved" | "rejected";

type CarOrder = {
  id: string;
  model: string;
  price_usd: number;
  status: OrderStatus;
  created_at: string;
};

const STATUS_META: Record<OrderStatus, { label: string; icon: typeof Clock; className: string }> = {
  awaiting_deposit: { label: "Awaiting deposit", icon: Clock, className: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  processing:        { label: "Processing", icon: PackageCheck, className: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  approved:          { label: "Approved", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  rejected:          { label: "Rejected", icon: XCircle, className: "bg-destructive/10 text-destructive border-destructive/30" },
};

export default function Cars() {
  const { format } = useCurrency();
  const { user } = useAuth();
  const nav = useNavigate();

  const [selected, setSelected] = useState<(typeof vehicles)[0] | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [orders, setOrders] = useState<CarOrder[]>([]);

  const loadOrders = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("car_orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setOrders((data as CarOrder[] | null) ?? []);
  };

  useEffect(() => {
    loadOrders();
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`car-orders-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "car_orders", filter: `user_id=eq.${user.id}` },
        () => loadOrders()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  const sendDepositInstructionsEmail = async (
    vehicle: (typeof vehicles)[0],
    priceUsd: number
  ) => {
    if (!user) return;

    const displayAmount = priceUsd > 0 ? format(priceUsd) : vehicle.price;

    const { data: prof } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle();
    const firstName = ((prof as any)?.full_name || "").trim().split(" ")[0] || "";

    if (user.email) {
      void supabase.functions
        .invoke("send-email", {
          body: {
            to: user.email,
            first_name: firstName,
            subject: `Your ${vehicle.model} order — deposit instructions`,
            message: `<p style="margin:0 0 18px 0;">You've started an order for the <strong>${vehicle.model}</strong> (${displayAmount}).</p>
<p style="margin:0 0 18px 0;">To secure your order, please complete your deposit of <strong>${displayAmount}</strong> from the Deposit page using either crypto or bank transfer. Choose your method, follow the on-screen instructions, and attach proof of payment.</p>
<p style="margin:0;">Your order status is currently <strong>Awaiting deposit</strong>. We'll email you again once your deposit is confirmed.</p>`,
          },
        })
        .catch(() => {});
    }

    void supabase.functions
      .invoke("send-email", {
        body: {
          to: ADMIN_EMAIL,
          first_name: "Admin",
          subject: `New car order — ${vehicle.model}`,
          message: `<p style="margin:0 0 18px 0;">${user.email ?? "A user"} started an order for the <strong>${vehicle.model}</strong>.</p>
<p style="margin:0;">Deposit amount due: <strong>${displayAmount}</strong></p>`,
        },
      })
      .catch(() => {});
  };

  const handleConfirm = async () => {
    if (!selected || !user) return;
    setConfirming(true);
    const priceUsd = parsePrice(selected.price);
    const vehicle = selected;

    const { data: orderRow, error } = await supabase
      .from("car_orders")
      .insert({ user_id: user.id, model: vehicle.model, price_usd: priceUsd, status: "awaiting_deposit" })
      .select("id")
      .maybeSingle();

    if (error || !orderRow) {
      setConfirming(false);
      return;
    }

    void sendDepositInstructionsEmail(vehicle, priceUsd);
    loadOrders();

    setTimeout(() => {
      setConfirming(false);
      setSelected(null);
      nav(`/dashboard/deposit?amount=${priceUsd}&car_order_id=${orderRow.id}`);
    }, 600);
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="label-mono text-muted-foreground mb-2">Tesla showroom</p>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Cars</h1>
        <p className="text-muted-foreground text-[14px] mt-1">
          Order a Tesla using your portfolio balance or crypto.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {vehicles.map((v) => (
          <article
            key={v.model}
            className="group rounded-2xl md:rounded-3xl bg-card border border-border/60 overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="relative aspect-[4/3] bg-card overflow-hidden">
              <img
                src={v.image}
                alt={`Tesla ${v.model}`}
                loading="lazy"
                className="w-full h-full object-contain p-3 md:p-6 group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <span className={`absolute top-2 right-2 md:top-4 md:right-4 text-[10px] md:text-[11px] font-medium px-2 py-0.5 md:px-2.5 md:py-1 rounded-full border ${badgeStyles[v.badge]}`}>
                {v.badge}
              </span>
            </div>

            <div className="p-3 md:p-6 flex-1 flex flex-col">
              <div className="flex items-baseline justify-between mb-1 gap-1">
                <h3 className="font-display text-base md:text-xl font-medium tracking-tight">{v.model}</h3>
                <p className="font-display text-xs md:text-base font-light text-muted-foreground shrink-0">{v.price}</p>
              </div>
              <p className="text-[11px] md:text-sm text-muted-foreground mb-3 line-clamp-1">{v.tagline}</p>

              <div className="hidden md:flex items-center justify-between text-[11px] text-muted-foreground mb-4 pb-4 border-b border-border">
                <span>{v.range}</span>
                <span>•</span>
                <span>{v.top}</span>
                <span>•</span>
                <span>{v.zero} 0–60</span>
              </div>

              <p className="hidden md:block text-[13px] leading-relaxed text-muted-foreground font-light mb-6 line-clamp-3">
                {v.description}
              </p>

              <Button onClick={() => setSelected(v)} className="w-full rounded-full h-9 md:h-11 text-[12px] md:text-[13px] font-medium mt-auto">
                Order Now
                <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5 ml-1" />
              </Button>
            </div>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-6 pb-0">
          <h2 className="font-display text-lg font-medium mb-4">Order History</h2>
        </div>
        {orders.length === 0 ? (
          <p className="text-[13px] text-muted-foreground px-6 pb-6">No orders yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {orders.map((o) => {
              const meta = STATUS_META[o.status];
              const Icon = meta.icon;
              return (
                <div key={o.id} className="flex items-center justify-between p-4 text-[12px]">
                  <div>
                    <p className="font-medium text-foreground">{o.model}</p>
                    <p className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{format(o.price_usd)}</p>
                  </div>
                  <span className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-medium border ${meta.className}`}>
                    <Icon className="w-3 h-3" /> {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && !confirming && setSelected(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display font-light text-xl">Confirm order</DialogTitle>
          </DialogHeader>

          {selected && (() => {
            const priceUsd = parsePrice(selected.price);
            return (
              <div className="space-y-4">
                <div className="rounded-xl bg-muted/40 p-4 flex items-center gap-4">
                  <img src={selected.image} alt={selected.model} className="w-24 h-16 object-contain shrink-0" />
                  <div className="min-w-0">
                    <p className="font-display font-medium text-[15px]">{selected.model}</p>
                    <p className="text-[12px] text-muted-foreground line-clamp-1 mb-1">{selected.tagline}</p>
                    <p className="font-display font-medium">{priceUsd > 0 ? format(priceUsd) : selected.price}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  {[
                    { label: "Range", value: selected.range },
                    { label: "Top Speed", value: selected.top },
                    { label: "0–60", value: selected.zero },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg bg-muted/40 p-2">
                      <p className="text-muted-foreground mb-0.5">{s.label}</p>
                      <p className="font-medium">{s.value}</p>
                    </div>
                  ))}
                </div>

                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  Clicking <span className="font-medium text-foreground">Confirm & Deposit</span> will redirect you to
                  the deposit page with <span className="font-medium text-foreground">{priceUsd > 0 ? format(priceUsd) : selected.price}</span> pre-filled.
                  Your order will appear below as <strong>Awaiting deposit</strong> until payment is confirmed.
                </p>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 rounded-full" onClick={() => setSelected(null)} disabled={confirming}>
                    Cancel
                  </Button>
                  <Button className="flex-1 rounded-full" onClick={handleConfirm} disabled={confirming}>
                    {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm & Deposit"}
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
