
DROP POLICY IF EXISTS "Only owner device can delete" ON public.reservations;
-- No DELETE policy = no one can delete via client. Only service role (edge function) can delete.
