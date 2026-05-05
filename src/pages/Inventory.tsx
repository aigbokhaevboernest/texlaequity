import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { vehicles, badgeStyles, buildMailto } from "@/lib/inventory";

const Inventory = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="pt-28 pb-24">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 mb-12">
        <p className="label-mono text-foreground/40 mb-3">Tesla Inventory</p>
        <h1 className="font-display text-4xl md:text-6xl font-light tracking-[-0.035em] leading-[1.05]">
          The full lineup.
        </h1>
        <p className="mt-4 text-foreground/55 max-w-xl text-[15px] font-light">
          Every Tesla model, ready to order or reserve.
        </p>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {vehicles.map((v) => (
          <article
            key={v.model}
            className="group rounded-2xl md:rounded-3xl bg-surface border border-border/60 overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant"
          >
            <div className="relative aspect-[4/3] bg-surface overflow-hidden">
              <img
                src={v.image}
                alt={`Tesla ${v.model}`}
                loading="lazy"
                className="w-full h-full object-contain p-3 md:p-6 group-hover:scale-105 transition-transform duration-700"
              />
              <span className={`absolute top-2 right-2 md:top-4 md:right-4 text-[10px] md:text-[11px] font-medium px-2 py-0.5 md:px-2.5 md:py-1 rounded-full border ${badgeStyles[v.badge]}`}>
                {v.badge}
              </span>
            </div>
            <div className="p-3 md:p-6 flex-1 flex flex-col">
              <div className="flex items-baseline justify-between mb-1 gap-2">
                <h3 className="font-display text-base md:text-2xl font-medium tracking-tight">{v.model}</h3>
                <p className="font-display text-xs md:text-lg font-light text-foreground/60">{v.price}</p>
              </div>
              <p className="text-[11px] md:text-sm text-foreground/50 mb-3 md:mb-4 line-clamp-1">{v.tagline}</p>
              <div className="hidden md:flex items-center justify-between text-[11px] text-foreground/50 mb-4 pb-4 border-b border-border">
                <span>{v.range}</span><span>•</span><span>{v.top}</span><span>•</span><span>{v.zero}</span>
              </div>
              <p className="hidden md:block text-[13px] leading-relaxed text-foreground/60 font-light mb-6 line-clamp-3">
                {v.description}
              </p>
              <a href={buildMailto(v)} className="mt-auto">
                <Button className="w-full rounded-full h-9 md:h-11 text-[12px] md:text-[13px] font-medium">
                  Order Now
                  <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5 ml-1" />
                </Button>
              </a>
            </div>
          </article>
        ))}
      </div>
    </main>
    <Footer />
  </div>
);

export default Inventory;
