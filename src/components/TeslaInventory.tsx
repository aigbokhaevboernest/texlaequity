import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const ORDER_EMAIL = "jameshilterson@gmail.com";

type Stock = "In Stock" | "Limited Stock" | "Reserve Now";

interface Vehicle {
  model: string;
  tagline: string;
  range: string;
  zero: string;
  top: string;
  price: string;
  priceNum: number;
  badge: Stock;
  image: string;
  description: string;
}

const vehicles: Vehicle[] = [
  {
    model: "Model S",
    tagline: "Plaid performance sedan",
    range: "405 mi",
    zero: "1.99s",
    top: "200 mph",
    price: "$74,990",
    priceNum: 74990,
    badge: "In Stock",
    image: "https://digitalassets.tesla.com/tesla-contents/image/upload/h_2034,w_2880,c_fit,f_auto,q_auto:best/Mega-Menu-Vehicles-Model-S.png",
    description:
      "The Model S redefines what a car can be. With over 400 miles of range, ludicrous acceleration, and a minimalist interior built around a 17\" cinematic display — this is the future of driving, today.",
  },
  {
    model: "Model 3",
    tagline: "The world’s best-selling EV",
    range: "358 mi",
    zero: "3.1s",
    top: "162 mph",
    price: "$40,240",
    priceNum: 40240,
    badge: "In Stock",
    image: "https://digitalassets.tesla.com/tesla-contents/image/upload/h_2034,w_2880,c_fit,f_auto,q_auto:best/Mega-Menu-Vehicles-Model-3.png",
    description:
      "The world’s best-selling electric car. The Model 3 combines long range, advanced safety, and cutting-edge technology in a sleek, affordable package perfect for everyday driving.",
  },
  {
    model: "Model X",
    tagline: "Falcon-wing flagship SUV",
    range: "348 mi",
    zero: "2.5s",
    top: "163 mph",
    price: "$79,990",
    priceNum: 79990,
    badge: "In Stock",
    image: "https://digitalassets.tesla.com/tesla-contents/image/upload/h_2034,w_2880,c_fit,f_auto,q_auto:best/Mega-Menu-Vehicles-Model-X.png",
    description:
      "With iconic falcon wing doors, seating for up to 7, and Plaid performance that rivals supercars — the Model X is the most capable and safest SUV ever built.",
  },
  {
    model: "Model Y",
    tagline: "Versatile family electric SUV",
    range: "330 mi",
    zero: "3.5s",
    top: "135 mph",
    price: "$43,990",
    priceNum: 43990,
    badge: "In Stock",
    image: "https://digitalassets.tesla.com/tesla-contents/image/upload/h_2034,w_2880,c_fit,f_auto,q_auto:best/Mega-Menu-Vehicles-Model-Y.png",
    description:
      "The perfect blend of versatility and performance. A spacious interior, panoramic glass roof, and up to 7-seat configuration make it the ideal family vehicle for the electric age.",
  },
  {
    model: "Cybertruck",
    tagline: "Stainless-steel exoskeleton truck",
    range: "340 mi",
    zero: "2.6s",
    top: "130 mph",
    price: "$59,990",
    priceNum: 59990,
    badge: "Limited Stock",
    image: "https://digitalassets.tesla.com/tesla-contents/image/upload/h_2034,w_2880,c_fit,f_auto,q_auto:best/Mega-Menu-Vehicles-Cybertruck.png",
    description:
      "Built with an ultra-hard stainless steel exoskeleton, armored glass, and tri-motor all-wheel drive — the Cybertruck is the toughest, most capable truck Tesla has ever made.",
  },
  {
    model: "Semi",
    tagline: "Long-haul electric class 8",
    range: "500 mi",
    zero: "5.0s",
    top: "65 mph",
    price: "$150,000",
    priceNum: 150000,
    badge: "Reserve Now",
    image: "https://digitalassets.tesla.com/tesla-contents/image/upload/h_2034,w_2880,c_fit,f_auto,q_auto:best/Mega-Menu-Vehicles-Semi.png",
    description:
      "The Tesla Semi transforms long-haul trucking with 500 miles of range, instant torque, and a driver-focused cabin designed for comfort on the longest routes.",
  },
  {
    model: "Roadster",
    tagline: "The fastest car in the world",
    range: "620 mi",
    zero: "1.9s",
    top: "250+ mph",
    price: "$200,000",
    priceNum: 200000,
    badge: "Reserve Now",
    image: "https://digitalassets.tesla.com/tesla-contents/image/upload/h_2034,w_2880,c_fit,f_auto,q_auto:best/Mega-Menu-Vehicles-Roadster.png",
    description:
      "The new Roadster shatters every performance record. With 620 miles of range, 0–60 in under 2 seconds, and a top speed exceeding 250 mph — this is the ultimate electric machine.",
  },
];

const badgeStyles: Record<Stock, string> = {
  "In Stock": "bg-success/15 text-success border-success/30",
  "Limited Stock": "bg-amber-500/15 text-amber-600 border-amber-500/30",
  "Reserve Now": "bg-blue-500/15 text-blue-600 border-blue-500/30",
};

const buildMailto = (v: Vehicle) =>
  `mailto:${ORDER_EMAIL}?subject=${encodeURIComponent(
    `Tesla Order Inquiry – ${v.model}`
  )}&body=${encodeURIComponent(
    `Hello, I'm interested in the ${v.model} at ${v.price}. Please contact me.`
  )}`;

const TeslaInventory = () => {
  return (
    <section id="inventory" className="py-24 md:py-32 relative">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 mb-12 md:mb-16">
        <p className="label-mono text-foreground/40 mb-3 md:mb-4">01 — Tesla Inventory</p>
        <h2 className="font-display text-[34px] sm:text-5xl md:text-6xl font-light tracking-[-0.035em] text-foreground leading-[1.05]">
          Drive Electric.<br />Drive Tesla.
        </h2>
        <p className="mt-4 text-foreground/55 max-w-xl text-[15px] font-light">
          Explore our full lineup of performance electric vehicles.
        </p>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((v, idx) => (
          <motion.article
            key={v.model}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: idx * 0.05, ease: [0.4, 0, 0.2, 1] }}
            className="group rounded-3xl bg-surface border border-border/60 overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant"
          >
            <div className="relative aspect-[4/3] bg-surface overflow-hidden">
              <img
                src={v.image}
                alt={`Tesla ${v.model}`}
                loading="lazy"
                className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <span
                className={`absolute top-4 right-4 text-[11px] font-medium px-2.5 py-1 rounded-full border ${badgeStyles[v.badge]}`}
              >
                {v.badge}
              </span>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-baseline justify-between mb-1">
                <h3 className="font-display text-2xl font-medium tracking-tight">{v.model}</h3>
                <p className="font-display text-lg font-light text-foreground/60">{v.price}</p>
              </div>
              <p className="text-sm text-foreground/50 mb-4 line-clamp-1">{v.tagline}</p>

              <div className="flex items-center justify-between text-[11px] text-foreground/50 mb-4 pb-4 border-b border-border">
                <span>{v.range} range</span>
                <span>•</span>
                <span>{v.top}</span>
                <span>•</span>
                <span>{v.zero} 0–60</span>
              </div>

              <p className="text-[13px] leading-relaxed text-foreground/60 font-light mb-6 line-clamp-3">
                {v.description}
              </p>

              <a href={buildMailto(v)} className="mt-auto">
                <Button className="w-full rounded-full h-11 text-[13px] font-medium group/btn">
                  Order Now
                  <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover/btn:translate-x-0.5 transition-transform" />
                </Button>
              </a>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
};

export default TeslaInventory;
