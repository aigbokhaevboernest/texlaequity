import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { carImages, formatUSD, toBTC } from "@/lib/cars";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface Car {
  id: string;
  model: string;
  tagline: string | null;
  price_usd: number;
  range_mi: number | null;
  top_speed: number | null;
  zero_to_sixty: number | null;
}

const TeslaShowcase = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const nav = useNavigate();

  useEffect(() => {
    supabase
      .from("tesla_cars")
      .select("*")
      .order("sort_order", { ascending: true })
      .then(({ data }) => data && setCars(data as Car[]));
  }, []);

  const scroll = (dir: "l" | "r") => {
    scrollerRef.current?.scrollBy({ left: dir === "l" ? -420 : 420, behavior: "smooth" });
  };

  return (
    <section id="vehicles" className="py-24 md:py-32 relative">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 mb-12 md:mb-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-2xl">
            <p className="label-mono text-foreground/40 mb-3 md:mb-4">01 — The Garage</p>
            <h2 className="font-display text-[34px] sm:text-5xl md:text-6xl font-light tracking-[-0.035em] text-foreground leading-[1.05]">
              Drive what your<br />investments earn.
            </h2>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => scroll("l")}
              className="w-10 h-10 rounded-full border border-border hover:bg-foreground/5 transition-colors flex items-center justify-center"
              aria-label="Previous"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("r")}
              className="w-10 h-10 rounded-full border border-border hover:bg-foreground/5 transition-colors flex items-center justify-center"
              aria-label="Next"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-8 px-6 lg:px-10 scroll-smooth scrollbar-hide"
        style={{ scrollbarWidth: "none" }}
      >
        {cars.map((car, idx) => (
          <motion.article
            key={car.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: idx * 0.05, ease: [0.4, 0, 0.2, 1] }}
            className="snap-start shrink-0 w-[300px] md:w-[380px] group"
          >
            <div className="relative aspect-[4/3] rounded-3xl bg-surface overflow-hidden mb-5">
              <img
                src={carImages[car.model]}
                alt={`Tesla ${car.model}`}
                loading="lazy"
                className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute top-4 left-4 label-mono text-foreground/50">{String(idx + 1).padStart(2, "0")}</div>
            </div>

            <div className="flex items-baseline justify-between mb-2">
              <h3 className="font-display text-2xl font-medium tracking-tight">{car.model}</h3>
              <p className="font-display text-lg font-light text-foreground/60">{formatUSD(car.price_usd)}</p>
            </div>
            <p className="text-sm text-foreground/50 mb-4 line-clamp-1">{car.tagline}</p>

            <div className="flex items-center justify-between text-[11px] text-foreground/50 mb-5 pb-5 border-b border-border">
              <span>{car.range_mi}mi range</span>
              <span>•</span>
              <span>{car.top_speed}mph</span>
              <span>•</span>
              <span>{car.zero_to_sixty}s 0–60</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-foreground/40">≈ {toBTC(car.price_usd)} BTC</span>
              <Button
                onClick={() => nav("/dashboard")}
                size="sm"
                variant="ghost"
                className="text-[13px] font-medium px-0 hover:bg-transparent hover:text-primary group/btn"
              >
                Order
                <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover/btn:translate-x-0.5 transition-transform" />
              </Button>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
};

export default TeslaShowcase;
