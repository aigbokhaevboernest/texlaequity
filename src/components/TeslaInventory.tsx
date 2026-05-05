import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Link } from "react-router-dom";
import { vehicles, badgeStyles, buildMailto } from "@/lib/inventory";

const TeslaInventory = () => {
  const autoplay = useRef(
    Autoplay({ delay: 3500, stopOnInteraction: false, stopOnMouseEnter: true })
  );
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", dragFree: false },
    [autoplay.current]
  );
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSel = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSel);
    onSel();
  }, [emblaApi]);

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

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex -ml-6">
            {vehicles.map((v, idx) => (
              <div
                key={v.model}
                className="pl-6 shrink-0 grow-0 basis-full sm:basis-1/2 lg:basis-1/3"
              >
                <motion.article
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: idx * 0.05, ease: [0.4, 0, 0.2, 1] }}
                  className="group rounded-3xl bg-surface border border-border/60 overflow-hidden flex flex-col h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant"
                >
                  <div className="relative aspect-[4/3] bg-surface overflow-hidden">
                    <img
                      src={v.image}
                      alt={`Tesla ${v.model}`}
                      loading="lazy"
                      className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <span className={`absolute top-4 right-4 text-[11px] font-medium px-2.5 py-1 rounded-full border ${badgeStyles[v.badge]}`}>
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
                      <span>{v.range}</span>
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
              </div>
            ))}
          </div>
        </div>

        <div className="hidden md:flex absolute -left-2 top-1/2 -translate-y-1/2 z-10">
          <button
            onClick={() => emblaApi?.scrollPrev()}
            aria-label="Previous"
            className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center hover:bg-surface transition-colors shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
        <div className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10">
          <button
            onClick={() => emblaApi?.scrollNext()}
            aria-label="Next"
            className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center hover:bg-surface transition-colors shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex justify-center gap-1.5 mt-8">
          {vehicles.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                selected === i ? "w-6 bg-foreground" : "w-1.5 bg-foreground/25"
              }`}
            />
          ))}
        </div>

        <div className="flex justify-center mt-10">
          <Link to="/inventory">
            <Button variant="outline" className="rounded-full h-11 px-6 text-[13px] font-medium">
              View Full Inventory
              <ArrowRight className="w-3.5 h-3.5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TeslaInventory;
