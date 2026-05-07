
-- Vendors can view rider profiles (for rider assignment dropdown)
CREATE POLICY "Vendors can view rider profiles" ON public.profiles
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = profiles.user_id AND role = 'rider')
    AND public.has_role(auth.uid(), 'vendor')
  );

-- Vendors can view rider roles
CREATE POLICY "Vendors can view rider roles" ON public.user_roles
  FOR SELECT TO authenticated USING (
    role = 'rider' AND public.has_role(auth.uid(), 'vendor')
  );
