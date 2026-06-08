
CREATE POLICY "Authenticated read clinic-assets" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'clinic-assets');
CREATE POLICY "Super admin upload clinic-assets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'clinic-assets' AND public.is_super_admin(auth.uid()));
CREATE POLICY "Super admin update clinic-assets" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'clinic-assets' AND public.is_super_admin(auth.uid()));
CREATE POLICY "Super admin delete clinic-assets" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'clinic-assets' AND public.is_super_admin(auth.uid()));
