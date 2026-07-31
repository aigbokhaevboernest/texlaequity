import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM = "Tesla Equity <noreply@teslagrowthequity.com>";
const SUPPORT_EMAIL = "support@teslagrowthequity.com";
const LOGO_URL = "https://vvohhdltxfengpcpbxyh.supabase.co/storage/v1/object/public/app-assets/tesla-wordmark.png";
const APP_URL = "https://www.teslagrowthequity.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function v(x: any): string {
  return x == null || x === "" ? "—" : String(x);
}

function fmt(amount: any, currency = "USD"): string {
  if (amount == null || amount === "") return "—";
  const n = Number(amount);
  if (isNaN(n)) return String(amount);
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

function fmtDate(x: any): string {
  if (!x) return "—";
  const d = new Date(x);
  if (isNaN(d.getTime())) return String(x);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// ─── Base Template ────────────────────────────────────────────────────────────

function base(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings>
<o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
  table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}
  img{-ms-interpolation-mode:bicubic;border:0;outline:none;text-decoration:none;}
  body{margin:0!important;padding:0!important;background:#f4f4f4;width:100%!important;}
  @media only screen and (max-width:640px){
    .ec{width:100%!important;}
    .mp{padding-left:20px!important;padding-right:20px!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;width:100%;">
<table width="100%" cellpadding="0" cellspacing="0" border="0"
  style="width:100%;background:#f4f4f4;padding:24px 0;">
  <tr><td align="center" valign="top">
    <table class="ec" cellpadding="0" cellspacing="0" border="0"
      style="width:100%;max-width:620px;background:#ffffff;border-radius:8px;
      overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.10);">

      <!-- HEADER -->
      <tr>
        <td style="background:#0A1428;padding:28px 40px;text-align:center;">
          <img src="${LOGO_URL}" alt="Tesla Equity" width="200"
            style="display:block;margin:0 auto;width:200px;max-width:200px;"/>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td class="mp" style="padding:36px 40px;background:#ffffff;">
          ${content}
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="background:#0A1428;padding:24px 40px;text-align:center;">
          <p style="margin:0 0 6px;color:#9CA3AF;font-size:13px;font-family:Arial,sans-serif;">
            Need help? We're here for you —
          </p>
          <a href="mailto:${SUPPORT_EMAIL}"
            style="color:#EF4444;font-size:13px;font-family:Arial,sans-serif;
            text-decoration:none;font-weight:600;">${SUPPORT_EMAIL}</a>
          <p style="margin:16px 0 0;color:#6B7280;font-size:11px;font-family:Arial,sans-serif;">
            © ${new Date().getFullYear()} Tesla Equity. All rights reserved.
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ─── UI Blocks ────────────────────────────────────────────────────────────────

function greeting(name: string): string {
  const first = (name || "").split(" ")[0] || "Valued Client";
  return `<p style="margin:0 0 20px;font-size:16px;font-family:Arial,sans-serif;color:#111827;">
    Hello <strong>${first}</strong>,
  </p>`;
}

function h1(text: string, color = "#111827"): string {
  return `<h1 style="margin:0 0 20px;font-size:24px;font-family:Arial,sans-serif;
    font-weight:800;color:${color};line-height:1.2;">${text}</h1>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;font-family:Arial,sans-serif;
    color:#374151;line-height:1.7;">${text}</p>`;
}

function infoRow(label: string, value: string, highlight = false): string {
  return `<tr>
    <td style="padding:10px 14px;font-size:14px;font-family:Arial,sans-serif;
      color:#6B7280;border-bottom:1px solid #F3F4F6;width:45%;">${label}</td>
    <td style="padding:10px 14px;font-size:14px;font-family:Arial,sans-serif;
      color:${highlight ? "#EF4444" : "#111827"};
      font-weight:${highlight ? "700" : "500"};
      border-bottom:1px solid #F3F4F6;">${value}</td>
  </tr>`;
}

function infoTable(...rows: string[]): string {
  return `<table cellpadding="0" cellspacing="0" border="0"
    style="width:100%;border-collapse:collapse;background:#F9FAFB;
    border-radius:6px;overflow:hidden;margin:20px 0;">
    ${rows.join("")}
  </table>`;
}

function alert(text: string, bg = "#FEF3C7", border = "#F59E0B", color = "#92400E"): string {
  return `<table cellpadding="0" cellspacing="0" border="0"
    style="width:100%;border-left:4px solid ${border};background:${bg};
    border-radius:4px;margin:20px 0;">
    <tr><td style="padding:14px 16px;font-size:14px;font-family:Arial,sans-serif;
      color:${color};line-height:1.6;">${text}</td></tr>
  </table>`;
}

function cta(label: string, url: string, color = "#EF4444"): string {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;">
    <tr>
      <td style="border-radius:6px;background:${color};">
        <a href="${url}" target="_blank"
          style="display:inline-block;padding:14px 32px;font-size:15px;
          font-family:Arial,sans-serif;font-weight:700;color:#ffffff;
          text-decoration:none;border-radius:6px;letter-spacing:0.5px;">${label}</a>
      </td>
    </tr>
  </table>`;
}

function codeBox(label: string, code: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:20px 0;">
    <tr><td align="center">
      <div style="display:inline-block;background:#0A1428;border:2px solid #EF4444;
        border-radius:8px;padding:20px 40px;text-align:center;">
        <p style="margin:0 0 6px;font-size:11px;font-family:'Courier New',monospace;
          color:#9CA3AF;letter-spacing:3px;text-transform:uppercase;">${label}</p>
        <p style="margin:0;font-size:32px;font-family:'Courier New',monospace;
          color:#EF4444;font-weight:700;letter-spacing:8px;">${code}</p>
      </div>
    </td></tr>
  </table>`;
}

// ─── Templates ────────────────────────────────────────────────────────────────

function welcome(d: { full_name: string; email: string }) {
  return {
    subject: "Welcome to Tesla Equity — Your Account Is Ready",
    html: base(`
      ${greeting(d.full_name)}
      ${h1("Welcome to Tesla Equity 🎉")}
      ${p("Your account has been successfully created. You now have access to expert copy-trading, investment plans, Tesla stock, and more.")}
      ${infoTable(
        infoRow("Name", v(d.full_name)),
        infoRow("Email", v(d.email)),
        infoRow("Account Status", "Active")
      )}
      ${p("To get started, complete your KYC verification and explore our investment plans.")}
      ${cta("Go to Dashboard", `${APP_URL}/dashboard`)}
    `),
  };
}

function depositSubmitted(d: { full_name: string; amount: any; method: string; currency?: string }) {
  return {
    subject: "Deposit Request Submitted — Tesla Equity",
    html: base(`
      ${greeting(d.full_name)}
      ${h1("Deposit Request Received")}
      ${p("Thank you! We have received your deposit request and it is now awaiting admin approval.")}
      ${infoTable(
        infoRow("Amount", fmt(d.amount, d.currency || "USD"), true),
        infoRow("Method", v(d.method)),
        infoRow("Status", "Awaiting Approval"),
        infoRow("Date", fmtDate(new Date()))
      )}
      ${alert("Once approved, the funds will be credited to your account balance automatically.")}
      ${cta("View Dashboard", `${APP_URL}/dashboard`)}
    `),
  };
}

function withdrawalSubmitted(d: { full_name: string; amount: any; method: string; currency?: string }) {
  return {
    subject: "Withdrawal Request Submitted — Tesla Equity",
    html: base(`
      ${greeting(d.full_name)}
      ${h1("Withdrawal Request Submitted")}
      ${p("We have received your withdrawal request. Our team will review and process it shortly.")}
      ${infoTable(
        infoRow("Amount Requested", fmt(d.amount, d.currency || "USD"), true),
        infoRow("Method", v(d.method)),
        infoRow("Status", "Pending Review"),
        infoRow("Submitted", fmtDate(new Date()))
      )}
      ${alert("You will receive an email notification once your withdrawal has been processed.")}
      ${cta("View Transactions", `${APP_URL}/dashboard/transactions`)}
    `),
  };
}

function planSelected(d: {
  full_name: string; plan_name: string; price: any;
  roi_percent: any; duration_days: any; currency?: string;
}) {
  return {
    subject: `Plan Selected: ${d.plan_name} — Tesla Equity`,
    html: base(`
      ${greeting(d.full_name)}
      ${h1("Investment Plan Selected 🚀")}
      ${p(`You have selected the <strong>${v(d.plan_name)}</strong> investment plan. Complete your deposit below to activate it.`)}
      ${infoTable(
        infoRow("Plan", v(d.plan_name), true),
        infoRow("Price", fmt(d.price, d.currency || "USD")),
        infoRow("ROI", `${v(d.roi_percent)}%`),
        infoRow("Duration", `${v(d.duration_days)} days`)
      )}
      ${alert(`To activate this plan, please complete your deposit of <strong>${fmt(d.price, d.currency || "USD")}</strong>. Your plan will be activated once payment is confirmed.`)}
      ${cta("Complete Deposit", `${APP_URL}/dashboard/deposit?amount=${d.price}`)}
    `),
  };
}

function kycSubmitted(d: { full_name: string }) {
  return {
    subject: "KYC Submitted — Under Review",
    html: base(`
      ${greeting(d.full_name)}
      ${h1("KYC Verification Submitted")}
      ${p("Thank you for submitting your identity documents. Our compliance team will review your KYC submission within 1–2 business days.")}
      ${infoTable(
        infoRow("Status", "Pending Review"),
        infoRow("Submitted", fmtDate(new Date()))
      )}
      ${alert("You will receive an email once your KYC has been reviewed. You can continue using the platform in the meantime.")}
      ${cta("View Dashboard", `${APP_URL}/dashboard`)}
    `),
  };
}

function passwordReset(d: { full_name: string; code: string }) {
  return {
    subject: "Password Reset Code — Tesla Equity",
    html: base(`
      ${greeting(d.full_name)}
      ${h1("Password Reset Request")}
      ${p("We received a request to reset your password. Use the code below to continue.")}
      ${codeBox("Reset Code", v(d.code))}
      ${alert("This code expires in <strong>15 minutes</strong>. If you did not request a password reset, please ignore this email and contact support immediately.")}
    `),
  };
}

function copyExpert(d: {
  full_name: string; expert_name: string;
  expert_handle?: string; min_copy_amount: any; currency?: string;
}) {
  return {
    subject: `You're Now Copying ${d.expert_name} — Tesla Equity`,
    html: base(`
      ${greeting(d.full_name)}
      ${h1("Expert Copy Started 📈")}
      ${p(`You have successfully started copying <strong>${v(d.expert_name)}</strong>. Your portfolio will now mirror their trades automatically.`)}
      ${infoTable(
        infoRow("Expert", v(d.expert_name)),
        infoRow("Handle", d.expert_handle ? `@${v(d.expert_handle)}` : "—"),
        infoRow("Min Copy Amount", fmt(d.min_copy_amount, d.currency || "USD")),
        infoRow("Started", fmtDate(new Date()))
      )}
      ${alert("Your copy trading is now active. You can manage or stop copying at any time from your dashboard.")}
      ${cta("View Copy Trading", `${APP_URL}/dashboard/copy-trading`)}
    `),
  };
}

function connectWallet(d: {
  full_name: string; wallet_address: string; currency?: string;
}) {
  return {
    subject: "Wallet Connected — Tesla Equity",
    html: base(`
      ${greeting(d.full_name)}
      ${h1("Wallet Connected ✓")}
      ${p("Your crypto wallet has been successfully connected to your Tesla Equity account.")}
      ${infoTable(
        infoRow("Wallet Address", v(d.wallet_address)),
        infoRow("Connected", fmtDate(new Date()))
      )}
      ${alert("<strong>Security notice:</strong> If you did not connect this wallet, please contact support immediately and change your password.", "#FEF2F2", "#EF4444", "#991B1B")}
      ${cta("Go to Dashboard", `${APP_URL}/dashboard`)}
    `),
  };
}

function teslaStockOrder(d: {
  full_name: string; shares: any; price_per_share: any;
  total_usd: any; currency?: string; local_total?: any;
}) {
  return {
    subject: "Tesla Stock Order Submitted — Tesla Equity",
    html: base(`
      ${greeting(d.full_name)}
      ${h1("Tesla Stock Order Placed 📊")}
      ${p("Your Tesla (TSLA) stock order has been submitted. Complete your deposit below to confirm the purchase.")}
      ${infoTable(
        infoRow("Shares", v(d.shares)),
        infoRow("Price Per Share", fmt(d.price_per_share, "USD")),
        infoRow("Total (USD)", fmt(d.total_usd, "USD"), true),
        d.local_total && d.currency && d.currency !== "USD"
          ? infoRow(`Total (${d.currency})`, fmt(d.local_total, d.currency))
          : "",
        infoRow("Status", "Awaiting Deposit"),
        infoRow("Order Date", fmtDate(new Date()))
      )}
      ${alert("Your order will be confirmed once your deposit is received and approved by our team.")}
      ${cta("Complete Deposit", `${APP_URL}/dashboard/deposit?amount=${d.total_usd}`)}
    `),
  };
}

// ─── Router ──────────────────────────────────────────────────────────────────

function buildEmail(type: string, payload: any) {
  switch (type) {
    case "welcome":               return welcome(payload);
    case "deposit_submitted":     return depositSubmitted(payload);
    case "withdrawal_submitted":  return withdrawalSubmitted(payload);
    case "plan_selected":         return planSelected(payload);
    case "kyc_submitted":         return kycSubmitted(payload);
    case "password_reset":        return passwordReset(payload);
    case "copy_expert":           return copyExpert(payload);
    case "connect_wallet":        return connectWallet(payload);
    case "tesla_stock_order":     return teslaStockOrder(payload);
    default: return null;
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { to, type, payload } = body;

    if (!to || !type || !payload) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, type, payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const email = buildEmail(type, payload);
    if (!email) {
      return new Response(
        JSON.stringify({ error: `Unknown email type: ${type}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: Array.isArray(to) ? to : [to],
        subject: email.subject,
        html: email.html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: data?.message || "Resend API error", details: data }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
