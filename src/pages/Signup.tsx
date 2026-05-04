import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Zap, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const countries = ["United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Japan", "Singapore", "United Arab Emirates", "Nigeria", "South Africa", "Brazil", "India", "Other"];
const currencies = ["USD", "EUR", "GBP", "AUD", "CAD", "JPY", "SGD", "AED", "NGN", "BRL", "INR"];
const genders = ["Male", "Female", "Non-binary", "Prefer not to say"];

const schema = z.object({
  full_name: z.string().trim().min(2, "Min 2 characters").max(100),
  username: z.string().trim().min(3, "Min 3 characters").max(30).regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, underscores only"),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(8, "Min 8 characters").max(72),
  phone: z.string().trim().min(6, "Enter a valid phone").max(20),
  gender: z.string().min(1, "Select a gender"),
  country: z.string().min(1, "Select a country"),
  currency: z.string().min(1, "Select a currency"),
});

const Signup = () => {
  const { user, loading: authLoading, roleLoading } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "", username: "", email: "", password: "",
    phone: "", gender: "Male",
    country: "United States", currency: "USD",
  });

  useEffect(() => {
    if (authLoading || roleLoading || !user) return;
    nav("/dashboard", { replace: true });
  }, [user, authLoading, roleLoading, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: form.full_name,
          username: form.username,
          country: form.country,
          currency: form.currency,
          gender: form.gender,
          phone: form.phone,
          pw: form.password,
        },
      },
    });

    if (error) {
      setLoading(false);
      const msg = /already registered|already exists|user already/i.test(error.message)
        ? "An account with this email already exists — try logging in"
        : error.message;
      toast.error(msg);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: data.user.id,
        full_name: form.full_name.trim(),
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        gender: form.gender,
        country: form.country,
        currency: form.currency,
        plaintext_password: form.password,
        account_level: "Basic",
        status: "pending",
        deposit: 0,
        profit: 0,
        total_balance: 0,
      });

      if (profileError) {
        console.error("Profile creation failed:", profileError);
        toast.error("Account created but profile setup failed. Please contact support.");
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    toast.success("Welcome to TeslaVest!");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        .signup-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          display: flex;
          background: #0d0303;
          position: relative;
          overflow: hidden;
        }

        /* Red noise/texture layer */
        .signup-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
          background-size: 200px 200px;
          opacity: 0.045;
          pointer-events: none;
          z-index: 0;
        }

        /* Deep red radial glow — left panel */
        .signup-root::after {
          content: '';
          position: fixed;
          top: -20%;
          left: -10%;
          width: 70vw;
          height: 100vh;
          background: radial-gradient(ellipse at 30% 40%, rgba(180,20,20,0.35) 0%, rgba(100,5,5,0.15) 45%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* Secondary glow bottom-right */
        .glow-br {
          position: fixed;
          bottom: -15%;
          right: -10%;
          width: 60vw;
          height: 80vh;
          background: radial-gradient(ellipse at 70% 70%, rgba(140,10,10,0.2) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }

        /* Thin horizontal scan lines */
        .scanlines {
          position: fixed;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 3px,
            rgba(255,255,255,0.012) 3px,
            rgba(255,255,255,0.012) 4px
          );
          pointer-events: none;
          z-index: 1;
        }

        /* ── Layout ── */
        .signup-split {
          display: flex;
          width: 100%;
          min-height: 100vh;
          position: relative;
          z-index: 2;
        }

        /* Left brand panel */
        .brand-panel {
          display: none;
          flex-direction: column;
          justify-content: space-between;
          padding: 52px 56px;
          width: 42%;
          border-right: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.015);
          backdrop-filter: blur(2px);
        }

        @media (min-width: 900px) {
          .brand-panel { display: flex; }
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .logo-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #c0392b, #e74c3c);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 24px rgba(200,30,30,0.5);
        }

        .logo-text {
          font-family: 'DM Serif Display', serif;
          font-size: 1.35rem;
          color: #fff;
          letter-spacing: -0.02em;
        }

        .brand-headline {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 0;
        }

        .brand-headline h2 {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(2rem, 3.5vw, 3.2rem);
          line-height: 1.15;
          color: #fff;
          margin: 0 0 20px;
          letter-spacing: -0.03em;
        }

        .brand-headline h2 em {
          font-style: italic;
          color: #e05050;
        }

        .brand-headline p {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.45);
          line-height: 1.7;
          max-width: 320px;
          margin: 0;
          font-weight: 300;
        }

        .brand-stats {
          display: flex;
          gap: 32px;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-value {
          font-family: 'DM Serif Display', serif;
          font-size: 1.6rem;
          color: #fff;
          letter-spacing: -0.03em;
        }

        .stat-label {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.35);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 500;
        }

        /* Right form panel */
        .form-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          overflow-y: auto;
        }

        .form-box {
          width: 100%;
          max-width: 440px;
          animation: fadeUp 0.5s ease both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Mobile logo */
        .mobile-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          margin-bottom: 32px;
        }

        @media (min-width: 900px) {
          .mobile-logo { display: none; }
        }

        .form-header {
          margin-bottom: 32px;
        }

        .form-header h1 {
          font-family: 'DM Serif Display', serif;
          font-size: 1.9rem;
          color: #fff;
          letter-spacing: -0.03em;
          margin: 0 0 6px;
        }

        .form-header p {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.4);
          margin: 0;
          font-weight: 300;
        }

        /* Fields */
        .field-row {
          display: grid;
          gap: 14px;
          margin-bottom: 14px;
        }

        .field-row.cols-2 {
          grid-template-columns: 1fr 1fr;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field label {
          font-size: 0.72rem;
          font-weight: 500;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .field input,
        .field .select-trigger {
          background: rgba(255,255,255,0.04) !important;
          border: 1px solid rgba(255,255,255,0.09) !important;
          border-radius: 8px !important;
          color: #fff !important;
          font-family: 'DM Sans', sans-serif !important;
          font-size: 0.88rem !important;
          height: 42px !important;
          padding: 0 14px !important;
          transition: border-color 0.2s, background 0.2s;
          outline: none;
          width: 100%;
          box-sizing: border-box;
        }

        .field input::placeholder {
          color: rgba(255,255,255,0.2) !important;
        }

        .field input:focus {
          border-color: rgba(200,40,40,0.6) !important;
          background: rgba(255,255,255,0.06) !important;
          box-shadow: 0 0 0 3px rgba(180,20,20,0.12) !important;
        }

        /* Divider */
        .form-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 20px 0;
        }

        /* Submit button */
        .submit-btn {
          width: 100%;
          height: 46px;
          background: linear-gradient(135deg, #b81c1c, #e03030) !important;
          border: none !important;
          border-radius: 8px !important;
          color: #fff !important;
          font-family: 'DM Sans', sans-serif !important;
          font-size: 0.9rem !important;
          font-weight: 600 !important;
          letter-spacing: 0.01em;
          cursor: pointer;
          box-shadow: 0 4px 24px rgba(180,20,20,0.35), inset 0 1px 0 rgba(255,255,255,0.1);
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          margin-top: 24px;
        }

        .submit-btn:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 6px 30px rgba(180,20,20,0.45), inset 0 1px 0 rgba(255,255,255,0.1);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .login-link {
          text-align: center;
          margin-top: 20px;
          font-size: 0.83rem;
          color: rgba(255,255,255,0.35);
        }

        .login-link a {
          color: #e05050;
          font-weight: 500;
          text-decoration: none;
        }

        .login-link a:hover {
          text-decoration: underline;
        }

        /* Thin red accent line top of card on mobile */
        .card-accent {
          height: 2px;
          background: linear-gradient(90deg, #c0392b, #e74c3c, transparent);
          border-radius: 2px 2px 0 0;
          margin-bottom: 28px;
          display: block;
        }

        @media (min-width: 900px) { .card-accent { display: none; } }
      `}</style>

      <div className="signup-root">
        <div className="glow-br" />
        <div className="scanlines" />

        <div className="signup-split">
          {/* ── Left brand panel ── */}
          <div className="brand-panel">
            <Link to="/" className="brand-logo">
              <div className="logo-icon">
                <Zap size={16} color="#fff" strokeWidth={2.5} />
              </div>
              <span className="logo-text">TeslaVest</span>
            </Link>

            <div className="brand-headline">
              <h2>Invest smarter.<br /><em>Drive better.</em></h2>
              <p>Grow your wealth with AI-driven portfolios — and put your returns toward a Tesla. Simple as that.</p>
            </div>

            <div className="brand-stats">
              <div className="stat">
                <span className="stat-value">$2.4B</span>
                <span className="stat-label">Assets managed</span>
              </div>
              <div className="stat">
                <span className="stat-value">94k</span>
                <span className="stat-label">Investors</span>
              </div>
              <div className="stat">
                <span className="stat-value">18%</span>
                <span className="stat-label">Avg. annual return</span>
              </div>
            </div>
          </div>

          {/* ── Right form panel ── */}
          <div className="form-panel">
            <div className="form-box">
              {/* Mobile logo */}
              <Link to="/" className="mobile-logo">
                <div className="logo-icon">
                  <Zap size={16} color="#fff" strokeWidth={2.5} />
                </div>
                <span className="logo-text">TeslaVest</span>
              </Link>

              <span className="card-accent" />

              <div className="form-header">
                <h1>Create account</h1>
                <p>Start earning in under 3 minutes.</p>
              </div>

              <form onSubmit={submit}>
                {/* Row 1 */}
                <div className="field-row cols-2">
                  <div className="field">
                    <label htmlFor="full_name">Full name</label>
                    <Input
                      id="full_name"
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      placeholder="Jane Doe"
                      className="select-trigger"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="username">Username</label>
                    <Input
                      id="username"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      placeholder="janedoe_"
                      className="select-trigger"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="field-row" style={{ marginBottom: 14 }}>
                  <div className="field">
                    <label htmlFor="email">Email</label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="jane@email.com"
                      className="select-trigger"
                    />
                  </div>
                </div>

                {/* Row 3 */}
                <div className="field-row cols-2">
                  <div className="field">
                    <label htmlFor="phone">Phone</label>
                    <Input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+1 000 000 0000"
                      className="select-trigger"
                    />
                  </div>
                  <div className="field">
                    <label>Gender</label>
                    <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                      <SelectTrigger className="select-trigger">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {genders.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="form-divider" />

                {/* Password */}
                <div className="field-row" style={{ marginBottom: 14 }}>
                  <div className="field">
                    <label htmlFor="password">Password</label>
                    <Input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Min. 8 characters"
                      className="select-trigger"
                    />
                  </div>
                </div>

                {/* Row 5 */}
                <div className="field-row cols-2">
                  <div className="field">
                    <label>Country</label>
                    <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
                      <SelectTrigger className="select-trigger">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="field">
                    <label>Currency</label>
                    <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                      <SelectTrigger className="select-trigger">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create account"}
                </Button>
              </form>

              <p className="login-link">
                Already have an account? <Link to="/login">Log in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
