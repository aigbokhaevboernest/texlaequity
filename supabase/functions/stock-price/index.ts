const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const res = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/TSLA?interval=1d&range=1d"
    );
    if (!res.ok) throw new Error("Failed to fetch quote");
    const json = await res.json();

    const result = json?.chart?.result?.[0];
    const meta = result?.meta;

    if (!meta) throw new Error("No data returned");

    const price = meta.regularMarketPrice;
    const previousClose = meta.previousClose ?? meta.chartPreviousClose;
    const change = price - previousClose;
    const changePercent = (change / previousClose) * 100;
    const marketOpen = meta.marketState === "REGULAR";

    return new Response(
      JSON.stringify({ price, change, changePercent, previousClose, marketOpen }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
