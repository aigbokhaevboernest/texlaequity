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
import { TrendingUp, TrendingDown, Loader2, CheckCircle2 } from "lucide-react";

const FEE_RATE = 0.01; // 1% platform fee
const ADMIN_EMAIL = "admin@texlaequity.com";

type Quote = {
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  marketOpen: boolean;
};

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

  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [shares, setShares] = useState("");
  const [orders, setOrders] = useState<StockOrder[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [modalShares, setModalShares] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadQuote = async () => {
      const { data, error } = await supabase.functions.invoke("stock-price");
      if (!error && data && !data.error) setQuote(data as Quote);
      setQuoteLoading(false);
    };
    loadQuote();
    const interval = setInterval(loadQuote, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("stock_orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders((data as StockOrder[] | null) ?? []));
  }, [user, success]);

  const price = quote?.price ?? 0;
  const shareCount = Number(shares) || 0;
  const subtotal = shareCount * price;
  const fees = subtotal * FEE_RATE;
  const total = subtotal + fees;

  const modalShareCount = Number(modalShares) || 0;
  const modalSubtotal = modalShareCount * price;
  const modalFees = modalSubtotal * FEE_RATE;
  const modalTotal = modalSubtotal + modalFees;

  const openConfirm = () => {
    if (!shareCount || shareCount <= 0) {
      toast.warning("Enter the number of shares you want to buy");
      return;
    }
    setModalShares(shares);
    setConfirmOpen(true);
  };

  const confirmPurchase = async () => {
    if (!user || !modalShareCount) return;
    setSubmitting(true);

    const { error } = await supabase.from("stock_orders").insert({
      user_id: user.id,
      symbol: "TSLA",
      shares: modalShareCount,
      price_per_share: price,
      fees: modalFees,
      total_cost: modalTotal,
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
        message: `<p>Your request to purchase <strong>${modalShareCount} Tesla (TSLA) shares</strong> at ${format(price)}/share has been received.</p><p>Total due: <strong>${format(modalTotal)}</strong> (incl. fees).</p><p>Please complete your deposit to finalize the purchase.</p>`,
      },
    }).catch(() => {});
    void supabase.functions.invoke("send-email", {
      body: {
        email: ADMIN_EMAIL,
        subject: `Stock order from ${userEmail || "user"}`,
        message: `<p>${userEmail || "A user"} requested ${modalShareCount} TSLA shares at ${format(price)}/share — total ${format(modalTotal)}. Awaiting deposit + approval.</p>`,
      },
    }).catch(() => {});

    setSubmitting(false);
    setSuccess(true);
    setConfirmOpen(false);
    toast.success("You've successfully requested Tesla shares.");

    setTimeout(() => {
      setSuccess(false);
      navigate(`/dashboard/deposit?amount=${modalTotal.toFixed(2)}`);
    }, 1400);
  };

  const totalShares = orders.filter((o) => o.status === "approved").reduce((s, o) => s + Number(o.shares), 0);
  const totalInvested = orders.filter((o) => o.status === "approved").reduce((s, o) => s + Number(o.total_cost), 0);
  const avgPrice = totalShares > 0 ? totalInvested / totalShares : 0;
  const marketValue = totalShares * price;
  const unrealized = marketValue - totalInvested;
  const unrealizedPct = totalInvested > 0 ? (unrealized / totalInvested) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="label-mono text-muted-foreground mb-2">Invest in Tesla</p>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Tesla Stock</h1>
        <p className="text-muted-foreground text-[14px] mt-1">
          Buy shares of Tesla Inc. directly from your dashboard.
        </p>
      </div>

      {/* Overview card */}
      <Card className="rounded-2xl border-border p-6">
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
            {quoteLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground ml-auto" />
            ) : quote ? (
              <>
                <p className="font-display text-2xl font-medium">{format(price)}</p>
                <div className={`flex items-center justify-end gap-1 text-[12px] font-medium ${quote.change >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                  {quote.change >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {quote.change >= 0 ? "+" : ""}{quote.change?.toFixed(2)} ({quote.changePercent?.toFixed(2)}%)
                </div>
              </>
            ) : (
              <p className="text-[12px] text-muted-foreground">Price unavailable</p>
            )}
            {quote && (
              <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full ${quote.marketOpen ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                {quote.marketOpen ? "Market Open" : "Market Closed"}
              </span>
            )}
          </div>
        </div>

        <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
          Tesla, Inc. designs, manufactures, and sells electric vehicles, energy storage, and solar
          products. Headquartered in Austin, Texas, Tesla is a leader in sustainable transportation
          and clean energy.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px]">
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
            <p className="font-medium text-foreground">{quote ? format(quote.previousClose) : "—"}</p>
          </div>
        </div>
      </Card>

      {/* Investment panel */}
      <Card className="rounded-2xl border-border p-6 max-w-xl">
        <h2 className="font-display text-lg font-medium mb-4">Buy Tesla Shares</h2>
        <div className="space-y-4">
          <div>
            <Label>Number of shares</Label>
            <Input
              type="number"
              min="0"
              step="any"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="e.g. 5"
            />
          </div>

          <div className="rounded-xl bg-muted/40 p-4 space-y-2 text-[13px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price per share</span>
              <span className="font-medium">{format(price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantity</span>
              <span className="font-medium">{shareCount || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated fees (1%)</span>
              <span className="font-medium">{format(fees)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border text-[14px]">
              <span className="font-medium">Total cost</span>
              <span className="font-semibold">{format(total)}</span>
            </div>
          </div>

          <Button className="w-full" onClick={openConfirm} disabled={quoteLoading || !quote}>
            <TrendingUp className="w-4 h-4" />
            Buy Tesla Shares
          </Button>
        </div>
      </Card>

      {/* Portfolio */}
      <Card className="rounded-2xl border-border p-6">
        <h2 className="font-display text-lg font-medium mb-4">Your Portfolio</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-[12px]">
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-muted-foreground mb-1">Shares owned</p>
            <p className="font-display font-medium text-[14px]">{totalShares}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-muted-foreground mb-1">Avg. price</p>
            <p className="font-display font-medium text-[14px]">{format(avgPrice)}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-muted-foreground mb-1">Market value</p>
            <p className="font-display font-medium text-[14px]">{format(marketValue)}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-muted-foreground mb-1">Total invested</p>
            <p className="font-display font-medium text-[14px]">{format(totalInvested)}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-muted-foreground mb-1">Unrealized P/L</p>
            <p className={`font-display font-medium text-[14px] ${unrealized >= 0 ? "text-emerald-600" : "text-destructive"}`}>
              {format(unrealized)}
            </p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-muted-foreground mb-1">Return</p>
            <p className={`font-display font-medium text-[14px] ${unrealizedPct >= 0 ? "text-emerald-600" : "text-destructive"}`}>
              {unrealizedPct.toFixed(2)}%
            </p>
          </div>
        </div>
      </Card>

      {/* Transaction history */}
      <Card className="rounded-2xl border-border overflow-hidden">
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

      {/* Confirmation modal */}
      <Dialog open={confirmOpen} onOpenChange={(o) => !submitting && setConfirmOpen(o)}>
        <DialogContent className="bg-white text-slate-900 rounded-2xl border-0 max-w-md">
          {success ? (
            <div className="py-8 flex flex-col items-center text-center gap-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              <p className="font-display text-lg font-medium">You've successfully purchased Tesla shares.</p>
              <p className="text-[13px] text-muted-foreground">Redirecting to deposit…</p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-slate-900">Confirm Purchase</DialogTitle>
                <DialogDescription className="text-slate-500">
                  Review your order before confirming.
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
                    value={modalShares}
                    onChange={(e) => setModalShares(e.target.value)}
                  />
                </div>

                <div className="flex justify-between pt-2"><span className="text-slate-500">Price per share</span><span className="font-medium">{format(price)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Estimated fees</span><span className="font-medium">{format(modalFees)}</span></div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-[14px]">
                  <span className="font-medium">Total cost</span>
                  <span className="font-semibold">{format(modalTotal)}</span>
                </div>
              </div>

              <DialogFooter className="flex-row gap-2 sm:gap-2">
                <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={submitting}
                  className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-100">
                  Cancel
                </Button>
                <Button onClick={confirmPurchase} disabled={submitting || !modalShareCount} className="flex-1">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Confirm Purchase
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
