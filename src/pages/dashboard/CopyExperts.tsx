import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { TrendingUp, Users, Loader2 } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { z } from "zod";

interface Expert {
  id: string; name: string; handle: string; avatar_url: string | null;
  bio: string | null; specialty: string | null; win_rate: number;
  total_profit_usd: number; followers: number; min_copy_amount: number;
}

const amountSchema = z.coerce.number().positive("Amount must be positive");

export default function CopyExperts() {
  const { user } = useAuth();
  const { format, currency } = useCurrency();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [selected, setSelected] = useState<Expert | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("expert_traders").select("*").order("sort_order")
      .then(({ data }) => { if (data) setExperts(data as Expert[]); });
  }, []);

  const copyTrader = async () => {
    if (!user || !selected) return;
    const a = amountSchema.safeParse(amount);
    if (!a.success) { toast.error(a.error.errors[0].message); return; }
    if (a.data < selected.min_copy_amount) { toast.error(`Min ${format(selected.min_copy_amount)}`); return; }
    setLoading(true);


  return (
    <div className="space-y-6">
      <div>
        <p className="label-mono text-muted-foreground mb-2">Mirror the best</p>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Copy Experts</h1>
        <p className="text-muted-foreground text-[14px] mt-1">Allocate capital to top traders. They trade, you earn.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {experts.map((e) => (
          <article key={e.id} className="rounded-2xl border border-border bg-card p-5 hover:border-foreground/40 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground font-semibold">
                {e.name.split(" ").map((s) => s[0]).join("")}
              </div>
              <div>
                <p className="font-display font-medium">{e.name}</p>
                <p className="text-[11px] text-muted-foreground">{e.handle} · {e.specialty}</p>
              </div>
            </div>
            <p className="text-[12px] text-muted-foreground line-clamp-2 mb-4 min-h-[32px]">{e.bio}</p>
            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              <div>
                <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Win</p>
                <p className="font-display font-medium text-emerald-600 text-[14px]">{e.win_rate}%</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Profit</p>
                <p className="font-display font-medium text-[14px]">{format(Number(e.total_profit_usd))}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Copiers</p>
                <p className="font-display font-medium text-[14px]">{e.followers.toLocaleString()}</p>
              </div>
            </div>
            <Button onClick={() => { setSelected(e); setAmount(String(e.min_copy_amount)); }} className="w-full rounded-full">
              <TrendingUp className="w-3.5 h-3.5 mr-1.5" /> Copy trader
            </Button>
          </article>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Copy {selected?.name}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted p-3 flex items-center justify-between text-[12px]">
                <span className="text-muted-foreground"><Users className="w-3.5 h-3.5 inline mr-1" />Min allocation</span>
                <span className="font-medium">{format(selected.min_copy_amount)}</span>
              </div>
              <div>
                <Label>Allocation amount (USD)</Label>
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} />
                {amount && !isNaN(Number(amount)) && currency !== "USD" && (
                  <p className="text-[11px] text-muted-foreground mt-1">≈ {format(Number(amount))}</p>
                )}
              </div>
              <Button onClick={copyTrader} disabled={loading} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm copy"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
