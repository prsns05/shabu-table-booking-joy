import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const FLOORS = [1, 2];
const TABLES_PER_FLOOR = 20;
const TIME_SLOTS = ["16:00", "18:00", "20:00"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const floorParam = url.searchParams.get("floor");
    const slotParam = url.searchParams.get("time_slot");

    const floors = floorParam ? [parseInt(floorParam)] : FLOORS;
    const slots = slotParam ? [slotParam] : TIME_SLOTS;

    if (floorParam && !FLOORS.includes(parseInt(floorParam))) {
      return new Response(JSON.stringify({ error: "Invalid floor (1 or 2)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (slotParam && !TIME_SLOTS.includes(slotParam)) {
      return new Response(JSON.stringify({ error: "Invalid time_slot (16:00, 18:00, 20:00)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let query = supabase.from("reservations").select("floor, table_number, time_slot");
    if (floorParam) query = query.eq("floor", parseInt(floorParam));
    if (slotParam) query = query.eq("time_slot", slotParam);

    const { data: booked, error } = await query;
    if (error) throw error;

    const bookedSet = new Set(
      (booked ?? []).map((r) => `${r.floor}-${r.table_number}-${r.time_slot}`)
    );

    const available: Array<{ floor: number; table_number: number; time_slot: string }> = [];
    for (const f of floors) {
      for (const s of slots) {
        for (let t = 1; t <= TABLES_PER_FLOOR; t++) {
          if (!bookedSet.has(`${f}-${t}-${s}`)) {
            available.push({ floor: f, table_number: t, time_slot: s });
          }
        }
      }
    }

    return new Response(JSON.stringify({ count: available.length, available }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
