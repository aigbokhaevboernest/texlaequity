/**
 * Shared application types.
 *
 * Re-exports key DB row types from the auto-generated Supabase types so
 * feature code can `import type { Profile, Transaction } from "@/types"`
 * without depending directly on the generated file.
 */
import type { Database } from "@/integrations/supabase/types";

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Profile = Tables<"profiles">;
export type Transaction = Tables<"transactions">;
export type KycSubmission = Tables<"kyc_submissions">;
export type TeslaCar = Tables<"tesla_cars">;
export type TeslaOrder = Tables<"tesla_orders">;
export type TradingPlan = Tables<"trading_plans">;
export type PlanSubscription = Tables<"plan_subscriptions">;
export type ExpertTrader = Tables<"expert_traders">;
export type CopySubscription = Tables<"copy_subscriptions">;
export type UserRole = Tables<"user_roles">;

export type AppRole = Database["public"]["Enums"]["app_role"];

export type TxStatus = "pending" | "completed" | "failed" | "rejected";
export type TxType = "deposit" | "withdrawal";
export type KycStatus = "pending" | "approved" | "rejected";
