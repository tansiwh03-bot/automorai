-- Run by the owner 2026-11-27. Fix: unqualified "name" inside the sites subquery meant sites.name, so every upload was refused.
begin;
drop policy if exists site_assets_insert_own on storage.objects;
drop policy if exists site_assets_select_own on storage.objects;
create policy site_assets_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'site-assets' and exists (
    select 1 from public.sites s where s.id::text = (storage.foldername(objects.name))[1] and s.owner_id = (select auth.uid())));
create policy site_assets_select_own on storage.objects for select to authenticated
  using (bucket_id = 'site-assets' and exists (
    select 1 from public.sites s where s.id::text = (storage.foldername(objects.name))[1] and s.owner_id = (select auth.uid())));
commit;
