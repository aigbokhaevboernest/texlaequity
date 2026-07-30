import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Minimum acceptable score. reCAPTCHA v3 returns 0.0 (very likely a bot) to
// 1.0 (very likely a human) instead of a challenge. 0.5 is Google's own
// suggested starting threshold — tighten (e.g. 0.7) if you still see bot
// signups, loosen (e.g. 0.3) if real users start getting blocked.
const MIN_SCORE = 0.5;
const EXPECTED_ACTION = "signup";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const RECAPTCHA_SECRET_KEY = Deno.env.get("RECAPTCHA_SECRET_KEY");
    if (!RECAPTCHA_SECRET_KEY) {
      return json({ error: "Server misconfigured: missing reCAPTCHA secret" }, 500);
    }

    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return json({ error: "Missing token" }, 400);
    }

    const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: RECAPTCHA_SECRET_KEY,
        response: token,
      }),
    });

    const result = await verifyRes.json();

    // result shape: { success, score, action, challenge_ts, hostname, "error-codes"? }
    if (!result.success) {
      return json({ success: false, error: "Verification failed", details: result["error-codes"] }, 200);
    }
    if (result.action !== EXPECTED_ACTION) {
      return json({ success: false, error: "Action mismatch" }, 200);
    }
    if (typeof result.score === "number" && result.score < MIN_SCORE) {
      return json({ success: false, error: "Low trust score", score: result.score }, 200);
    }

    return json({ success: true, score: result.score }, 200);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

function json(b: unknown, status: number) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
