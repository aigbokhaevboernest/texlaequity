import { useState, useEffect, ReactNode } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useLiveData } from "@/hooks/useLiveData";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import {
  LayoutDashboard, Users, ArrowDownToLine, Car as CarIcon, History,
  ArrowUpFromLine, ShieldCheck, LineChart, Settings, LogOut, Menu, Zap, Loader2, Wallet,
} from "lucide-react";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/copy-experts", label: "Copy Experts", icon: Users },
  { to: "/dashboard/deposit", label: "Deposit", icon: ArrowDownToLine },
  { to: "/dashboard/withdraw", label: "Withdraw", icon: ArrowUpFromLine },
  { to: "/dashboard/connect-wallet", label: "Connect Wallet", icon: Wallet },
  { to: "/dashboard/cars", label: "Cars", icon: CarIcon },
  { to: "/dashboard/transactions", label: "Transaction History", icon: History },
  { to: "/dashboard/kyc", label: "AML / KYC", icon: ShieldCheck },
  { to: "/dashboard/plans", label: "Trading Plans", icon: LineChart },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

interface Profile {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  account_level: string;
  status: string;
}

const NavItems = ({ onClick }: { onClick?: () => void }) => (
  <nav className="flex flex-col gap-1 p-2">
    {items.map((it) => (
      <NavLink
        key={it.to}
        to={it.to}
        end={it.end}
        onClick={onClick}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
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
  </nav>
);

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading: authLoading, signOut } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  useAutoLogout();

  useEffect(() => {
    if (authLoading) return;
    if (!user) nav("/login", { replace: true });
  }, [user, authLoading, nav]);

  const { data: profile } = useLiveData<Profile | null>(async () => {
    if (!user) return null;
    const { data } = await supabase.from("profiles").select("full_name, username, avatar_url, account_level, status")
      .eq("user_id", user.id).maybeSingle();
    return (data as Profile | null) ?? null;
  }, [user?.id], { cacheKey: user ? `dashLayout:${user.id}` : undefined });

  useEffect(() => { setOpen(false); }, [location.pathname]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const isSuspended = profile?.status === "suspended";
  const isOverview = location.pathname === "/dashboard";
  const allowedWhileSuspended = isOverview; // can see balance only

  const handleSignOut = async () => {
  nav("/login", { replace: true });
  await signOut();
};




  const initials = (profile?.full_name || profile?.username || "U")
    .split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-mesh">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/60">
     <div className="max-w-[1400px] mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
  <Link to="/" className="flex items-center justify-start">
    <img src="/tesla-wordmark.png" alt="Tesla" className="h-4 w-auto" />
  </Link>


          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 pr-2">
              <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-[11px] font-semibold">
                {initials}
              </div>
              <div className="text-[12px] leading-tight">
                <p className="font-medium">{profile?.full_name || profile?.username || "User"}</p>
                <p className="text-muted-foreground">{profile?.account_level ?? "Basic"}</p>
              </div>
            </div>

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-full h-9 w-9 p-0">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] p-0 flex flex-col">
                <div className="p-5 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center text-[12px] font-semibold">
                      {initials}
                    </div>
                    <div className="text-[13px]">
                      <p className="font-semibold">{profile?.full_name || "User"}</p>
                      <p className="text-muted-foreground text-[11px]">{profile?.account_level} account</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <NavItems onClick={() => setOpen(false)} />
                </div>
                <div className="border-t border-border p-2">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-foreground/70 hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6 lg:py-10 lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
        <aside className="hidden lg:block sticky top-24 self-start">
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-1">
            <NavItems />
          </div>
          <button
            onClick={handleSignOut}
            className="mt-3 w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] font-medium text-foreground/70 hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </aside>

        <main className="min-w-0">
          {isSuspended && !allowedWhileSuspended ? (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-8 max-w-2xl">
              <h2 className="font-display text-2xl mb-2 text-destructive">Account Suspended</h2>
              <p className="text-[14px] text-muted-foreground mb-4">
                Your account has been suspended. Withdrawals, deposits, and other actions are blocked. You can still view your balance on the dashboard overview.
              </p>
              <p className="text-[13px]">Contact support: <a className="text-primary underline" href="mailto:support@teslavest.com">support@teslavest.com</a></p>
            </div>
          ) : children}
        </main>
      </div>
    </div>
  );
}
