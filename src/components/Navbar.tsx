import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#vehicles", label: "Vehicles" },
    { href: "#plans", label: "Invest" },
    { href: "#leaderboard", label: "Traders" },
    { href: "#stats", label: "Stats" },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled || open ? "bg-background/90 backdrop-blur-xl border-b border-border/60" : "bg-transparent"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <nav className="h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center group" onClick={() => setOpen(false)}>
            <img src="/tesla-wordmark.png" alt="Tesla" className="h-6 w-auto" />
          </Link>

          <div className="hidden md:flex items-center gap-10 text-[13px] font-medium text-foreground/70">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-foreground transition-colors">{l.label}</a>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {user ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => nav("/dashboard")} className="text-[13px]">
                  Dashboard
                </Button>
                <Button variant="ghost" size="sm" onClick={async () => { await signOut(); nav("/"); }} className="text-[13px] hidden sm:inline-flex">
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => nav("/login")} className="text-[13px] hidden md:inline-flex">
                  Log in
                </Button>
                {/* Mobile primary CTA: Order Tesla -> login */}
                <Button
                  size="sm"
                  onClick={() => nav("/login")}
                  className="text-[13px] rounded-full px-4 h-8 md:hidden"
                >
                  Order Tesla
                </Button>
                {/* Desktop primary CTA */}
                <Button
                  size="sm"
                  onClick={() => nav("/signup")}
                  className="text-[13px] rounded-full px-4 h-8 hidden md:inline-flex"
                >
                  order Tesla
                </Button>
              </>
            )}
            {/* Hamburger menu (mobile only) */}
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
              className="md:hidden ml-1 w-9 h-9 inline-flex items-center justify-center rounded-full hover:bg-foreground/5"
            >
              {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </nav>

        {/* Mobile menu sheet */}
        {open && (
          <div className="md:hidden pb-4 pt-1 border-t border-border/60 -mx-6 px-6 lg:hidden">
            <div className="flex flex-col py-3 gap-1 text-[14px] font-medium">
              {links.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-2 text-foreground/80 hover:text-foreground">
                  {l.label}
                </a>
              ))}
              <div className="h-px bg-border my-2" />
              {user ? (
                <>
                  <button onClick={() => { setOpen(false); nav("/dashboard"); }} className="py-2 text-left text-foreground/80 hover:text-foreground">Dashboard</button>
                  <button onClick={async () => { setOpen(false); await signOut(); nav("/"); }} className="py-2 text-left text-foreground/80 hover:text-foreground">Sign out</button>
                </>
              ) : (
                <>
                  <button onClick={() => { setOpen(false); nav("/login"); }} className="py-2 text-left text-foreground/80 hover:text-foreground">Log in</button>
                  <button onClick={() => { setOpen(false); nav("/signup"); }} className="py-2 text-left text-foreground/80 hover:text-foreground">Sign up</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
