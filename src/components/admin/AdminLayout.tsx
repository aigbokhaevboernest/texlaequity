import { ReactNode, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
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
  const { user, isAdmin, loading, roleLoading, signOut } = useAuth();
  const nav = useNavigate();
  const ready = !loading && !roleLoading;

  useEffect(() => {
    if (!ready) return;
    if (!user) nav("/admin/login", { replace: true });
    else if (!isAdmin) nav("/403", { replace: true });
  }, [user, isAdmin, ready, nav]);

  if (!ready || !user || !isAdmin) {
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
    // Dark, console-style admin shell — intentionally distinct from the
    // light glassy user dashboard so admins know they are in privileged mode.
    <div
      className="min-h-screen text-foreground"
      style={{ background: "#ffffff" }}
    >
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 h-14 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center shadow-glow">
              <Terminal className="w-3.5 h-3.5" strokeWidth={2.5} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[13px] font-semibold tracking-tight text-white">
                teslavest<span className="text-primary">::</span>admin
              </span>
              <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-[0.18em] px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
                root
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <span className="hidden md:inline text-[11px] font-mono text-zinc-500 mr-3">
              {user.email}
            </span>
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 text-[12px] text-zinc-400 hover:text-white transition-colors px-2.5 py-1.5 rounded-md hover:bg-white/5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> User view
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-[12px] text-zinc-400 hover:text-white transition-colors px-2.5 py-1.5 rounded-md hover:bg-white/5"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6 lg:py-8 lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
        <aside className="mb-6 lg:mb-0 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-1.5 flex lg:flex-col gap-0.5 overflow-x-auto">
            {items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-md text-[12.5px] font-mono transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-primary/15 text-primary border border-primary/30 shadow-[0_0_20px_-4px_hsl(var(--primary)/0.4)]"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white border border-transparent"
                  }`
                }
              >
                <it.icon className="w-3.5 h-3.5" />
                {it.label}
              </NavLink>
            ))}
          </div>
          <div className="hidden lg:block mt-4 px-3 py-2.5 rounded-xl border border-white/5 bg-black/30">
            <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">session</p>
            <p className="text-[11px] font-mono text-zinc-300 truncate mt-0.5">{user.id.slice(0, 18)}…</p>
            <p className="text-[10px] font-mono text-emerald-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> authenticated · admin
            </p>
          </div>
        </aside>

        <main className="min-w-0 admin-surface">{children}</main>
      </div>
    </div>
  );
}
