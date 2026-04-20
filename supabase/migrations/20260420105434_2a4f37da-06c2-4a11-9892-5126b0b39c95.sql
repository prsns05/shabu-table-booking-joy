
-- Reservations table for shabu restaurant
CREATE TABLE public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  floor INTEGER NOT NULL CHECK (floor IN (1, 2)),
  table_number INTEGER NOT NULL CHECK (table_number BETWEEN 1 AND 20),
  time_slot TEXT NOT NULL CHECK (time_slot IN ('16:00', '18:00', '20:00')),
  nickname TEXT NOT NULL CHECK (char_length(nickname) BETWEEN 1 AND 50),
  device_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (floor, table_number, time_slot)
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Anyone can view reservations
CREATE POLICY "Anyone can view reservations"
  ON public.reservations FOR SELECT
  USING (true);

-- Anyone can insert reservations (no auth required)
CREATE POLICY "Anyone can create reservations"
  ON public.reservations FOR INSERT
  WITH CHECK (char_length(nickname) BETWEEN 1 AND 50 AND char_length(device_id) > 0);

-- Only the device that created the reservation can delete it
CREATE POLICY "Only owner device can delete"
  ON public.reservations FOR DELETE
  USING (device_id = current_setting('request.headers', true)::json->>'x-device-id');

-- Enable realtime
ALTER TABLE public.reservations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;

CREATE INDEX idx_reservations_lookup ON public.reservations(floor, time_slot);
