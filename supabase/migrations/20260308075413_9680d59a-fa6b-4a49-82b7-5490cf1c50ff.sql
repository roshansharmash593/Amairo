
CREATE TABLE public.order_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  product_feedback text,
  delivery_feedback text,
  has_fault boolean DEFAULT false,
  fault_description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.order_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can insert own feedback" ON public.order_feedback
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can view own feedback" ON public.order_feedback
  FOR SELECT TO authenticated
  USING (auth.uid() = customer_id);

CREATE POLICY "Vendors can view feedback for their orders" ON public.order_feedback
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_feedback.order_id AND orders.vendor_id = auth.uid()
  ));

CREATE POLICY "Admins can view all feedback" ON public.order_feedback
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
