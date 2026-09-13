import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { PieChart, TrendingUp, Package, Rocket, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { supabase } from "@/integrations/supabase/client";
import cybercabImg from "@/assets/cybercab.png";
import {
  CYBERCAB_INVEST_OPTIONS, INFO_TABS, InfoTab, OVERVIEW_TEXT,
} from "@/lib/cybercab";

const GOLD = "#B8862F";
const GOLD_BG = "bg-[#B8862F]";
const GOLD_TEXT = "text-[#B8862F]";
const GOLD_BORDER = "border-[#B8862F]/30";
const GOLD_SOFT_BG = "bg-[#B8862F]/10";

const ADMIN_EMAIL = "admin@texlaequity.com";
const DEFAULT_UNIT_PRICE = 30000;

type InvestmentRow = {
  id: string;
  plan_id: string;
  amount_usd: number;
  units: number;
  status: string;
  created_at: string;
};

type DocumentRow = {
  id: string;
  title: string;
  image_url: string;
};

export default function Cybercab() {
  const { user } = useAuth();
  const { format } = useCurrency();
  const nav = useNavigate();

  const [tab, setTab] = useState<InfoTab>("Documents");
  const [investOpen, setInvestOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [confirming, setConfirming] = useState(false);

  const [investments, setInvestments] = useState<InvestmentRow[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [unitPrice, setUnitPrice] = useState(DEFAULT_UNIT_PRICE);
  const [portfolioChangePct, setPortfolioChangePct] = useState(0);

  const loadInvestments = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("cybercab_investments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setInvestments((data as InvestmentRow[] | null) ?? []);
  };

  const loadDocuments = async () => {
    const { data } = await supabase
      .from("cybercab_documents")
      .select("*")
      .order("sort_order", { ascending: true });
    setDocuments((data as DocumentRow[] | null) ?? []);
  };

  const loadUnitPrice = async () => {
    const { data } = await supabase
      .from("cybercab_settings")
      .select("unit_price_usd")
      .eq("id", 1)
      .maybeSingle();
    if (data) setUnitPrice(Number((data as { unit_price_usd: number }).unit_price_usd));
  };

  useEffect(() => {
    Promise.all([loadInvestments(), loadDocuments(), loadUnitPrice()]).finally(() => setLoading(false));
  }, [user?.id]);

  // Cosmetic-only ticker, unrelated to real invested amounts
  useEffect(() => {
    const tick = () => setPortfolioChangePct(Math.random() * 4.5 + 0.1);
    tick();
    const interval = setInterval(tick, 12000);
    return () => clearInterval(interval);
  }, []);

  // Live updates when admin approves/rejects the linked deposit
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`cybercab-investments-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "cybercab_investments", filter: `user_id=eq.${user.id}` },
        () => loadInvestments()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  const activeInvestments = investments.filter((i) => i.status === "active");
  const totalInvested = activeInvestments.reduce((s, i) => s + Number(i.amount_usd), 0);
  const unitsHeld = unitPrice > 0 ? Math.floor(totalInvested / unitPrice) : 0;
  const currentValue = totalInvested;

  const holding = {
    totalInvested,
    unitsHeld,
    currentValue,
    portfolioChangePct,
  };

  const openInvest = () => {
    setSelectedAmount(null);
    setCustomAmount("");
    setInvestOpen(true);
  };

  const finalAmount = selectedAmount ?? Number(customAmount) ?? 0;

  const handleConfirm = async () => {
    if (!user || !finalAmount || finalAmount < 5000) {
      toast.warning("Enter an amount of $5,000 or more");
      return;
    }
    setConfirming(true);

    const { data: invRow, error } = await supabase
      .from("cybercab_investments")
      .insert({ user_id: user.id, plan_id: "cybercab", amount_usd: finalAmount, units: 0, status: "pending" })
      .select("id")
      .maybeSingle();

    if (error || !invRow) {
      setConfirming(false);
      toast.error(error?.message ?? "Something went wrong");
      return;
    }

    const userEmail = user.email ?? "";
    void supabase.functions.invoke("send-email", {
      body: {
        email: userEmail,
        subject: "Cybercab investment request received",
        message: `<p>You've requested to invest ${format(finalAmount)} in Cybercab. Please complete your deposit to activate this investment.</p>`,
      },
    }).catch(() => {});
    void supabase.functions.invoke("send-email", {
      body: {
        email: ADMIN_EMAIL,
        subject: `Cybercab investment request from ${userEmail || "user"}`,
        message: `<p>${userEmail || "A user"} requested to invest ${format(finalAmount)} in Cybercab.</p>`,
      },
    }).catch(() => {});

    setTimeout(() => {
      setConfirming(false);
      setInvestOpen(false);
      loadInvestments();
      toast.success("Investment request submitted. Continue with deposit.");
      nav(`/dashboard/deposit?amount=${finalAmount}&cybercab_investment_id=${invRow.id}`);
    }, 500);
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="label-mono text-muted-foreground mb-2">Autonomous mobility</p>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Cybercab Investment</h1>
        <p className="text-muted-foreground text-[14px] mt-1 max-w-lg">
          Invest in Tesla's purpose built autonomous ride hailing vehicle, designed for a driverless future.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <PieChart className={`w-5 h-5 mb-3 ${GOLD_TEXT}`} />
          <p className="text-[11px] text-muted-foreground mb-1">Total Invested</p>
          <p className="font-display text-lg font-medium">
            {loading ? "—" : format(holding.totalInvested)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <TrendingUp className={`w-5 h-5 mb-3 ${GOLD_TEXT}`} />
          <p className="text-[11px] text-muted-foreground mb-1">Current Value</p>
          <p className="font-display text-lg font-medium">
            {loading ? "—" : format(holding.currentValue)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <Package className={`w-5 h-5 mb-3 ${GOLD_TEXT}`} />
          <p className="text-[11px] text-muted-foreground mb-1">Units Held</p>
          <p className="font-display text-lg font-medium">
            {loading ? "—" : holding.unitsHeld.toString()}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <Rocket className={`w-5 h-5 mb-3 ${GOLD_TEXT}`} />
          <p className="text-[11px] text-muted-foreground mb-1">Portfolio Change</p>
          <p className="font-display text-lg font-medium text-emerald-600">
            +{holding.portfolioChangePct.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Invest card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden max-w-2xl">
        <img src={cybercabImg} alt="Tesla Cybercab" className="w-full h-56 object-cover" />
        <div className="p-6">
          <h2 className="font-display text-lg font-medium mb-1">Invest in Cybercab</h2>
          <p className="text-[13px] text-muted-foreground mb-5">
            Choose an amount of $5,000 or more to start your Cybercab investment. Current unit price: {format(unitPrice)}.
          </p>
          <Button
            className={`w-full ${GOLD_BG} hover:opacity-90 text-white`}
            onClick={openInvest}
          >
            <Rocket className="w-4 h-4" />
            Invest in Cybercab
          </Button>
        </div>
      </div>

      {/* My Holdings */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden max-w-2xl">
        <div className="p-6 pb-4">
          <h2 className="font-display text-lg font-medium">My Holdings</h2>
        </div>
        {loading ? (
          <p className="text-[13px] text-muted-foreground px-6 pb-6">Loading…</p>
        ) : investments.length === 0 ? (
          <p className="text-[13px] text-muted-foreground px-6 pb-6">No Cybercab positions yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {investments.map((inv) => (
              <div key={inv.id} className="flex items-center gap-4 p-4">
                <img src={cybercabImg} alt="Cybercab" className="w-16 h-12 object-cover rounded-lg shrink-0" />
                <div className="flex-1 min-w-0 text-[12px]">
                  <p className="font-medium text-foreground">Cybercab</p>
                  <p className="text-muted-foreground">{new Date(inv.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right text-[12px]">
                  <p className="font-medium">{format(Number(inv.amount_usd))}</p>
                  <p className="text-muted-foreground">
                    {inv.status === "active" ? Math.floor(Number(inv.amount_usd) / unitPrice) : 0} units
                  </p>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium border ${
                  inv.status === "active"
                    ? `${GOLD_SOFT_BG} ${GOLD_TEXT} ${GOLD_BORDER}`
                    : "bg-muted text-muted-foreground border-border"
                }`}>
                  {inv.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info tabs: Documents then Overview */}
      <div className="rounded-2xl border border-border bg-card p-6 max-w-2xl">
        <div className="flex flex-wrap gap-1 mb-4 border-b border-border pb-3">
          {INFO_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                tab === t ? `${GOLD_BG} text-white` : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Documents" && (
          documents.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">No documents available yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {documents.map((doc) => (
                <div key={doc.id} className="rounded-xl border border-border overflow-hidden">
                  <img src={doc.image_url} alt={doc.title} className="w-full h-40 object-cover" />
                  <p className="text-[12px] font-medium p-2.5">{doc.title}</p>
                </div>
              ))}
            </div>
          )
        )}

        {tab === "Overview" && (
          <>
            <p className="text-[13px] text-muted-foreground leading-relaxed">{OVERVIEW_TEXT}</p>
            <div className={`mt-4 flex items-start gap-2 rounded-xl ${GOLD_SOFT_BG} border ${GOLD_BORDER} p-3`}>
              <AlertTriangle className={`w-4 h-4 ${GOLD_TEXT} shrink-0 mt-0.5`} />
              <p className="text-[12px]" style={{ color: GOLD }}>
                Cybercab is not yet in commercial production. This is a speculative investment with no
                guaranteed return.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Invest dialog */}
      <Dialog open={investOpen} onOpenChange={(o) => !confirming && setInvestOpen(o)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Invest in Cybercab</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {CYBERCAB_INVEST_OPTIONS.map((opt) => (
                <button
                  key={opt.amount}
                  onClick={() => { setSelectedAmount(opt.amount); setCustomAmount(""); }}
                  className={`rounded-xl border py-3 text-[13px] font-medium transition-all ${
                    selectedAmount === opt.amount
                      ? `${GOLD_BORDER} ${GOLD_SOFT_BG}`
                      : "border-border bg-card text-muted-foreground"
                  }`}
                  style={selectedAmount === opt.amount ? { color: GOLD } : undefined}
                >
                  ${opt.label}
                </button>
              ))}
            </div>
            <div>
              <label className="text-[12px] text-muted-foreground">Or enter a custom amount ($5,000+)</label>
              <input
                type="number"
                min="5000"
                value={customAmount}
                onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                placeholder="5000"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              No guaranteed returns. Values can rise or fall. Not officially affiliated with Tesla, Inc.
            </p>
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setInvestOpen(false)} disabled={confirming}>
              Cancel
            </Button>
            <Button className={`flex-1 ${GOLD_BG} hover:opacity-90 text-white`} onClick={handleConfirm} disabled={confirming}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
