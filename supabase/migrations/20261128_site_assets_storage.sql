-- Phase 2: image uploads for the Simple Editor. Run by the owner 2026-11-27 (do NOT run again). Policies were then replaced by 20261128b (name-column fix).
-- New bucket only; does not touch product-images or any other bucket.
-- Files live at  site-assets/<site_id>/<file>. Anyone can VIEW (the shop is public);
-- only the owner of that site can UPLOAD. No delete/overwrite in Phase 2. SVG not allowed (can carry scripts).
begin;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-assets', 'site-assets', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;

create policy site_assets_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'site-assets' and exists (
    select 1 from public.sites s where s.id::text = (storage.foldername(name))[1] and s.owner_id = (select auth.uid())));

create policy site_assets_select_own on storage.objects for select to authenticated
  using (bucket_id = 'site-assets' and exists (
    select 1 from public.sites s where s.id::text = (storage.foldername(name))[1] and s.owner_id = (select auth.uid())));
commit;

-- Rollback (only if no images were uploaded yet):
-- drop policy if exists site_assets_insert_own on storage.objects;
-- drop policy if exists site_assets_select_own on storage.objects;
-- delete from storage.buckets where id = 'site-assets';
