import { supabase } from "@/integrations/supabase/client";

interface SendEmailParams {
  email: string;
  subject: string;
  message: string; // HTML string
  first_name?: string;
}

export async function sendEmail({ email, subject, message, first_name }: SendEmailParams) {
  const { data, error } = await supabase.functions.invoke("send-email", {
    body: { email, subject, message, first_name },
  });

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}
