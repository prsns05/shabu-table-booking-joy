import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Reservation = {
  id: string;
  floor: number;
  table_number: number;
  time_slot: string;
  nickname: string;
  device_id: string;
  created_at: string;
};

export function useReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("reservations")
      .select("*");
    if (!error && data) setReservations(data as Reservation[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("reservations-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservations" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setReservations((prev) => [...prev, payload.new as Reservation]);
          } else if (payload.eventType === "DELETE") {
            setReservations((prev) =>
              prev.filter((r) => r.id !== (payload.old as Reservation).id)
            );
          } else if (payload.eventType === "UPDATE") {
            setReservations((prev) =>
              prev.map((r) =>
                r.id === (payload.new as Reservation).id
                  ? (payload.new as Reservation)
                  : r
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return { reservations, loading, reload: load };
}
