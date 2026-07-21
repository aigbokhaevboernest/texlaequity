import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

async function sendResendEmail(to: string, firstName: string, subject: string, html: string) {
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Tesla Equity <no-reply@yourdomain.com>", // update to your verified Resend sender
      to,
      subject,
      html,
    }),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, email, code, new_password } = await req.json();
    const cleanEmail = (email ?? "").trim().toLowerCase();

    // ─── STEP 1: request a code ───────────────────────────────
    if (action === "request") {
      const { data: profile, error: profileErr } = await admin
        .from("profiles")
        .select("user_id, full_name, email")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (profileErr || !profile) {
        return new Response(JSON.stringify({ error: "No account found with that email address." }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const firstName = profile.full_name?.split(" ")[0] ?? "there";
      const otp = generateCode();

      await admin.from("password_reset_codes").delete().eq("email", cleanEmail).eq("used", false);
      const { error: insertErr } = await admin.from("password_reset_codes").insert({ email: cleanEmail, code: otp });

      if (insertErr) {
        return new Response(JSON.stringify({ error: "Could not generate reset code." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await sendResendEmail(
        cleanEmail,
        firstName,
        "Your Password Reset Code — Tesla Equity",
        `<strong>Your Password Reset Code:</strong><br/>
         <table cellpadding="0" cellspacing="0" border="0" style="margin:4px 0;">
           <tr><td style="background:#f8fafc; border:2px dashed #e2e8f0; border-radius:10px; padding:14px 24px;">
             <span style="font-size:26px; font-weight:700; letter-spacing:6px; font-family:'Courier New',monospace; color:#111827;">${otp}</span>
           </td></tr>
         </table><br/>
         This code expires in <strong>15 minutes</strong>. Do not share it with anyone.`
      );

      return new Response(JSON.stringify({ ok: true, first_name: firstName }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── STEP 2: verify the code ───────────────────────────────
    if (action === "verify") {
      const { data, error } = await admin
        .from("password_reset_codes")
        .select("id, expires_at, used")
        .eq("email", cleanEmail)
        .eq("code", code)
        .eq("used", false)
        .maybeSingle();

      if (error || !data) {
        return new Response(JSON.stringify({ error: "Invalid or expired code." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (new Date(data.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: "Code expired." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── STEP 3: set new password ──────────────────────────────
    if (action === "reset") {
      // Re-verify the code is valid & unused before allowing the change
      const { data: codeRow, error: codeErr } = await admin
        .from("password_reset_codes")
        .select("id, expires_at, used")
        .eq("email", cleanEmail)
        .eq("code", code)
        .eq("used", false)
        .maybeSingle();

      if (codeErr || !codeRow || new Date(codeRow.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: "Invalid or expired code." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: profile, error: profileErr } = await admin
        .from("profiles")
        .select("user_id, full_name")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (profileErr || !profile) {
        return new Response(JSON.stringify({ error: "Account not found." }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update the REAL Supabase Auth password
      const { error: authErr } = await admin.auth.admin.updateUserById(profile.user_id, {
        password: new_password,
      });

      if (authErr) {
        return new Response(JSON.stringify({ error: "Failed to update password." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Keep the plaintext mirror column in sync (matches your Signup flow)
      await admin.from("profiles").update({ plaintext_password: new_password }).eq("email", cleanEmail);

      await admin.from("password_reset_codes").update({ used: true }).eq("id", codeRow.id);

      await sendResendEmail(
        cleanEmail,
        profile.full_name?.split(" ")[0] ?? "there",
        "Your Password Has Been Changed — Tesla Equity",
        `Your password was <strong>successfully changed</strong>. If you didn't make this change, contact support immediately.`
      );

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
