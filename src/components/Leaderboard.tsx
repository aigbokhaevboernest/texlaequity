import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const traders = [
  { rank: 1, name: "Elon Musk", handle: "@elonmusk", roi: "+342%", win: "94%", followers: "1.2M", featured: true },
  { rank: 2, name: "Cathie Wood", handle: "@cathiedwood", roi: "+187%", win: "81%", followers: "412K" },
  { rank: 3, name: "Michael Saylor", handle: "@saylor", roi: "+164%", win: "79%", followers: "298K" },
  { rank: 4, name: "CZ Binance", handle: "@cz_binance", roi: "+142%", win: "76%", followers: "245K" },
  { rank: 5, name: "Vitalik Buterin", handle: "@vitalikb", roi: "+128%", win: "73%", followers: "188K" },
];

const Leaderboard = () => {
  const nav = useNavigate();
  return (
    <section id="leaderboard" className="py-32 relative">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="flex items-end justify-between mb-16 flex-wrap gap-6">
          <div className="max-w-2xl">
            <p className="label-mono text-foreground/40 mb-4">03 — Copy Trading</p>
            <h2 className="font-display text-4xl md:text-6xl font-light tracking-[-0.035em] leading-[1]">
              Mirror the moves<br />
              <span className="text-foreground/40">of the best.</span>
            </h2>
          </div>
        </div>

        <div className="border-t border-border">
          {traders.map((t, idx) => (
            <motion.div
              key={t.rank}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
              className="grid grid-cols-12 gap-4 items-center py-6 border-b border-border hover:bg-surface/50 transition-colors px-2 group"
            >
              <div className="col-span-1 font-mono text-xs text-foreground/40">
                {String(t.rank).padStart(2, "0")}
              </div>
              <div className="col-span-5 md:col-span-4 flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium ${
                    t.featured ? "bg-primary text-primary-foreground" : "bg-surface text-foreground/70"
                  }`}
                >
                  {t.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-[15px] truncate">{t.name}</p>
                  <p className="text-[11px] text-foreground/40 font-mono truncate">{t.handle}</p>
                </div>
              </div>
              <div className="col-span-2 font-display font-light text-xl text-primary">{t.roi}</div>
              <div className="hidden md:block col-span-2 text-sm text-foreground/60">Win {t.win}</div>
              <div className="hidden md:block col-span-1 text-sm text-foreground/40">{t.followers}</div>
              <div className="col-span-4 md:col-span-2 flex justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => nav("/signup")}
                  className="rounded-full text-[12px] font-medium hover:bg-foreground hover:text-background transition-colors group/btn"
                >
                  Copy
                  <ArrowUpRight className="w-3 h-3 ml-1 group-hover/btn:rotate-45 transition-transform" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Leaderboard;
