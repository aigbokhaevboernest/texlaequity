import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Loader2, Users, TrendingUp, Award, Check } from "lucide-react";
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
  const nav = useNavigate();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [assignedId, setAssignedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: list }, prof] = await Promise.all([
        supabase.from("expert_traders").select("*").eq("is_active", true).order("sort_order"),
        user
          ? supabase.from("profiles").select("assigned_expert_id").eq("user_id", user.id).maybeSingle()
          : Promise.resolve({ data: null } as never),
      ]);
      setExperts((list as Expert[] | null) ?? []);
      setAssignedId((prof?.data as { assigned_expert_id: string | null } | null)?.assigned_expert_id ?? null);
      setLoading(false);
    };
    load();
  }, [user?.id]);

  const handleCopy = (e: Expert) => {
    const ok = window.confirm(
      `To copy this expert requires a minimum of ${format(Number(e.min_copy_amount ?? 0))}. Do you wish to proceed?`
    );
    if (ok) nav("/dashboard/deposit");
  };

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
        <p className="label-mono text-muted-foreground mb-2">Mirror top traders</p>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Copy Experts</h1>
        <p className="text-muted-foreground text-[14px] mt-1">
          Browse our verified experts and start copying their trades.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {experts.map((e) => {
          const isAssigned = assignedId === e.id;
          return (
            <article key={e.id} className="rounded-2xl border border-border bg-card p-4 flex flex-col">
           <div className="flex items-center gap-3 mb-3">
  {e.avatar_url ? (
    <img
      src={e.avatar_url}
      alt={e.name}
      className="w-12 h-12 rounded-full object-cover shrink-0"
      onError={(ev) => {
        (ev.target as HTMLImageElement).style.display = "none";
      }}
    />
  ) : (
    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground font-display text-base font-semibold shrink-0">
      {e.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}
    </div>
  )}


                <div className="min-w-0 flex-1">
                  <p className="font-display text-[15px] font-medium truncate">{e.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{e.handle}</p>
                  {e.specialty && <p className="text-[11px] text-primary truncate">{e.specialty}</p>}
                </div>
              </div>

              {isAssigned && (
                <div className="mb-3 inline-flex items-center gap-1.5 self-start rounded-full bg-emerald-900/90 text-emerald-100 px-2 py-0.5 text-[10px] font-medium">
                  <Check className="w-3 h-3" /> You are copying {e.name}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 mb-3">
                <Stat icon={Award} label="Win" value={`${e.win_rate ?? 0}%`} />
                <Stat icon={TrendingUp} label="Profit" value={format(Number(e.total_profit_usd ?? 0))} />
                <Stat icon={Users} label="Copiers" value={(e.followers ?? 0).toLocaleString()} />
              </div>

              <p className="text-[11px] text-muted-foreground mb-3">
                Min copy: <span className="text-foreground font-medium">{format(Number(e.min_copy_amount ?? 0))}</span>
              </p>

              <button
                onClick={() => handleCopy(e)}
                className="mt-auto w-full rounded-lg bg-primary text-primary-foreground text-[13px] font-medium py-2 hover:bg-primary/90 transition-colors"
              >
                Copy expert
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof TrendingUp; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        <Icon className="w-2.5 h-2.5" /> {label}
      </p>
      <p className="font-display font-medium text-[12px] mt-0.5 truncate">{value}</p>
    </div>
  );
}
