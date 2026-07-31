import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ArrowRight } from "lucide-react";
import { vehicles, badgeStyles } from "@/lib/inventory";
import { useCurrency } from "@/hooks/useCurrency";
import { useNavigate } from "react-router-dom";

// Parse price string like "$89,990" → number 89990
const parsePrice = (priceStr: string): number => {
  const n = Number(priceStr.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
};

export default function Cars() {
  const { format } = useCurrency();
  const nav = useNavigate();

  const [selected, setSelected] = useState<(typeof vehicles)[0] | null>(null);
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = () => {
    if (!selected) return;
    setConfirming(true);
    const priceUsd = parsePrice(selected.price);
    // Small delay so the spinner is visible before navigation
    setTimeout(() => {
      setConfirming(false);
      setSelected(null);
      nav(`/dashboard/deposit?amount=${priceUsd}`);
    }, 600);
  };

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <p className="label-mono text-muted-foreground mb-2">Tesla showroom</p>
        <h1 className="font-display text-3xl font-light tracking-[-0.03em]">Cars</h1>
        <p className="text-muted-foreground text-[14px] mt-1">
          Order a Tesla using your portfolio balance or crypto.
        </p>
      </div>

      {/* Vehicle grid — matches Inventory page layout exactly */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {vehicles.map((v) => (
          <article
            key={v.model}
            className="group rounded-2xl md:rounded-3xl bg-card border border-border/60 overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            {/* Image area */}
            <div className="relative aspect-[4/3] bg-card overflow-hidden">
              <img
                src={v.image}
                alt={`Tesla ${v.model}`}
                loading="lazy"
                className="w-full h-full object-contain p-3 md:p-6 group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <span
                className={`absolute top-2 right-2 md:top-4 md:right-4 text-[10px] md:text-[11px] font-medium px-2 py-0.5 md:px-2.5 md:py-1 rounded-full border ${badgeStyles[v.badge]}`}
              >
                {v.badge}
              </span>
            </div>

            {/* Card body */}
            <div className="p-3 md:p-6 flex-1 flex flex-col">
              <div className="flex items-baseline justify-between mb-1 gap-1">
                <h3 className="font-display text-base md:text-xl font-medium tracking-tight">{v.model}</h3>
                <p className="font-display text-xs md:text-base font-light text-muted-foreground shrink-0">{v.price}</p>
              </div>
              <p className="text-[11px] md:text-sm text-muted-foreground mb-3 line-clamp-1">{v.tagline}</p>

              {/* Specs — hidden on mobile */}
              <div className="hidden md:flex items-center justify-between text-[11px] text-muted-foreground mb-4 pb-4 border-b border-border">
                <span>{v.range}</span>
                <span>•</span>
                <span>{v.top}</span>
                <span>•</span>
                <span>{v.zero} 0–60</span>
              </div>

              {/* Description — hidden on mobile */}
              <p className="hidden md:block text-[13px] leading-relaxed text-muted-foreground font-light mb-6 line-clamp-3">
                {v.description}
              </p>

              <div className="mt-auto">
                <Button
                  onClick={() => setSelected(v)}
                  className="w-full rounded-full h-9 md:h-11 text-[12px] md:text-[13px] font-medium"
                >
                  Order Now
                  <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Confirm dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && !confirming && setSelected(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display font-light text-xl">Confirm order</DialogTitle>
          </DialogHeader>

          {selected && (() => {
            const priceUsd = parsePrice(selected.price);
            return (
              <div className="space-y-4">
                {/* Vehicle preview */}
                <div className="rounded-xl bg-muted/40 p-4 flex items-center gap-4">
                  <img
                    src={selected.image}
                    alt={selected.model}
                    className="w-24 h-16 object-contain shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-display font-medium text-[15px]">{selected.model}</p>
                    <p className="text-[12px] text-muted-foreground line-clamp-1 mb-1">{selected.tagline}</p>
                    <p className="font-display font-medium">
                      {priceUsd > 0 ? format(priceUsd) : selected.price}
                    </p>
                  </div>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  {[
                    { label: "Range",     value: selected.range },
                    { label: "Top Speed", value: selected.top   },
                    { label: "0–60",      value: selected.zero  },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg bg-muted/40 p-2">
                      <p className="text-muted-foreground mb-0.5">{s.label}</p>
                      <p className="font-medium">{s.value}</p>
                    </div>
                  ))}
                </div>

                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  Clicking{" "}
                  <span className="font-medium text-foreground">Confirm & Deposit</span>{" "}
                  will redirect you to the deposit page with{" "}
                  <span className="font-medium text-foreground">
                    {priceUsd > 0 ? format(priceUsd) : selected.price}
                  </span>{" "}
                  pre-filled. Your order will be activated once payment is confirmed.
                </p>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-full"
                    onClick={() => setSelected(null)}
                    disabled={confirming}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 rounded-full"
                    onClick={handleConfirm}
                    disabled={confirming}
                  >
                    {confirming
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : "Confirm & Deposit"}
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

