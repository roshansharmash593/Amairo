
-- Create shop-photos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('shop-photos', 'shop-photos', true);

-- Allow vendors to upload their own shop photos
CREATE POLICY "Vendors can upload shop photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shop-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow vendors to update their own shop photos
CREATE POLICY "Vendors can update shop photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'shop-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow vendors to delete their own shop photos
CREATE POLICY "Vendors can delete shop photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'shop-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access to shop photos
CREATE POLICY "Public can view shop photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'shop-photos');
