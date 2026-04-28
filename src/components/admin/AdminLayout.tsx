import { ReactNode, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  Loader2, ShieldCheck, Users, Banknote, FileCheck2,
  Car as CarIcon, LineChart, ArrowLeft, Terminal, LogOut,
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
  const { user, signOut } = useAuth();
  const { isAdmin, loading } = useIsAdmin();
  const nav = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) nav("/admin/login", { replace: true });
    else if (!isAdmin) nav("/403", { replace: true });
  }, [user, isAdmin, loading, nav]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    nav("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-screen text-foreground" style={{ background: "#ffffff" }}>
      <header className="sticky top-0 z-40 border-b border-border bg-white/80 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 h-14 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center shadow-glow">
              <Terminal className="w-3.5 h-3.5" strokeWidth={2.5} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[13px] font-semibold tracking-tight text-foreground">
                teslavest<span className="text-primary">::</span>admin
              </span>
              <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-[0.18em] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                root
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <span className="hidden md:inline text-[11px] font-mono text-muted-foreground mr-3">
              {user.email}
            </span>
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-md hover:bg-muted"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> User view
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-md hover:bg-muted"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-6 lg:py-8 lg:grid lg:grid-cols-[200px_1fr] lg:gap-6">
        <aside className="mb-6 lg:mb-0 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-xl border border-border bg-muted/30 p-1.5 flex lg:flex-col gap-0.5 overflow-x-auto">
            {items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-md text-[12.5px] font-mono transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                  }`
                }
              >
                <it.icon className="w-3.5 h-3.5" />
                {it.label}
              </NavLink>
            ))}
          </div>
          <div className="hidden lg:block mt-4 px-3 py-2.5 rounded-xl border border-border bg-muted/30">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">session</p>
            <p className="text-[11px] font-mono text-foreground truncate mt-0.5">{user.id.slice(0, 18)}…</p>
            <p className="text-[10px] font-mono text-emerald-600 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> authenticated · admin
            </p>
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
