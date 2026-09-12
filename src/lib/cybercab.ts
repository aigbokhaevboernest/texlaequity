export type CybercabPlanId = "starter" | "growth" | "advanced" | "premium";

export interface CybercabPlan {
  id: CybercabPlanId;
  name: string;
  minAmount: number;
  description: string;
}

export const CYBERCAB_PLANS: CybercabPlan[] = [
  { id: "starter", name: "Starter", minAmount: 100, description: "Begin your Cybercab investment journey." },
  { id: "growth", name: "Growth", minAmount: 500, description: "Scale your position as the fleet expands." },
  { id: "advanced", name: "Advanced", minAmount: 2500, description: "For investors ready to go further." },
  { id: "premium", name: "Premium", minAmount: 10000, description: "Maximum exposure to the Cybercab rollout." },
];

export const CHART_RANGES = ["1D", "1W", "1M", "3M", "6M", "1Y", "ALL"] as const;
export type ChartRange = (typeof CHART_RANGES)[number];

export interface CybercabHolding {
  unitsHeld: number;
  totalInvested: number;
  currentValue: number;
  portfolioChangePct: number;
}

// No fabricated data — always starts empty until a real backend exists.
export const EMPTY_HOLDING: CybercabHolding = {
  unitsHeld: 0,
  totalInvested: 0,
  currentValue: 0,
  portfolioChangePct: 0,
};

export const INFO_TABS = ["Overview", "Technology", "Market", "Risks", "Fees", "Documents"] as const;
export type InfoTab = (typeof INFO_TABS)[number];

export const INFO_CONTENT: Record<InfoTab, string> = {
  Overview: "Cybercab is Tesla's purpose-built autonomous ride-hailing vehicle, designed without a steering wheel or pedals, intended for fully autonomous operation within Tesla's robotaxi network.",
  Technology: "Cybercab is built on Tesla's Full Self-Driving stack and a dedicated unboxed manufacturing process aimed at dramatically lower production costs per vehicle.",
  Market: "The autonomous ride-hailing market is projected to grow substantially as regulatory approval and self-driving technology mature across major cities.",
  Risks: "This is a speculative, high-risk investment tied to an unreleased product. Regulatory approval, production timelines, and technology performance are not guaranteed. Values can rise or fall, and past performance never guarantees future results.",
  Fees: "Standard platform transaction fees apply to deposits and withdrawals, consistent with other investment products on this platform.",
  Documents: "Offering documents and disclosures will be made available here as they are published.",
};

export const parsePlanAmount = (id: CybercabPlanId): number =>
  CYBERCAB_PLANS.find((p) => p.id === id)?.minAmount ?? 0;
