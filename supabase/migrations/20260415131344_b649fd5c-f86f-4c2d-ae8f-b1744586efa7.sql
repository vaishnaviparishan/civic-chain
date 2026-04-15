
-- Allow public verification lookups
CREATE POLICY "Public can verify certificates"
ON public.certificates
FOR SELECT
TO anon
USING (true);
