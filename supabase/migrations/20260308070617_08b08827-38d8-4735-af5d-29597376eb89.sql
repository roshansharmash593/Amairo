
-- Admin can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all user_roles
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin can manage all orders (assign riders, etc)
CREATE POLICY "Admins can update all orders" ON public.orders
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all stock updates
CREATE POLICY "Admins can view all stock" ON public.stock_updates
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all order items
CREATE POLICY "Admins can view all order items" ON public.order_items
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
