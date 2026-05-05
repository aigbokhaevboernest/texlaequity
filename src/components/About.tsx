import { motion } from "framer-motion";
import { Lightbulb, Leaf, Award } from "lucide-react";

const values = [
  { icon: Lightbulb, title: "Innovation", desc: "We push the boundaries of electric mobility and digital wealth." },
  { icon: Leaf, title: "Sustainability", desc: "Every Tesla we deliver accelerates the world to clean energy." },
  { icon: Award, title: "Excellence", desc: "Uncompromising quality from showroom to delivery." },
];

const team = [
  { name: "James Hilterson", role: "Founder & CEO" },
  { name: "Sarah Chen", role: "Head of Operations" },
  { name: "Marcus Rivera", role: "Director of Sales" },
  { name: "Aisha Patel", role: "Customer Experience Lead" },
];

const About = () => (
  <section id="about" className="py-24 md:py-32 bg-surface/40 border-y border-border/60">
    <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
      <p className="label-mono text-foreground/40 mb-3 md:mb-4">02 — About Us</p>
      <h2 className="font-display text-[34px] sm:text-5xl md:text-6xl font-light tracking-[-0.035em] leading-[1.05] mb-6">
        Built for the road ahead.
      </h2>
      <p className="text-foreground/60 max-w-2xl text-[15px] md:text-base font-light leading-relaxed mb-16">
        Founded with a single belief — that the future of mobility belongs to those who invest in it. We connect
        digital wealth with the world’s most iconic electric vehicles, making Tesla ownership accessible, secure,
        and effortless. Our mission is simple: empower a new generation of drivers and investors to move the world
        forward, one mile at a time.
      </p>

      <div className="grid md:grid-cols-3 gap-6 mb-20">
        {values.map((v, i) => (
          <motion.div
            key={v.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="rounded-3xl bg-background border border-border/60 p-8"
          >
            <v.icon className="w-6 h-6 text-primary mb-5" />
            <h3 className="font-display text-xl font-medium mb-2">{v.title}</h3>
            <p className="text-sm text-foreground/55 font-light leading-relaxed">{v.desc}</p>
          </motion.div>
        ))}
      </div>

      <p className="label-mono text-foreground/40 mb-6">The Team</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {team.map((m) => (
          <div key={m.name} className="rounded-2xl bg-background border border-border/60 p-5">
            <div className="w-12 h-12 rounded-full bg-foreground/5 mb-3 flex items-center justify-center font-display text-foreground/60">
              {m.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <p className="font-medium text-[14px]">{m.name}</p>
            <p className="text-[12px] text-foreground/50">{m.role}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default About;
