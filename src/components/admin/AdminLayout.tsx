import { ReactNode, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/hooks/useAuth";
import {
  Loader2, ShieldCheck, Users, Banknote, FileCheck2,
  Car as CarIcon, LineChart, ArrowLeft, Zap,
} from "lucide-react";

const items = [
  { to: "/admin", label: "Overview", icon: ShieldCheck, end: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/transactions", label: "Transactions", icon: Banknote },
  { to: "/admin/kyc", label: "KYC Review", icon: FileCheck2 },
  { to: "/admin/orders", label: "Car Orders", icon: CarIcon },
  { to: "/admin/cars", label: "Cars Catalog", icon: CarIcon },
  { to: "/admin/plans", label: "Plan Subs", icon: LineChart },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading } = useIsAdmin();
  const nav = useNavigate();

  useEffect(() => {
    if (authLoading || loading) return;
    if (!user) nav("/admin/login", { replace: true });
    else if (!isAdmin) nav("/403", { replace: true });
  }, [user, isAdmin, authLoading, loading, nav]);

  if (authLoading || loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/60">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center">
              <Zap className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <span className="font-display font-semibold text-[16px] tracking-tight">
              Tesla<span className="text-primary">Vest</span>
              <span className="ml-2 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">Admin</span>
            </span>
          </Link>
          <Link to="/dashboard" className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> User dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6 lg:py-10 lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
        <aside className="mb-6 lg:mb-0 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-1 flex lg:flex-col gap-1 overflow-x-auto">
            {items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-foreground text-background"
                      : "text-foreground/70 hover:bg-muted hover:text-foreground"
                  }`
                }
              >
                <it.icon className="w-4 h-4" />
                {it.label}
              </NavLink>
            ))}
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}