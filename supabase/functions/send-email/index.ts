const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = "Tesla Equity <support@teslagrowthequity.com>";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, subject, message, first_name } = await req.json();

    if (!email || !subject || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields: email, subject, message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Debug: confirm the key is actually present at runtime (does NOT log the key itself).
    console.log("RESEND_API_KEY present:", !!RESEND_API_KEY, "length:", RESEND_API_KEY?.length ?? 0);

    const greeting = first_name ? `<p style="margin:0;">Hi ${first_name},</p>` : "";

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; color: #111827;">
        ${greeting}
        <div style="margin-top: 12px;">${message}</div>
        <p style="margin-top: 32px; font-size: 12px; color: #9ca3af;">— Tesla Equity</p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject,
        html,
      }),
    });

    const rawText = await res.text();
    console.log("Resend status:", res.status, "Resend body:", rawText);

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Resend failed (${res.status}): ${rawText}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let data: any = {};
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { raw: rawText };
    }

    // Return the FULL Resend response so the caller/invocation log shows exactly what happened.
    return new Response(JSON.stringify({ ok: true, resend: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
