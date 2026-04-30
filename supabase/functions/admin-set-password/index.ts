// Edge function: admin-set-password
// Admin-only endpoint to update a user's auth password (and store the plaintext copy).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Missing auth header" }, 401);
    }
    const callerClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await callerClient.auth.getUser();
    if (!userData.user) return json({ error: "Not authenticated" }, 401);

    const { data: roleRow } = await callerClient
      .from("user_roles").select("role")
      .eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return json({ error: "Forbidden" }, 403);

    const { user_id, password } = await req.json();
    if (!user_id || typeof user_id !== "string") return json({ error: "user_id required" }, 400);
    if (!password || typeof password !== "string" || password.length < 6) return json({ error: "password must be at least 6 chars" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { error: updErr } = await admin.auth.admin.updateUserById(user_id, { password });
    if (updErr) return json({ error: updErr.message }, 500);
    await admin.from("profiles").update({ plaintext_password: password }).eq("user_id", user_id);

    return json({ ok: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
