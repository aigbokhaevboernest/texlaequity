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
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="px-4 max-w-prose mx-auto">
          <div className="mb-10">
            <p className="label-mono text-foreground/40 mb-3">Legal</p>
            <h1 className="font-display text-3xl md:text-5xl font-light tracking-[-0.035em] leading-[1.05]">
              Terms &amp; Conditions
            </h1>
            <p className="mt-3 text-foreground/55 text-[15px] font-light">
              Last updated {new Date().getFullYear()}. Please read carefully.
            </p>
          </div>

          <div className="space-y-6">
            {sections.map(({ id, icon: Icon, title, body }) => (
              <section
                key={id}
                id={id}
                className="rounded-2xl border border-border/60 bg-surface/40 p-5 md:p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h2 className="font-display text-lg md:text-xl font-medium tracking-tight">{title}</h2>
                </div>
                <p className="text-foreground/65 font-light leading-relaxed text-[14px]">{body}</p>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
