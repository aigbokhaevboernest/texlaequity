import modelS from "@/assets/car-model-s.png";
import model3 from "@/assets/car-model-3.png";
import modelX from "@/assets/car-model-x.png";
import modelY from "@/assets/car-model-y.png";
import cybertruck from "@/assets/car-cybertruck.png";
import semi from "@/assets/car-semi.png";
import roadster from "@/assets/roadster.png";

export interface Car {
  id: string;
  model: string;
  tagline: string;
  price_usd: number;
  range_mi: number;
  top_speed: number;
  zero_to_sixty: number;
  image: string;
}

export const cars: Car[] = [
  {
    id: "model-s",
    model: "Model S",
    tagline: "Ludicrous speed, effortless luxury.",
    price_usd: 89990,
    range_mi: 405,
    top_speed: 155,
    zero_to_sixty: 1.99,
    image: modelS,
  },
  {
    id: "model-3",
    model: "Model 3",
    tagline: "The compact EV built for everyday.",
    price_usd: 42990,
    range_mi: 341,
    top_speed: 145,
    zero_to_sixty: 4.2,
    image: model3,
  },
  {
    id: "model-x",
    model: "Model X",
    tagline: "Space, speed, and falcon-wing doors.",
    price_usd: 94990,
    range_mi: 348,
    top_speed: 155,
    zero_to_sixty: 2.5,
    image: modelX,
  },
  {
    id: "model-y",
    model: "Model Y",
    tagline: "Tesla's best-selling crossover.",
    price_usd: 44990,
    range_mi: 320,
    top_speed: 135,
    zero_to_sixty: 4.8,
    image: modelY,
  },
  {
    id: "cybertruck",
    model: "Cybertruck",
    tagline: "Stainless steel exoskeleton, built to last.",
    price_usd: 79990,
    range_mi: 320,
    top_speed: 130,
    zero_to_sixty: 2.6,
    image: cybertruck,
  },
  {
    id: "semi",
    model: "Tesla Semi",
    tagline: "Heavy-duty hauling, zero emissions.",
    price_usd: 150000,
    range_mi: 500,
    top_speed: 65,
    zero_to_sixty: 20,
    image: semi,
  },
  {
    id: "roadster",
    model: "Roadster",
    tagline: "0-60 in under a second. Next-gen supercar.",
    price_usd: 200000,
    range_mi: 620,
    top_speed: 250,
    zero_to_sixty: 1.9,
    image: roadster,
  },
];

// Legacy lookup map kept for compatibility with any component still using it directly.
export const carImages: Record<string, string> = Object.fromEntries(
  cars.map((c) => [c.model, c.image])
);

export const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

// Approx BTC equivalent for display only
export const toBTC = (usd: number) => (usd / 67000).toFixed(3);
