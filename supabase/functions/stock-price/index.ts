const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=TSLA&token=${FINNHUB_API_KEY}`
    );
    if (!res.ok) throw new Error("Failed to fetch quote");
    const data = await res.json();

    // c = current, d = change, dp = percent change, pc = previous close
    const now = new Date();
    const nyHour = Number(
      new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hour12: false }).format(now)
    );
    const nyDay = now.getUTCDay(); // rough; good enough for a status pill
    const isWeekday = nyDay >= 1 && nyDay <= 5;
    const isMarketHours = nyHour >= 9 && nyHour < 16;
    const marketOpen = isWeekday && isMarketHours;

    return new Response(
      JSON.stringify({
        price: data.c,
        change: data.d,
        changePercent: data.dp,
        previousClose: data.pc,
        marketOpen,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
