import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const FLOORS = [1, 2];
const TABLES_PER_FLOOR = 20;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const floorParam = url.searchParams.get("floor");

    if (floorParam && !FLOORS.includes(parseInt(floorParam))) {
      return new Response(JSON.stringify({ error: "Invalid floor (1 or 2)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const floors = floorParam ? [parseInt(floorParam)] : FLOORS;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let query = supabase.from("reservations").select("floor, table_number");
    if (floorParam) query = query.eq("floor", parseInt(floorParam));

    const { data: booked, error } = await query;
    if (error) throw error;

    const bookedSet = new Set(
      (booked ?? []).map((r) => `${r.floor}-${r.table_number}`)
    );

    const available: Array<{ floor: number; table_number: number }> = [];
    for (const f of floors) {
      for (let t = 1; t <= TABLES_PER_FLOOR; t++) {
        if (!bookedSet.has(`${f}-${t}`)) {
          available.push({ floor: f, table_number: t });
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
