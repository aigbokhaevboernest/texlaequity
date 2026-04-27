-- Admin management for tesla_cars
CREATE POLICY "Admins insert cars" ON public.tesla_cars
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update cars" ON public.tesla_cars
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete cars" ON public.tesla_cars
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Public bucket for car images
INSERT INTO storage.buckets (id, name, public) VALUES ('car-images', 'car-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Car images public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'car-images');
CREATE POLICY "Admins upload car images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'car-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update car images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'car-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete car images" ON storage.objects
  FOR DELETE USING (bucket_id = 'car-images' AND public.has_role(auth.uid(), 'admin'));

-- Withdrawal authorization code
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS auth_code text,
  ADD COLUMN IF NOT EXISTS auth_code_verified boolean NOT NULL DEFAULT false;