import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FLOORS = [1, 2];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const nickname = String(body.nickname ?? "").trim();
    const floor = Number(body.floor);
    const table_number = Number(body.table_number);

    if (!nickname) return jsonErr("nickname is required", 400);
    if (!FLOORS.includes(floor)) return jsonErr("floor must be 1 or 2", 400);
    if (!Number.isInteger(table_number) || table_number < 1 || table_number > 20) {
      return jsonErr("table_number must be 1-20", 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: existing, error: fetchErr } = await supabase
      .from("reservations")
      .select("id, nickname")
      .eq("floor", floor)
      .eq("table_number", table_number)
      .maybeSingle();

    if (fetchErr) throw fetchErr;

    if (!existing) {
      return new Response(
        JSON.stringify({ success: false, message: "ไม่พบการจองของโต๊ะนี้" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (existing.nickname !== nickname) {
      return new Response(
        JSON.stringify({ success: false, message: "ชื่อเล่นไม่ตรงกับเจ้าของการจอง คืนไม่ได้" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: delErr } = await supabase
      .from("reservations")
      .delete()
      .eq("id", existing.id);
    if (delErr) throw delErr;

    return new Response(
      JSON.stringify({ success: true, message: "คืนโต๊ะสำเร็จ" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return jsonErr((e as Error).message, 500);
  }
});

function jsonErr(message: string, status: number) {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
