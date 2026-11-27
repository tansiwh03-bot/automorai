-- Applied by the owner in the Supabase SQL editor on 2026-11-27 (already run — do NOT run again).
-- Phase 1: users may not delete builder pages until a recovery path exists.
-- Rollback: grant delete on public.site_pages to authenticated;
revoke delete on public.site_pages from authenticated;
