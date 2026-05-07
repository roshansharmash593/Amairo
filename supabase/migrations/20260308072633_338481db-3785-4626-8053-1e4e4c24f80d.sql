-- Add location coordinates to orders (customer delivery location)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_lat double precision,
  ADD COLUMN IF NOT EXISTS customer_lng double precision;

-- Add location coordinates to profiles (vendor shop location)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;