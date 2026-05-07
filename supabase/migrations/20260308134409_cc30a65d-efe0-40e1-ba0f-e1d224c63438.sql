
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a contact message (no auth required)
CREATE POLICY "Anyone can insert contact messages"
  ON public.contact_messages
  FOR INSERT
  WITH CHECK (true);

-- Only admins can view contact messages
CREATE POLICY "Admins can view contact messages"
  ON public.contact_messages
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update (mark as read)
CREATE POLICY "Admins can update contact messages"
  ON public.contact_messages
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete
CREATE POLICY "Admins can delete contact messages"
  ON public.contact_messages
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));
