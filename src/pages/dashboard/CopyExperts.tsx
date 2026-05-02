import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, TrendingUp, Award, ShieldAlert, Copy } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

interface Expert {
  id: string;
  name: string;
  handle: string;
  avatar_url: string | null;
  bio: string | null;
  specialty: string | null;
  win_rate: number;
  total_profit_usd: number;
  followers: number;
  min_copy_amount: number;
}

export default function CopyExperts() {
  const { user } = useAuth();
  const { format } = useCurrency();
  const [expert, setExpert] = useState<Expert | null>(null);
  const [deposit, setDeposit] = useState<number>(0); // ADDED
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      const { data: profile } = await supabase
        .from("profiles")
        .select("assigned_expert_id, total_deposit") // CHANGED: added total_deposit
        .eq("user_id", user.id)
        .maybeSingle();
      const expertId = (profile as { assigned_expert_id: string | null; total_deposit: number | null } | null)?.assigned_expert_id;
      setDeposit(Number((profile as any)?.total_deposit ?? 0)); // ADDED
      if (!expertId) {
        setExpert(null);
        setLoading(false);
        return;
      }
      const { data: ex } = await supabase
        .from("expert_traders")
        .select("*")
        .eq("id", expertId)
        .maybeSingle();
      setExpert((ex as Expert | null) ?? null);
      setLoading(false);
    };
    load();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="label-mono text-muted-foreground mb-2">Your assigned expert</p>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Copy Experts</h1>
        <p className="text-muted-foreground text-[14px] mt-1">
          Your account is mirroring this trader. Reassignments are managed by the support team.
        </p>
      </div>

      {!expert ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center max-w-xl">
          <ShieldAlert className="w-8 h-8 mx-auto text-amber-600 mb-3" />
          <h2 className="font-display text-xl mb-2">No expert assigned yet</h2>
          <p className="text-[13px] text-muted-foreground">
            Once your funding is confirmed, our team will assign an expert trader to your account. Contact support to request a specific trader.
          </p>
        </div>
      ) : (
        <article className="rounded-2xl border border-border bg-card p-6 max-w-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground font-display text-xl font-semibold">
              {expert.name.split(" ").map((s) => s[0]).join("")}
            </div>
            <div>
              <p className="font-display text-xl font-medium">{expert.name}</p>
              <p className="text-[12px] text-muted-foreground">{expert.handle}</p>
              <p className="text-[12px] text-primary mt-0.5">{expert.specialty}</p>
            </div>
          </div>
          {expert.bio && <p className="text-[13px] text-muted-foreground mb-6">{expert.bio}</p>}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat icon={Award} label="Win rate" value={`${expert.win_rate ?? 0}%`} accent="text-emerald-600" />
            <Stat icon={TrendingUp} label="Total profit" value={format(Number(expert.total_profit_usd ?? 0))} />
            <Stat icon={Users} label="Copiers" value={(expert.followers ?? 0).toLocaleString()} />
            <Stat icon={TrendingUp} label="Min copy" value={format(Number(expert.min_copy_amount ?? 0))} />
          </div>

          {/* ADDED: Copy status block */}
          {deposit > 0 ? (
            <div className="mt-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4">
              <div className="flex items-center gap-2 justify-center">
                <Copy className="w-4 h-4 text-emerald-600" />
                <p className="text-emerald-700 dark:text-emerald-400 font-medium text-[14px]">
                  You are copying this expert
                </p>
              </div>
              <p className="text-[12px] text-muted-foreground mt-1 text-center">
                Your trades are being mirrored automatically.
              </p>
            </div>
          ) : (
            <div className="mt-6 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4">
              <p className="text-amber-700 dark:text-amber-400 font-medium text-[14px] text-center">
                Deposit required to start copying
              </p>
              <p className="text-[12px] text-muted-foreground mt-1 text-center">
                Make a deposit to activate copy trading for this expert.
              </p>
              <button
                onClick={() => window.location.href = "/dashboard/deposit"}
                className="mt-3 w-full rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[13px] font-medium py-2 transition-colors"
              >
                Make a Deposit
              </button>
            </div>
          )}
        </article>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: typeof TrendingUp; label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <Icon className="w-3 h-3" /> {label}
      </p>
      <p className={`font-display font-medium text-[15px] mt-1 ${accent ?? ""}`}>{value}</p>
    </div>
  );
}
