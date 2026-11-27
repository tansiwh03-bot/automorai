// Save / load for the builder. Reads and draft writes go straight to Supabase (RLS: only your own site).
// Creating the site row needs an ownership check against the shop list, so that goes through n8n.
import { supabase } from '@/lib/supabaseClient';
import { validatePage, validateTheme, type PageDoc, type SiteTheme } from './schema';

const IMPORT_API = 'https://n8n2.kingpurefood.com/webhook/automorai/site-builder/import-legacy';
const PRODUCTS_API = 'https://n8n2.kingpurefood.com/webhook/automorai/website-products';
const SETTINGS_API = 'https://n8n2.kingpurefood.com/webhook/automorai/website-settings';

export interface BuilderSite { id: string; name: string; theme: SiteTheme; legacy_slug: string | null; updated_at: string }
export interface BuilderPage { id: string; slug: string; title: string; draft_json: PageDoc; updated_at: string }

const authHeader = async (): Promise<Record<string, string>> => {
  const { data } = await supabase.auth.getSession();
  const t = data.session?.access_token;
  if (!t) throw new Error('Please log in again.');
  return { Authorization: `Bearer ${t}` };
};

/** The builder site made from this shop, with its home page (null if not imported yet). */
export async function loadSite(slug: string): Promise<{ site: BuilderSite; home: BuilderPage | null } | null> {
  const { data: site, error } = await supabase.from('sites')
    .select('id,name,theme,legacy_slug,updated_at').eq('legacy_slug', slug).maybeSingle();
  if (error) throw new Error(error.message);
  if (!site) return null;
  const { data: home, error: e2 } = await supabase.from('site_pages')
    .select('id,slug,title,draft_json,updated_at').eq('site_id', site.id).eq('slug', 'home').maybeSingle();
  if (e2) throw new Error(e2.message);
  return { site: site as BuilderSite, home: (home as BuilderPage) || null };
}

/** Step 1 (server): check you own the shop, create/refresh the builder site row, return the current shop HTML. */
export async function startImport(slug: string): Promise<{ site_id: string; status: string; legacy_html: string }> {
  const res = await fetch(IMPORT_API, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify({ business_slug: slug }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.success) throw new Error(j.error || `Import failed (${res.status})`);
  return j;
}

/** Step 2 (browser, RLS-protected): save the converted design as the draft. Nothing live changes. */
export async function saveImported(siteId: string, name: string, theme: SiteTheme, page: PageDoc): Promise<void> {
  const problems = [...validateTheme(theme), ...validatePage(page)];
  if (problems.length) throw new Error('Converted design is invalid: ' + problems.slice(0, 3).join('; '));
  const { error: e1 } = await supabase.from('sites').update({ name: name.slice(0, 120), theme }).eq('id', siteId);
  if (e1) throw new Error(e1.message);
  // No upsert: ON CONFLICT DO UPDATE would also set site_id, which users may not update (column grant, on purpose).
  const fields = { title: 'Home', position: 0, draft_json: page };
  const { data: existing, error: e2 } = await supabase.from('site_pages').select('id').eq('site_id', siteId).eq('slug', 'home').maybeSingle();
  if (e2) throw new Error(e2.message);
  const { error: e3 } = existing
    ? await supabase.from('site_pages').update(fields).eq('id', existing.id)
    : await supabase.from('site_pages').insert({ site_id: siteId, slug: 'home', ...fields });
  if (e3) throw new Error(e3.message);
}

export async function fetchSettings(slug: string): Promise<Record<string, unknown> | null> {
  const r = await fetch(`${SETTINGS_API}?business_slug=${encodeURIComponent(slug)}`);
  const j = await r.json().catch(() => ({}));
  return j && j.settings ? j.settings : null;
}

export async function fetchProducts(slug: string) {
  const r = await fetch(`${PRODUCTS_API}?business_slug=${encodeURIComponent(slug)}`);
  const j = await r.json().catch(() => ({}));
  return Array.isArray(j.products) ? j.products : [];
}

export class ConflictError extends Error {}

/**
 * Save the editor's draft (theme + home page). Each row is only written if nobody else changed it since we loaded it
 * (updated_at must still match) — otherwise ConflictError, so a second tab/device never silently overwrites work.
 * Returns the new updated_at values.
 */
export async function saveDraft(siteId: string, pageId: string, theme: SiteTheme, page: PageDoc,
  known: { site: string; page: string }): Promise<{ site: string; page: string }> {
  const problems = [...validateTheme(theme), ...validatePage(page)];
  if (problems.length) throw new Error('This design has a problem and was not saved: ' + problems.slice(0, 3).join('; '));
  if (JSON.stringify(page).length > 900_000 || JSON.stringify(theme).length > 60_000) throw new Error('This design is too large to save.');
  const out = { ...known };
  const { data: s, error: e1 } = await supabase.from('sites').update({ theme })
    .eq('id', siteId).eq('updated_at', known.site).select('updated_at');
  if (e1) throw new Error(e1.message);
  if (!s?.length) throw new ConflictError('changed elsewhere');
  out.site = s[0].updated_at;
  const { data: p, error: e2 } = await supabase.from('site_pages').update({ draft_json: page })
    .eq('id', pageId).eq('updated_at', known.page).select('updated_at');
  if (e2) throw new Error(e2.message);
  if (!p?.length) throw new ConflictError('changed elsewhere');
  out.page = p[0].updated_at;
  return out;
}

const IMG_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

/** Upload an image for this site (owner-only by storage policy). Returns its public URL. */
export async function uploadImage(siteId: string, file: File): Promise<string> {
  const ext = IMG_TYPES[file.type];
  if (!ext) throw new Error('Please choose a JPG, PNG, WEBP or GIF image.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Image is larger than 5 MB.');
  const path = `${siteId}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('site-assets').upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error('Upload failed: ' + error.message);
  return supabase.storage.from('site-assets').getPublicUrl(path).data.publicUrl;
}
