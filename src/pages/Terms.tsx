import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  FileCheck, ShoppingBag, DollarSign, Package, CreditCard,
  Truck, XCircle, Lock, Shield, Scale,
} from "lucide-react";

const sections = [
  { id: "acceptance", icon: FileCheck, title: "Acceptance", body: "By accessing or using this website, you agree to be bound by these Terms and all applicable laws and regulations. If you do not agree, please discontinue use." },
  { id: "purchases", icon: ShoppingBag, title: "Purchases", body: "All vehicle purchases are subject to availability, configuration confirmation, and successful payment processing. We reserve the right to refuse or cancel orders." },
  { id: "pricing", icon: DollarSign, title: "Pricing", body: "Prices listed are in USD and exclude taxes, registration, and delivery fees unless otherwise noted. Prices may change without notice." },
  { id: "orders", icon: Package, title: "Orders", body: "An order is considered confirmed only after written acceptance and receipt of payment or deposit. Order confirmations are sent via email." },
  { id: "payment", icon: CreditCard, title: "Payment", body: "Accepted payment methods include bank wire, certified financing, and approved cryptocurrencies. All payments are non-transferable." },
  { id: "delivery", icon: Truck, title: "Delivery", body: "Estimated delivery times are provided in good faith. We are not liable for delays caused by manufacturing, logistics, or force majeure events." },
  { id: "cancellations", icon: XCircle, title: "Cancellations", body: "Orders may be cancelled up to 72 hours before scheduled delivery. Reservation deposits are refundable per the reservation agreement." },
  { id: "privacy", icon: Lock, title: "Privacy", body: "Your use of this site is also governed by our Privacy Policy, which forms part of these Terms." },
  { id: "liability", icon: Shield, title: "Liability", body: "To the fullest extent permitted by law, we are not liable for indirect, incidental, or consequential damages arising from use of the site or our services." },
  { id: "law", icon: Scale, title: "Governing Law", body: "These Terms are governed by the laws of the jurisdiction in which the company is registered, without regard to conflict-of-law provisions." },
];

const Terms = () => {
  const [active, setActive] = useState(sections[0].id);

  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-24">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <div className="mb-12">
            <p className="label-mono text-foreground/40 mb-3">Legal</p>
            <h1 className="font-display text-4xl md:text-6xl font-light tracking-[-0.035em] leading-[1.05]">
              Terms &amp; Conditions
            </h1>
            <p className="mt-4 text-foreground/55 max-w-xl text-[15px] font-light">
              Last updated {new Date().getFullYear()}. Please read carefully.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-10">
            <aside className="lg:col-span-3">
              <div className="lg:sticky lg:top-24">
                <p className="label-mono text-foreground/40 mb-4">Contents</p>
                <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
                  {sections.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className={`text-[13px] py-1.5 px-2 rounded-md transition-colors whitespace-nowrap ${
                        active === s.id
                          ? "text-foreground bg-surface"
                          : "text-foreground/55 hover:text-foreground"
                      }`}
                    >
                      {s.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            <div className="lg:col-span-9 space-y-10">
              {sections.map(({ id, icon: Icon, title, body }) => (
                <section
                  key={id}
                  id={id}
                  className="scroll-mt-28 rounded-2xl border border-border/60 bg-surface/40 p-6 md:p-8"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h2 className="font-display text-xl md:text-2xl font-medium tracking-tight">{title}</h2>
                  </div>
                  <p className="text-foreground/65 font-light leading-relaxed text-[14px]">{body}</p>
                </section>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
