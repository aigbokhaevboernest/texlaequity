import { useEffect, useState } from "react";
import { supabase as supabaseTyped } from "@/integrations/supabase/client";
const supabase: any = supabaseTyped;
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Landmark, Copy, Loader2 } from "lucide-react";

type DataField = { label: string; value: string };

type AssignedBank = {
  is_active: boolean;
  bank_deposit_info: {
    id: string;
    data: DataField[];
  };
};

export default function BankDepositPage() {
  const [banks, setBanks] = useState<{ id: string; data: DataField[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);

    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes?.user) {
      setError("Please sign in to view deposit details.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("bank_account_assignments")
      .select("is_active, bank_deposit_info(id, data)")
      .eq("user_id", userRes.user.id)
      .eq("is_active", true);

    if (error) {
      toast.error(error.message);
      setError("Could not load deposit details.");
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as AssignedBank[];
    const active = rows
      .map((r) => r.bank_deposit_info)
      .filter((b): b is { id: string; data: DataField[] } => !!b);

    setBanks(active);
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Deposit Info";
    load();
  }, []);

  const copyValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">Deposit Info</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Use the details below to send your deposit
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : error ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{error}</p>
      ) : banks.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No deposit accounts are available for you right now.
        </p>
      ) : (
        <div className="space-y-3">
          {banks.map((b) => (
            <Card key={b.id}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-500/10">
                    <Landmark className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {b.data.map((f, i) => (
                      <div key={i} className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] text-muted-foreground">{f.label}</p>
                          <p className="truncate font-mono text-sm">{f.value}</p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 shrink-0"
                          onClick={() => copyValue(f.value, f.label)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
