import { supabase } from "@/lib/supabase";

const FUNCTION_URL = "https://vvohhdltxfengpcpbxyh.supabase.co/functions/v1/send-email";

export type EmailType =
  | "welcome"
  | "deposit_submitted"
  | "withdrawal_submitted"
  | "plan_selected"
  | "kyc_submitted"
  | "password_reset"
  | "copy_expert"
  | "connect_wallet"
  | "tesla_stock_order";

interface SendEmailArgs {
  to: string;
  type: EmailType;
  payload: Record<string, any>;
}

interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token ?? ""}`,
      },
      body: JSON.stringify(args),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[sendEmail] error:", data);
      return { success: false, error: data?.error || `HTTP ${res.status}` };
    }

    return { success: true, id: data.id };
  } catch (err: any) {
    console.error("[sendEmail] exception:", err);
    return { success: false, error: err?.message ?? "Network error" };
  }
}

// ─── Typed helpers ────────────────────────────────────────────────────────────

export const EmailService = {

  // Sent on signup
  welcome: (to: string, p: {
    full_name: string;
    email: string;
  }) => sendEmail({ to, type: "welcome", payload: p }),

  // Sent when user submits a deposit request
  depositSubmitted: (to: string, p: {
    full_name: string;
    amount: number;
    method: string;
    currency?: string;
  }) => sendEmail({ to, type: "deposit_submitted", payload: p }),

  // Sent when user submits a withdrawal request
  withdrawalSubmitted: (to: string, p: {
    full_name: string;
    amount: number;
    method: string;
    currency?: string;
  }) => sendEmail({ to, type: "withdrawal_submitted", payload: p }),

  // Sent when user confirms a trading plan
  planSelected: (to: string, p: {
    full_name: string;
    plan_name: string;
    price: number;
    roi_percent: number;
    duration_days: number;
    currency?: string;
  }) => sendEmail({ to, type: "plan_selected", payload: p }),

  // Sent when user submits KYC documents
  kycSubmitted: (to: string, p: {
    full_name: string;
  }) => sendEmail({ to, type: "kyc_submitted", payload: p }),

  // Sent when user requests password reset
  passwordReset: (to: string, p: {
    full_name: string;
    code: string;
  }) => sendEmail({ to, type: "password_reset", payload: p }),

  // Sent when user starts copying an expert trader
  copyExpert: (to: string, p: {
    full_name: string;
    expert_name: string;
    expert_handle?: string;
    min_copy_amount: number;
    currency?: string;
  }) => sendEmail({ to, type: "copy_expert", payload: p }),

  // Sent when user connects a crypto wallet
  connectWallet: (to: string, p: {
    full_name: string;
    wallet_address: string;
    currency?: string;
  }) => sendEmail({ to, type: "connect_wallet", payload: p }),

  // Sent when user confirms a Tesla stock purchase order
  teslaStockOrder: (to: string, p: {
    full_name: string;
    shares: number;
    price_per_share: number;
    total_usd: number;
    currency?: string;
    local_total?: number;
  }) => sendEmail({ to, type: "tesla_stock_order", payload: p }),
};
