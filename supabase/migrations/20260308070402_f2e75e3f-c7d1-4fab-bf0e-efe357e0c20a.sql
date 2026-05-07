
-- Riders can update orders assigned to them
CREATE POLICY "Riders can update assigned orders" ON public.orders
  FOR UPDATE TO authenticated USING (auth.uid() = rider_id);

-- Riders can view their assigned orders
CREATE POLICY "Riders can view assigned orders" ON public.orders
  FOR SELECT TO authenticated USING (auth.uid() = rider_id);
