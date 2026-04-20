import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FLOORS = [1, 2];
const TIME_SLOTS = ["16:00", "18:00", "20:00"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const nickname = String(body.nickname ?? "").trim();
    const floor = Number(body.floor);
    const time_slot = String(body.time_slot ?? "");
    const table_number = Number(body.table_number);

    if (!nickname || nickname.length < 1 || nickname.length > 50) {
      return jsonErr("nickname is required (1-50 chars)", 400);
    }
    if (!FLOORS.includes(floor)) return jsonErr("floor must be 1 or 2", 400);
    if (!TIME_SLOTS.includes(time_slot)) return jsonErr("time_slot must be 16:00, 18:00 or 20:00", 400);
    if (!Number.isInteger(table_number) || table_number < 1 || table_number > 20) {
      return jsonErr("table_number must be 1-20", 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // device_id: use nickname-based id for API users (so they can release later by nickname)
    const device_id = `api:${nickname}`;

    const { data, error } = await supabase
      .from("reservations")
      .insert({ floor, table_number, time_slot, nickname, device_id })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return new Response(
          JSON.stringify({ success: false, message: "ช่องไม่ว่าง" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true, message: "จองสำเร็จ", reservation: data }),
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
