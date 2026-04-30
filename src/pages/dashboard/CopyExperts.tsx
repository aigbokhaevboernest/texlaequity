import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, TrendingUp, Award, ShieldAlert } from "lucide-react";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      const { data: profile } = await supabase
        .from("profiles")
        .select("assigned_expert_id")
        .eq("user_id", user.id)
        .maybeSingle();
      const expertId = (profile as { assigned_expert_id: string | null } | null)?.assigned_expert_id;
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
            <Stat icon={Award} label="Win rate" value={`${expert.win_rate}%`} accent="text-emerald-600" />
            <Stat icon={TrendingUp} label="Total profit" value={format(Number(expert.total_profit_usd))} />
            <Stat icon={Users} label="Copiers" value={expert.followers.toLocaleString()} />
            <Stat icon={TrendingUp} label="Min copy" value={format(Number(expert.min_copy_amount))} />
          </div>
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
