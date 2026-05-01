import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-background/80 backdrop-blur-xl border-b border-border/60" : "bg-transparent"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <nav className="h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-display font-semibold text-[17px] tracking-tight">
              Tesla<span className="text-primary">Vest</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-10 text-[13px] font-medium text-foreground/70">
            <a href="#vehicles" className="hover:text-foreground transition-colors">Vehicles</a>
            <a href="#plans" className="hover:text-foreground transition-colors">Invest</a>
            <a href="#leaderboard" className="hover:text-foreground transition-colors">Traders</a>
            <a href="#stats" className="hover:text-foreground transition-colors">Stats</a>
          </div>

          <div className="flex items-center gap-1">
            {user ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => nav("/dashboard")} className="text-[13px]">
                  Dashboard
                </Button>
                <Button variant="ghost" size="sm" onClick={async () => { await signOut(); nav("/"); }} className="text-[13px]">
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => nav("/login")} className="text-[13px]">
                  Log in
                </Button>
                <Button
                  size="sm"
                  onClick={() => nav("/signup")}
                  className="text-[13px] rounded-full px-4 h-8"
                >
                  Get started
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
