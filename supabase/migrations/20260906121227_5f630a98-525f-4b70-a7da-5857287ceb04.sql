create policy "Admins upload media" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
create policy "Admins update media" on storage.objects for update to authenticated using (bucket_id = 'media' and public.is_admin());
create policy "Admins delete media" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_admin());
create policy "Admins read media" on storage.objects for select to authenticated using (bucket_id = 'media' and public.is_admin());