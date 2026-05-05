import { Car, Wallet, TrendingUp, Truck, Wrench, RefreshCcw, Zap } from "lucide-react";
import { motion } from "framer-motion";

const services = [
  { icon: Car, title: "Test Drives", desc: "Schedule a personalized test drive at a location near you." },
  { icon: Wallet, title: "Financing", desc: "Flexible financing options with competitive APR for every Tesla model." },
  { icon: TrendingUp, title: "Investment", desc: "Grow your portfolio and convert returns directly into ownership." },
  { icon: Truck, title: "Home Delivery", desc: "White-glove delivery straight to your driveway." },
  { icon: Wrench, title: "Maintenance", desc: "Mobile service technicians and over-the-air software updates." },
  { icon: RefreshCcw, title: "Trade-In", desc: "Get an instant valuation and seamless trade-in toward your new Tesla." },
  { icon: Zap, title: "Charging Setup", desc: "Wall connector installation and Supercharger network access." },
];

const Services = () => (
  <section id="services" className="py-24 md:py-32">
    <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
      <p className="label-mono text-foreground/40 mb-3 md:mb-4">03 — Our Services</p>
      <h2 className="font-display text-[34px] sm:text-5xl md:text-6xl font-light tracking-[-0.035em] leading-[1.05] mb-12 md:mb-16">
        Everything Tesla,<br />in one place.
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className="rounded-3xl bg-surface border border-border/60 p-8 hover:-translate-y-1 hover:shadow-elegant transition-all duration-300"
          >
            <s.icon className="w-6 h-6 text-primary mb-5" />
            <h3 className="font-display text-xl font-medium mb-2">{s.title}</h3>
            <p className="text-sm text-foreground/55 font-light leading-relaxed">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Services;
