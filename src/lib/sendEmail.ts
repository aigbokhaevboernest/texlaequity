import { supabase } from "@/integrations/supabase/client";

export interface SendEmailParams {
  email: string | string[];
  first_name?: string;
  subject: string;
  message?: string; // HTML string
  html?: string; // alias for message, for parity with the other project's callers
}

export interface SendEmailResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  try {
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: {
        to: params.email,
        first_name: params.first_name || "",
        subject: params.subject,
        message: params.message || params.html || "",
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // The edge function returns the raw Resend API response on success —
    // wrap it rather than casting it directly to SendEmailResult.
    return { success: true, data };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
