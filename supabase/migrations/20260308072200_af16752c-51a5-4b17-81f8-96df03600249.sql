
-- Add approval and document fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS shop_name text,
  ADD COLUMN IF NOT EXISTS gst_number text,
  ADD COLUMN IF NOT EXISTS dl_number text,
  ADD COLUMN IF NOT EXISTS pan_number text,
  ADD COLUMN IF NOT EXISTS vehicle_details text,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Set existing vendor/rider profiles to approved (so they aren't blocked)
-- New vendor/rider signups will get 'pending' via the updated trigger

-- Update the handle_new_user trigger to set pending for vendor/rider
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _role app_role;
  _status text;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'customer');
  
  -- Vendors and riders need admin approval
  IF _role IN ('vendor', 'rider') THEN
    _status := 'pending';
  ELSE
    _status := 'approved';
  END IF;

  INSERT INTO public.profiles (user_id, full_name, phone, shop_name, gst_number, dl_number, pan_number, vehicle_details, approval_status)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'shop_name',
    NEW.raw_user_meta_data ->> 'gst_number',
    NEW.raw_user_meta_data ->> 'dl_number',
    NEW.raw_user_meta_data ->> 'pan_number',
    NEW.raw_user_meta_data ->> 'vehicle_details',
    _status
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);
  
  RETURN NEW;
END;
$$;
