import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
  const [active, setActive] = useState(sections[0].id);

  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
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
              Privacy Policy
            </h1>
            <p className="mt-4 text-foreground/55 max-w-xl text-[15px] font-light">
              How we collect, use, and protect your information.
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
                        active === s.id ? "text-foreground bg-surface" : "text-foreground/55 hover:text-foreground"
                      }`}
                    >
                      {s.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            <div className="lg:col-span-9">
              <Accordion type="multiple" defaultValue={sections.map((s) => s.id)} className="space-y-4">
                {sections.map(({ id, icon: Icon, title, body }) => (
                  <AccordionItem
                    key={id}
                    value={id}
                    id={id}
                    className="scroll-mt-28 rounded-2xl border border-border/60 bg-surface/40 px-6 md:px-8"
                  >
                    <AccordionTrigger className="hover:no-underline py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-display text-lg md:text-xl font-medium tracking-tight">{title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-foreground/65 font-light leading-relaxed text-[14px] pb-6 pl-[52px]">
                      {body}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Policies;
