import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Database, Settings, Users, Cookie, UserCheck, Mail } from "lucide-react";

const sections = [
  { id: "collect", icon: Database, title: "What We Collect", body: "We collect information you provide directly — such as name, email, phone, and payment details — and technical data such as IP address, device, and browser type." },
  { id: "use", icon: Settings, title: "How We Use It", body: "We use your information to process orders, deliver vehicles, provide customer support, prevent fraud, and improve our services." },
  { id: "third", icon: Users, title: "Third Parties", body: "We share data only with trusted partners required to fulfill your order, such as payment processors, logistics providers, and financing partners." },
  { id: "cookies", icon: Cookie, title: "Cookies", body: "We use cookies and similar technologies to enhance your browsing experience, analyze traffic, and personalize content. You can disable cookies in your browser settings." },
  { id: "rights", icon: UserCheck, title: "Your Rights", body: "You may request access, correction, deletion, or export of your personal data at any time. We honor requests within 30 days." },
  { id: "contact", icon: Mail, title: "Contact", body: "For privacy-related inquiries, contact us at jameshilterson@gmail.com." },
];

const Policies = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="px-4 max-w-prose mx-auto">
          <div className="mb-10">
            <p className="label-mono text-foreground/40 mb-3">Legal</p>
            <h1 className="font-display text-3xl md:text-5xl font-light tracking-[-0.035em] leading-[1.05]">
              Privacy Policy
            </h1>
            <p className="mt-3 text-foreground/55 text-[15px] font-light">
              How we collect, use, and protect your information.
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

export default Policies;
