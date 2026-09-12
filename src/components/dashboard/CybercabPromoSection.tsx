import { Button } from "@/components/ui/button";
import { ArrowRight, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function CybercabPromoSection() {
  const { user } = useAuth();
  const nav = useNavigate();

  return (
    <section className="py-20 bg-gradient-to-br from-[#0a1530] via-[#1a1030] to-[#0a1530] text-white">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 text-center">
        <p className="label-mono text-[#e0b84c] mb-3">The future of mobility is moving</p>
        <h2 className="font-display text-3xl md:text-5xl font-light mb-4">Cybercab Investment</h2>
        <p className="text-white/60 max-w-xl mx-auto mb-8 text-[14px]">
          Get exposure to Tesla's purpose-built autonomous ride-hailing vehicle before it hits the road.
        </p>
        <Button
          size="lg"
          className="rounded-full bg-primary hover:bg-primary/90"
          onClick={() => nav(user ? "/dashboard/cybercab" : "/login", { state: { from: "/dashboard/cybercab" } })}
        >
          <Rocket className="w-4 h-4 mr-1.5" />
          Explore Cybercab <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </section>
  );
}
