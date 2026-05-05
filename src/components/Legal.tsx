const Section = ({ id, title, eyebrow, children }: { id: string; title: string; eyebrow: string; children: React.ReactNode }) => (
  <section id={id} className="py-24 md:py-32 border-t border-border/60">
    <div className="max-w-[900px] mx-auto px-6 lg:px-10">
      <p className="label-mono text-foreground/40 mb-3 md:mb-4">{eyebrow}</p>
      <h2 className="font-display text-[34px] sm:text-5xl md:text-6xl font-light tracking-[-0.035em] leading-[1.05] mb-10">
        {title}
      </h2>
      <div className="space-y-6 text-foreground/65 font-light leading-relaxed text-[14px]">{children}</div>
    </div>
  </section>
);

const H = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-2">{children}</h3>
);

export const Terms = () => (
  <Section id="terms" eyebrow="05 — Terms & Conditions" title="Terms & Conditions">
    <H>Acceptance</H>
    <p>By accessing or using this website, you agree to be bound by these Terms and all applicable laws and regulations.</p>
    <H>Purchases</H>
    <p>All vehicle purchases are subject to availability, configuration confirmation, and successful payment processing.</p>
    <H>Pricing</H>
    <p>Prices listed are in USD and exclude taxes, registration, and delivery fees unless otherwise noted. Prices may change without notice.</p>
    <H>Orders</H>
    <p>An order is considered confirmed only after written acceptance and receipt of payment or deposit.</p>
    <H>Payment</H>
    <p>Accepted payment methods include bank wire, certified financing, and approved cryptocurrencies. All payments are non-transferable.</p>
    <H>Delivery</H>
    <p>Estimated delivery times are provided in good faith. We are not liable for delays caused by manufacturing, logistics, or force majeure events.</p>
    <H>Cancellations</H>
    <p>Orders may be cancelled up to 72 hours before scheduled delivery. Reservation deposits are refundable per the reservation agreement.</p>
    <H>Privacy</H>
    <p>Your use of this site is also governed by our Privacy Policy, which forms part of these Terms.</p>
    <H>Liability</H>
    <p>To the fullest extent permitted by law, we are not liable for indirect, incidental, or consequential damages arising from use of the site or our services.</p>
    <H>Governing Law</H>
    <p>These Terms are governed by the laws of the jurisdiction in which the company is registered, without regard to conflict-of-law provisions.</p>
  </Section>
);

export const Privacy = () => (
  <Section id="privacy" eyebrow="06 — Privacy Policy" title="Privacy Policy">
    <H>What We Collect</H>
    <p>We collect information you provide directly — such as name, email, phone, and payment details — and technical data such as IP address and browser type.</p>
    <H>How We Use It</H>
    <p>We use your information to process orders, deliver vehicles, provide customer support, and improve our services.</p>
    <H>Third Parties</H>
    <p>We share data only with trusted partners required to fulfill your order, such as payment processors, logistics providers, and financing partners.</p>
    <H>Cookies</H>
    <p>We use cookies and similar technologies to enhance your browsing experience, analyze traffic, and personalize content.</p>
    <H>Your Rights</H>
    <p>You may request access, correction, or deletion of your personal data at any time.</p>
    <H>Contact</H>
    <p>For privacy-related inquiries, contact us at jameshilterson@gmail.com.</p>
  </Section>
);
