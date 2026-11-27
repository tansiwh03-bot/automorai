-- Automorai Site Builder — Phase 1 (foundation)
-- Additive only: creates 3 NEW tables + 1 NEW function. Does not touch products, orders, businesses or auth.
-- Safe to run more than once? No — run once. Rollback: 20261125_site_builder_phase1_rollback.sql
begin;

-- 1) One row per website in the new builder
create table public.sites (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references auth.users(id) on delete cascade,
  legacy_slug    text unique,                       -- business_slug of the existing site (Automorai-Websites sheet)
  name           text not null check (char_length(name) between 1 and 120),
  theme          jsonb not null default '{}'::jsonb check (pg_column_size(theme) < 65536),
  schema_version integer not null default 1,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index sites_owner_idx on public.sites (owner_id);

-- 2) Pages of a site; the editor only ever writes draft_json
create table public.site_pages (
  id             uuid primary key default gen_random_uuid(),
  site_id        uuid not null references public.sites(id) on delete cascade,
  slug           text not null check (slug ~ '^[a-z0-9-]{1,60}$'),      -- 'home', 'about', ...
  title          text not null default '' check (char_length(title) <= 120),
  position       integer not null default 0,
  draft_json     jsonb not null default '{"sections":[]}'::jsonb check (pg_column_size(draft_json) < 1048576),
  published_json jsonb check (published_json is null or pg_column_size(published_json) < 1048576),
  published_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (site_id, slug)
);
create index site_pages_site_idx on public.site_pages (site_id);

-- 3) Published snapshots (for rollback in a later phase)
create table public.site_versions (
  id         uuid primary key default gen_random_uuid(),
  site_id    uuid not null references public.sites(id) on delete cascade,
  version    integer not null,
  snapshot   jsonb not null check (pg_column_size(snapshot) < 5242880),
  note       text check (note is null or char_length(note) <= 200),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (site_id, version)
);

-- updated_at helper (own name, so it cannot clash with an existing function)
create function public.builder_touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end; $$;
create trigger sites_touch      before update on public.sites      for each row execute function public.builder_touch_updated_at();
create trigger site_pages_touch before update on public.site_pages for each row execute function public.builder_touch_updated_at();

-- ── Security ─────────────────────────────────────────────────────────────
alter table public.sites         enable row level security;
alter table public.site_pages    enable row level security;
alter table public.site_versions enable row level security;

-- Nobody without a login gets anything
revoke all on public.sites, public.site_pages, public.site_versions from anon;

-- sites: owner may READ own sites and change only name/theme.
-- Creating/deleting a site and owner_id/legacy_slug are server-only (n8n, after Verify Website Owner).
revoke all on public.sites from authenticated;
grant select on public.sites to authenticated;
grant update (name, theme) on public.sites to authenticated;
create policy sites_select_own on public.sites for select to authenticated
  using (owner_id = (select auth.uid()));
create policy sites_update_own on public.sites for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

-- site_pages: owner may manage DRAFT pages of own sites; published_json/published_at are server-only.
revoke all on public.site_pages from authenticated;
grant select, delete on public.site_pages to authenticated;
grant insert (site_id, slug, title, position, draft_json) on public.site_pages to authenticated;
grant update (slug, title, position, draft_json) on public.site_pages to authenticated;
create policy pages_select_own on public.site_pages for select to authenticated
  using (exists (select 1 from public.sites s where s.id = site_id and s.owner_id = (select auth.uid())));
create policy pages_insert_own on public.site_pages for insert to authenticated
  with check (exists (select 1 from public.sites s where s.id = site_id and s.owner_id = (select auth.uid())));
create policy pages_update_own on public.site_pages for update to authenticated
  using (exists (select 1 from public.sites s where s.id = site_id and s.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.sites s where s.id = site_id and s.owner_id = (select auth.uid())));
create policy pages_delete_own on public.site_pages for delete to authenticated
  using (exists (select 1 from public.sites s where s.id = site_id and s.owner_id = (select auth.uid())));

-- site_versions: owner may only READ; written by the server on publish (later phase)
revoke all on public.site_versions from authenticated;
grant select on public.site_versions to authenticated;
create policy versions_select_own on public.site_versions for select to authenticated
  using (exists (select 1 from public.sites s where s.id = site_id and s.owner_id = (select auth.uid())));

commit;
