// Automorai Site Builder — data format (schema v1).
// One format for everything: the Simple editor, the Advanced editor, the preview and (later) the live shop
// all read and write exactly this shape. Site → pages → sections → blocks.
//
//   sites.theme          = SiteTheme   (colors, fonts, global header/footer — shared by every page)
//   site_pages.draft_json = PageDoc     (the sections of one page)

export const SCHEMA_VERSION = 1;

/** Text that follows the shop's EN/BN toggle, or plain text written by the owner (shown as-is in both). */
export type Txt = string | { en: string; bn: string };

export type Device = 'desktop' | 'tablet' | 'mobile';

/** Per-device style overrides. `base` applies everywhere; tablet/mobile override it. */
export interface Responsive<T> { base?: T; tablet?: Partial<T>; mobile?: Partial<T> }

export interface BoxStyle {
  paddingTop?: number;     // px
  paddingBottom?: number;  // px
  background?: string;     // CSS color
  textAlign?: 'left' | 'center' | 'right';
}

export interface Block<P = Record<string, unknown>> {
  id: string;
  type: string;
  props: P;
}

export interface Section<P = Record<string, unknown>> {
  id: string;
  type: SectionType;
  props: P;
  blocks?: Block[];
  style?: Responsive<BoxStyle>;
  hidden?: Partial<Record<Device, boolean>>;   // hide on a device
}

export type SectionType =
  | 'notice_bar' | 'header' | 'hero_slider' | 'categories' | 'product_grid'
  | 'why_us' | 'testimonials' | 'about' | 'footer' | 'chat_bubble';

export interface NavItem { label: Txt; link: string; children?: { label: Txt; link: string }[] }

export interface SiteTheme {
  schema: number;
  accent: string;                    // shop accent color (#rrggbb)
  font: 'poppins-hind';              // only the legacy font pair exists in v1
  globals: {                          // shown on every page, in this order: before[], page sections, after[]
    before: Section[];               // notice bar, header
    after: Section[];                // footer, chat bubble
  };
  legacy?: { slug: string; imported_at: string; source: 'live' | 'draft' };
}

export interface PageDoc {
  schema: number;
  sections: Section[];
}

/** Data the renderer needs that does not live in the design (it changes without editing the design). */
export interface RenderData {
  products: Product[];
  businessSlug: string;
}

export interface Product {
  product_id: string;
  title: string;
  price: number;
  original_price?: number;
  category?: string;
  images?: string[];
}

// ── helpers ──────────────────────────────────────────────────────────────────
export const txt = (t: Txt | undefined, lang: 'en' | 'bn'): string =>
  t == null ? '' : typeof t === 'string' ? t : (t[lang] ?? t.en ?? '');

let _n = 0;
export const newId = (prefix = 's'): string =>
  `${prefix}_${Date.now().toString(36)}${(++_n).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const SECTION_TYPES: SectionType[] = ['notice_bar', 'header', 'hero_slider', 'categories', 'product_grid',
  'why_us', 'testimonials', 'about', 'footer', 'chat_bubble'];

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Structural check used before saving and before rendering. Returns a list of problems (empty = valid). */
export function validatePage(doc: unknown): string[] {
  const errs: string[] = [];
  if (!isObj(doc)) return ['page is not an object'];
  if (doc.schema !== SCHEMA_VERSION) errs.push(`unsupported schema ${String(doc.schema)}`);
  if (!Array.isArray(doc.sections)) return [...errs, 'sections missing'];
  doc.sections.forEach((s, i) => errs.push(...validateSection(s, `sections[${i}]`)));
  return errs;
}

export function validateTheme(t: unknown): string[] {
  if (!isObj(t)) return ['theme is not an object'];
  const errs: string[] = [];
  if (typeof t.accent !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(t.accent)) errs.push('accent must be #rrggbb');
  if (!isObj(t.globals) || !Array.isArray(t.globals.before) || !Array.isArray(t.globals.after)) errs.push('globals missing');
  else {
    (t.globals.before as unknown[]).forEach((s, i) => errs.push(...validateSection(s, `globals.before[${i}]`)));
    (t.globals.after as unknown[]).forEach((s, i) => errs.push(...validateSection(s, `globals.after[${i}]`)));
  }
  return errs;
}

function validateSection(s: unknown, at: string): string[] {
  if (!isObj(s)) return [`${at} is not an object`];
  const errs: string[] = [];
  if (typeof s.id !== 'string' || !s.id) errs.push(`${at}.id missing`);
  if (!SECTION_TYPES.includes(s.type as SectionType)) errs.push(`${at}.type unknown: ${String(s.type)}`);
  if (!isObj(s.props)) errs.push(`${at}.props missing`);
  if (s.blocks !== undefined && !Array.isArray(s.blocks)) errs.push(`${at}.blocks must be a list`);
  return errs;
}

/** Only http(s) images/links are ever rendered; anything else (javascript:, data:) becomes empty. */
export const safeUrl = (u: unknown): string => {
  const s = String(u ?? '').trim();
  if (/^https?:\/\//i.test(s) || s.startsWith('#') || s.startsWith('/') || s.startsWith('?')) return s;
  return '';
};
