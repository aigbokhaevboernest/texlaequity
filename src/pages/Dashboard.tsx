import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, Banknote, Star, Car as CarIcon, ExternalLink, Loader2 } from "lucide-react";
import { carImages, formatUSD, toBTC } from "@/lib/cars";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Profile {
  full_name: string | null;
  username: string | null;
  balance: number;
  profit: number;
  total_deposit: number;
  account_level: string;
  currency: string;
}

interface Car {
  id: string; model: string; tagline: string | null; price_usd: number;
  range_mi: number | null; top_speed: number | null; zero_to_sixty: number | null;
}

interface Order {
  id: string; car_id: string; status: string; amount_usd: number; created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-700",
  in_transit: "bg-blue-500/15 text-blue-700",
  approved: "bg-green-500/15 text-green-700",
  on_hold: "bg-orange-500/15 text-orange-700",
  delivered: "bg-emerald-500/15 text-emerald-700",
};

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [purchase, setPurchase] = useState({ name: "", address: "", phone: "", payment_method: "wallet" });

  useEffect(() => {
    if (!authLoading && !user) nav("/login");
  }, [user, authLoading, nav]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("tesla_cars").select("*").order("sort_order"),
      supabase.from("tesla_orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]).then(([p, c, o]) => {
      if (p.data) setProfile(p.data as Profile);
      if (c.data) setCars(c.data as Car[]);
      if (o.data) setOrders(o.data as Order[]);
    });
  }, [user]);

  const openBuy = (car: Car) => {
    setSelectedCar(car);
    setPurchase({ name: profile?.full_name || "", address: "", phone: "", payment_method: "wallet" });
  };

  const submitOrder = async () => {
    if (!user || !selectedCar) return;
    if (!purchase.name || !purchase.address || !purchase.phone) {
      toast.error("Please fill all fields");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.from("tesla_orders").insert({
      user_id: user.id,
      car_id: selectedCar.id,
      buyer_name: purchase.name,
      address: purchase.address,
      phone: purchase.phone,
      payment_method: purchase.payment_method,
      amount_usd: selectedCar.price_usd,
      status: "pending",
    }).select().single();
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    if (data) setOrders([data as Order, ...orders]);
    setSelectedCar(null);
    toast.success("Order placed! We'll review and update its status.");
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    { icon: Wallet, label: "Total Balance", value: formatUSD(Number(profile?.balance ?? 0)) },
    { icon: TrendingUp, label: "Profit", value: formatUSD(Number(profile?.profit ?? 0)) },
    { icon: Banknote, label: "Total Deposit", value: formatUSD(Number(profile?.total_deposit ?? 0)) },
    { icon: Star, label: "Account Level", value: profile?.account_level ?? "Basic" },
  ];

  return (
    <div className="min-h-screen bg-mesh">
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-6">
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.
            </h1>
            <p className="text-muted-foreground mt-1">Here's an overview of your wealth and Tesla orders.</p>
          </div>

          {/* Stats */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {stats.map((s) => (
              <div key={s.label} className="glass rounded-2xl p-5 shadow-soft">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <s.icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{s.label}</p>
                <p className="font-display text-2xl font-bold">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="glass rounded-2xl p-5 shadow-soft mb-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-display font-semibold text-lg">Quick actions</p>
              <p className="text-sm text-muted-foreground">Buy a Tesla or browse the live inventory.</p>
            </div>
            <div className="flex gap-2">
              <a href="https://www.tesla.com/inventory/new/m3?arrangeby=plh&range=0" target="_blank" rel="noopener noreferrer">
                <Button variant="outline">View inventory <ExternalLink className="w-3.5 h-3.5 ml-1" /></Button>
              </a>
              <Button onClick={() => document.getElementById("buy-tesla")?.scrollIntoView({ behavior: "smooth" })}>
                <CarIcon className="w-4 h-4 mr-1" /> Buy Tesla
              </Button>
            </div>
          </div>

          {/* Buy Tesla module */}
          <section id="buy-tesla" className="mb-12">
            <div className="flex items-end justify-between mb-5">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase mb-2">Buy Tesla</p>
                <h2 className="font-display text-2xl font-bold">Choose your vehicle</h2>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {cars.map((car) => (
                <article key={car.id} className="glass rounded-2xl p-5 shadow-soft hover:shadow-elegant transition-all hover:-translate-y-1 group">
                  <div className="h-36 rounded-xl bg-gradient-to-br from-surface to-background mb-4 flex items-center justify-center overflow-hidden">
                    <img src={carImages[car.model]} alt={car.model} loading="lazy" className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <h3 className="font-display font-bold text-lg">{car.model}</h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{car.tagline}</p>
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <p className="font-display font-bold">{formatUSD(car.price_usd)}</p>
                      <p className="text-xs text-muted-foreground">≈ {toBTC(car.price_usd)} BTC</p>
                    </div>
                  </div>
                  <Button onClick={() => openBuy(car)} className="w-full">Purchase</Button>
                </article>
              ))}
            </div>
          </section>

          {/* Orders */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-5">Your orders</h2>
            {orders.length === 0 ? (
              <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
                No orders yet. Buy your first Tesla above.
              </div>
            ) : (
              <div className="glass rounded-2xl overflow-hidden">
                {orders.map((o) => {
                  const car = cars.find((c) => c.id === o.car_id);
                  return (
                    <div key={o.id} className="flex items-center justify-between p-4 border-b border-border last:border-0">
                      <div className="flex items-center gap-4">
                        {car && <img src={carImages[car.model]} alt="" className="w-14 h-14 object-contain" />}
                        <div>
                          <p className="font-semibold">{car?.model ?? "Tesla"}</p>
                          <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-display font-semibold">{formatUSD(Number(o.amount_usd))}</span>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${STATUS_COLORS[o.status] ?? "bg-muted"}`}>
                          {o.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Purchase dialog */}
      <Dialog open={!!selectedCar} onOpenChange={(o) => !o && setSelectedCar(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Purchase {selectedCar?.model}</DialogTitle>
          </DialogHeader>
          {selectedCar && (
            <div className="space-y-4">
              <div className="rounded-xl bg-surface p-4 flex items-center justify-between">
                <img src={carImages[selectedCar.model]} alt="" className="w-20 h-14 object-contain" />
                <div className="text-right">
                  <p className="font-display font-bold">{formatUSD(selectedCar.price_usd)}</p>
                  <p className="text-xs text-muted-foreground">≈ {toBTC(selectedCar.price_usd)} BTC</p>
                </div>
              </div>
              <div>
                <Label>Full name</Label>
                <Input value={purchase.name} onChange={(e) => setPurchase({ ...purchase, name: e.target.value })} />
              </div>
              <div>
                <Label>Delivery address</Label>
                <Input value={purchase.address} onChange={(e) => setPurchase({ ...purchase, address: e.target.value })} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={purchase.phone} onChange={(e) => setPurchase({ ...purchase, phone: e.target.value })} />
              </div>
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
              <Button onClick={submitOrder} disabled={submitting} className="w-full shadow-elegant">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm purchase"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;