/** Baseline hardcoded experts shown on the dashboard. Admin-added experts (from DB) are merged on top. */
export type StaticExpert = {
  id: string;
  name: string;
  handle: string;
  specialty: string;
  avatar_url: string | null;
  win_rate: number;
  total_profit_usd: number;
  followers: number;
  min_copy_amount: number;
  is_active: true;
  static?: true;
};

export const HARDCODED_EXPERTS: StaticExpert[] = [
  { id: "static-elon",    name: "Elon Musk",      handle: "@elonmusk",    specialty: "Crypto & Tech",   avatar_url: null, win_rate: 88, total_profit_usd: 4_200_000, followers: 412_000, min_copy_amount: 1500,  is_active: true, static: true },
  { id: "static-michael", name: "Michael Saylor", handle: "@saylor",      specialty: "Bitcoin Strategy",avatar_url: null, win_rate: 84, total_profit_usd: 3_100_000, followers: 356_000, min_copy_amount: 1500,  is_active: true, static: true },
  { id: "static-cathie",  name: "Cathie Wood",    handle: "@cathiedwood", specialty: "Disruptive Tech", avatar_url: null, win_rate: 81, total_profit_usd: 2_750_000, followers: 298_000, min_copy_amount: 1500,  is_active: true, static: true },
  { id: "static-cz",      name: "CZ Binance",     handle: "@cz_binance",  specialty: "Spot & Futures",  avatar_url: null, win_rate: 76, total_profit_usd: 2_100_000, followers: 245_000, min_copy_amount: 1500,  is_active: true, static: true },
  { id: "static-vitalik", name: "Vitalik Buterin",handle: "@vitalikb",    specialty: "Ethereum / DeFi", avatar_url: null, win_rate: 73, total_profit_usd: 1_950_000, followers: 188_000, min_copy_amount: 1500,  is_active: true, static: true },
];
