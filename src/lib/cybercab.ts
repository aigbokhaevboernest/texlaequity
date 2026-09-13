export interface CybercabInvestOption {
  amount: number;
  label: string;
}

export const CYBERCAB_INVEST_OPTIONS: CybercabInvestOption[] = [
  { amount: 5000, label: "5,000" },
  { amount: 10000, label: "10,000" },
  { amount: 25000, label: "25,000" },
  { amount: 50000, label: "50,000" },
];

export interface CybercabHolding {
  unitsHeld: number;
  totalInvested: number;
  currentValue: number;
  portfolioChangePct: number;
}

export const EMPTY_HOLDING: CybercabHolding = {
  unitsHeld: 0,
  totalInvested: 0,
  currentValue: 0,
  portfolioChangePct: 0,
};

export const INFO_TABS = ["Documents", "Overview"] as const;
export type InfoTab = (typeof INFO_TABS)[number];

export const OVERVIEW_TEXT =
  "Cybercab is Tesla's purpose-built autonomous ride-hailing vehicle, designed without a steering wheel or pedals for fully autonomous operation. This is a speculative, high-risk investment tied to an unreleased product. Values can rise or fall, and past performance never guarantees future results. Not officially affiliated with Tesla, Inc.";
