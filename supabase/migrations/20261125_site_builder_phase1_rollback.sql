-- Rollback for 20261125_site_builder_phase1.sql — removes ONLY what that migration created.
begin;
drop table if exists public.site_versions;
drop table if exists public.site_pages;
drop table if exists public.sites;
drop function if exists public.builder_touch_updated_at();
commit;
