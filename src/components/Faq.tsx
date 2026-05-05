import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "How do I order a Tesla?", a: "Choose a model from our inventory and click Order Now. We’ll contact you to finalize the configuration, payment, and delivery." },
  { q: "What financing options are available?", a: "We offer cash, lease, and loan financing through certified partners. Approval typically completes within 48 hours." },
  { q: "How does the investment platform work?", a: "Fund your account, choose a plan, and earn daily ROI that you can withdraw or convert into a Tesla purchase." },
  { q: "When will my Tesla be delivered?", a: "In-stock vehicles ship in 1–3 weeks. Limited and Reserve models follow a queue based on configuration." },
  { q: "Can I trade in my current car?", a: "Yes. We accept gas and electric trade-ins. Submit your VIN and photos for an instant valuation." },
  { q: "Where can I charge my Tesla?", a: "Use the Tesla Supercharger network, third-party stations, or install a Wall Connector at home." },
  { q: "What warranty is included?", a: "Every new Tesla includes a 4-year/50,000-mile basic warranty and 8-year battery & drive unit coverage." },
  { q: "How do reservations work?", a: "Reserve Now models require a refundable deposit. You’ll be invited to configure when production opens." },
  { q: "Is my payment secure?", a: "All transactions are encrypted end-to-end and processed through tier-1 banking partners." },
  { q: "Can I cancel or modify my order?", a: "Yes — orders can be modified or cancelled up to 72 hours before scheduled delivery." },
];

const Faq = () => (
  <section id="faq" className="py-24 md:py-32 bg-surface/40 border-y border-border/60">
    <div className="max-w-[900px] mx-auto px-6 lg:px-10">
      <p className="label-mono text-foreground/40 mb-3 md:mb-4">04 — FAQ</p>
      <h2 className="font-display text-[34px] sm:text-5xl md:text-6xl font-light tracking-[-0.035em] leading-[1.05] mb-12">
        Questions, answered.
      </h2>

      <Accordion type="single" collapsible className="w-full">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="border-border/60">
            <AccordionTrigger className="text-left font-medium text-[15px] hover:no-underline">
              {f.q}
            </AccordionTrigger>
            <AccordionContent className="text-foreground/60 font-light leading-relaxed text-[14px]">
              {f.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

export default Faq;
