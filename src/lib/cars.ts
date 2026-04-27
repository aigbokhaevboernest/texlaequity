import modelS from "@/assets/car-model-s.png";
import model3 from "@/assets/car-model-3.png";
import modelX from "@/assets/car-model-x.png";
import cybertruck from "@/assets/car-cybertruck.png";
import semi from "@/assets/car-semi.png";

export const carImages: Record<string, string> = {
  "Model S": modelS,
  "Model 3": model3,
  "Model X": modelX,
  "Cybertruck": cybertruck,
  "Tesla Semi": semi,
};

export const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

// Approx BTC equivalent for display only
export const toBTC = (usd: number) => (usd / 67000).toFixed(3);