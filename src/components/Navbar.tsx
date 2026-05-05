import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { to: "/inventory", label: "Inventory" },
    { to: "/faq", label: "FAQ" },
    { to: "/terms", label: "Terms" },
    { to: "/policies", label: "Privacy" },
  ];

  // Dark blue palette (Tesla-like deep midnight blue)
  const navBase = "bg-[#0a1530]/95 backdrop-blur-xl border-b border-white/10 text-white";
  const navTop = pathname === "/" && !scrolled && !open ? "bg-transparent text-white" : navBase;

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${navTop}`}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <nav className="h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center" onClick={() => setOpen(false)}>
            <img src="/tesla-wordmark.png" alt="Tesla" className="h-6 w-auto brightness-0 invert" />
          </Link>

          <div className="hidden md:flex items-center gap-9 text-[13px] font-medium">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`transition-colors ${pathname === l.to ? "text-white" : "text-white/65 hover:text-white"}`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {user ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => nav("/dashboard")} className="text-[13px] text-white hover:bg-white/10 hover:text-white">
                  Dashboard
                </Button>
                <Button variant="ghost" size="sm" onClick={async () => { await signOut(); nav("/"); }} className="text-[13px] hidden sm:inline-flex text-white hover:bg-white/10 hover:text-white">
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => nav("/login")} className="text-[13px] hidden md:inline-flex text-white hover:bg-white/10 hover:text-white">
                  Log in
                </Button>
                <a
                  href="mailto:jameshilterson@gmail.com?subject=Tesla%20Order%20Inquiry&body=Hello%2C%20I%27m%20interested%20in%20ordering%20a%20Tesla.%20Please%20contact%20me."
                >
                  <Button size="sm" className="text-[13px] rounded-full px-4 h-8 bg-white text-[#0a1530] hover:bg-white/90">
                    Order Tesla
                  </Button>
                </a>
              </>
            )}
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
              className="md:hidden ml-1 w-9 h-9 inline-flex items-center justify-center rounded-full hover:bg-white/10"
            >
              {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </nav>

        {open && (
          <div className="md:hidden pb-4 pt-1 border-t border-white/10 -mx-6 px-6">
            <div className="flex flex-col py-3 gap-1 text-[14px] font-medium">
              {links.map((l) => (
                <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="py-2 text-white/80 hover:text-white">
                  {l.label}
                </Link>
              ))}
              <div className="h-px bg-white/10 my-2" />
              {user ? (
                <>
                  <button onClick={() => { setOpen(false); nav("/dashboard"); }} className="py-2 text-left text-white/80 hover:text-white">Dashboard</button>
                  <button onClick={async () => { setOpen(false); await signOut(); nav("/"); }} className="py-2 text-left text-white/80 hover:text-white">Sign out</button>
                </>
              ) : (
                <>
                  <button onClick={() => { setOpen(false); nav("/login"); }} className="py-2 text-left text-white/80 hover:text-white">Log in</button>
                  <button onClick={() => { setOpen(false); nav("/signup"); }} className="py-2 text-left text-white/80 hover:text-white">Sign up</button>
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
