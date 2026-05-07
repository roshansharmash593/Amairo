
-- Products table
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'kg',
  photo_url text,
  photo_approved boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Daily stock updates
CREATE TABLE public.stock_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quantity numeric(10,2) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rider_id uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pending',
  total numeric(10,2) NOT NULL DEFAULT 0,
  delivery_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Order items
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  price numeric(10,2) NOT NULL DEFAULT 0
);

-- Updated_at triggers
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stock_updates_updated_at BEFORE UPDATE ON public.stock_updates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Vendors can manage own products" ON public.products
  FOR ALL TO authenticated USING (auth.uid() = vendor_id) WITH CHECK (auth.uid() = vendor_id);
CREATE POLICY "Everyone can view active products" ON public.products
  FOR SELECT TO authenticated USING (is_active = true);

-- Stock updates policies
CREATE POLICY "Vendors can manage own stock" ON public.stock_updates
  FOR ALL TO authenticated USING (auth.uid() = vendor_id) WITH CHECK (auth.uid() = vendor_id);

-- Orders policies
CREATE POLICY "Vendors can view own orders" ON public.orders
  FOR SELECT TO authenticated USING (auth.uid() = vendor_id);
CREATE POLICY "Vendors can update own orders" ON public.orders
  FOR UPDATE TO authenticated USING (auth.uid() = vendor_id);
CREATE POLICY "Customers can view own orders" ON public.orders
  FOR SELECT TO authenticated USING (auth.uid() = customer_id);
CREATE POLICY "Customers can create orders" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);

-- Order items policies
CREATE POLICY "Users can view order items for their orders" ON public.order_items
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.customer_id = auth.uid() OR orders.vendor_id = auth.uid()))
  );
CREATE POLICY "Customers can insert order items" ON public.order_items
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid())
  );

-- Admins can view all
CREATE POLICY "Admins can view all products" ON public.products
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update products" ON public.products
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for product photos
INSERT INTO storage.buckets (id, name, public) VALUES ('product-photos', 'product-photos', true);

-- Storage policies
CREATE POLICY "Vendors can upload product photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Vendors can update own photos" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'product-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Anyone can view product photos" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'product-photos');
CREATE POLICY "Admins can manage all product photos" ON storage.objects
  FOR ALL TO authenticated USING (bucket_id = 'product-photos' AND public.has_role(auth.uid(), 'admin'));

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
