// Legacy converter: turns an existing Automorai shop (the HTML baked into its Cloudflare Worker + its live
// Website Settings) into the new builder format, so the imported shop looks exactly like the current one.
//
// What the old shop shows comes from two places, and we read both the same way the shop itself does:
//   1. baked into the HTML when the site was built: accent color, notice bar, business name, default slides,
//      category list (EN + BN), WhatsApp number, logo emoji;
//   2. loaded live from Website Settings: slides, logo image, footer text, menu, testimonial/about blocks.
//      The shop only overrides a baked value when the setting is non-empty — we do the same.
// Products are not copied: the product grid reads the live product list (same as the shop).

import { LEGACY_I18N } from './legacyStrings';
import { SCHEMA_VERSION, newId, safeUrl, type NavItem, type PageDoc, type Section, type SiteTheme, type Txt } from './schema';

export interface LegacySettings {
  [k: string]: unknown;
  slide1_img?: string; slide1_tag?: string; slide1_title?: string; slide1_desc?: string;
  footer_desc?: string; logo_img?: string; nav_menu?: unknown; custom_blocks?: unknown;
}

export interface ConvertResult { name: string; theme: SiteTheme; page: PageDoc; warnings: string[] }

const clean = (s: unknown) => String(s ?? '').trim();
const parseList = (v: unknown): unknown[] => {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string' && v.trim().startsWith('[')) { try { const j = JSON.parse(v); return Array.isArray(j) ? j : []; } catch { return []; } }
  return [];
};
const jsArray = (html: string, name: string): string[] => {
  const m = html.match(new RegExp(`const ${name}=(\\[[^\\n]*?\\]);`));
  if (!m) return [];
  try { const a = JSON.parse(m[1]); return Array.isArray(a) ? a.map(String) : []; } catch { return []; }
};

// The shop's own fixed texts (its I18N table). Older shops have older wording — we keep theirs, not today's template.
function pageI18n(html: string): Record<string, { en: string; bn: string }> {
  const start = html.indexOf('const I18N={');
  if (start < 0) return {};
  const end = html.indexOf('\n};', start);
  const body = html.slice(start, end > start ? end : start + 60000);
  const block = (lang: string): Record<string, string> => {
    const i = body.indexOf(`\n  ${lang}:{`);
    if (i < 0) return {};
    const out: Record<string, string> = {};
    const next = lang === 'en' ? body.indexOf('\n  bn:{', i + 1) : -1;   // the en block ends where bn starts
    const seg = next > i ? body.slice(i, next) : body.slice(i);
    const re = /([A-Za-z0-9_]+):'((?:\\.|[^'\\])*)'/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(seg))) out[m[1]] = m[2].replace(/\\'/g, "'").replace(/\\\\/g, '\\');
    return out;
  };
  const en = block('en'), bn = block('bn');
  const res: Record<string, { en: string; bn: string }> = {};
  for (const k of Object.keys(en)) res[k] = { en: en[k], bn: bn[k] ?? en[k] };
  return res;
}

export function convertLegacy(html: string, settingsIn: LegacySettings | null | undefined,
  opts: { slug: string; source: 'live' | 'draft' }): ConvertResult {
  const warnings: string[] = [];
  const s: LegacySettings = settingsIn || {};
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const own = pageI18n(html);
  if (!Object.keys(own).length) warnings.push('shop texts table not found, template texts used');
  const L: Record<string, { en: string; bn: string }> = { ...LEGACY_I18N };
  for (const k of Object.keys(LEGACY_I18N)) if (own[k]) L[k] = own[k];
  const pick = (...keys: string[]) => Object.fromEntries(keys.map(k => [k, L[k]]));
  const q = (sel: string) => doc.querySelector(sel);
  const text = (sel: string) => clean(q(sel)?.textContent);
  const attr = (sel: string, a: string) => clean(q(sel)?.getAttribute(a));

  if (!q('#storefrontView') || !q('.header')) throw new Error('This does not look like an Automorai shop page.');

  // ── baked values ──
  const styleText = Array.from(doc.querySelectorAll('style')).map(x => x.textContent || '').join('\n');
  const accentM = styleText.match(/--accent:\s*(#[0-9a-fA-F]{6})\s*;/);
  const accent = accentM ? accentM[1].toLowerCase() : '#e91e8c';
  if (!accentM) warnings.push('accent color not found, default used');

  const name = text('#headerLogoText') || clean(doc.title) || 'My Shop';
  const notice = clean(q('.notice-bar')?.textContent);
  const logoIcon = text('#footerLogoIcon');
  const waHref = Array.from(doc.querySelectorAll('a[href*="wa.me/"]')).map(a => a.getAttribute('href') || '')[0] || '';
  const whatsapp = (waHref.match(/wa\.me\/(\d+)/) || [])[1] || '';

  // categories: labels come from the page's own CATS_EN / CATS_BN lists
  const catsEn = jsArray(html, 'CATS_EN');
  const catsBn = jsArray(html, 'CATS_BN');
  const tiles = Array.from(doc.querySelectorAll('.cat-tile'));
  const catLabels = catsEn.length ? catsEn : tiles.map(t => clean(t.querySelector('.cat-tile-label')?.textContent));
  if (!catsEn.length) warnings.push('category lists not found in page script, used tile labels');
  const tileImg = (i: number) => {
    const st = tiles[i]?.querySelector('.cat-tile-img')?.getAttribute('style') || '';
    return safeUrl((st.match(/url\(['"]?([^'")]+)['"]?\)/) || [])[1] || '');
  };

  // ── header ──
  const navSetting = parseList(s.nav_menu).filter((it: any) => it && clean(it.label)) as any[];
  const nav: NavItem[] = navSetting.length
    ? navSetting.map(it => ({
        label: clean(it.label), link: clean(it.link) || '#',
        children: parseList(it.children).filter((k: any) => k && clean(k.label)).map((k: any) => ({ label: clean(k.label), link: clean(k.link) || '#' })),
      }))
    : Array.from(doc.querySelectorAll('#headerNav .nav-item > a.nav-link')).map(a => ({
        label: clean(a.textContent), link: clean(a.getAttribute('href')) || '#', children: [],
      }));
  const logoImg = safeUrl(clean(s.logo_img));

  const header: Section = {
    id: newId('header'), type: 'header',
    props: { businessName: name, logoImg, nav, productsMegaMenu: !navSetting.length, showSearch: true, showLangSwitch: true, showCart: true,
      labels: pick('searchPh') },
  };
  const noticeBar: Section = { id: newId('notice'), type: 'notice_bar', props: { text: notice } };

  // ── slides: baked, then overridden by non-empty settings ──
  const ctaKeys = ['heroCta1', 'heroCta2', 'heroCta3'];
  const slides = [0, 1, 2].map(i => {
    const n = i + 1;
    const val = (key: string, baked: string) => clean(s[`slide${n}_${key}`]) || baked;
    return {
      id: newId('slide'), type: 'slide',
      props: {
        img: safeUrl(val('img', attr(`#slideImg${i}`, 'src'))),
        tag: val('tag', text(`#slideTag${i}`)),
        title: val('title', text(`#slideTitle${i}`)),
        desc: val('desc', text(`#slideDesc${i}`)),
        cta: L[ctaKeys[i]] as Txt,
        ctaLink: '#products',
        trustLine: i === 0 ? (L.trustLine as Txt) : '',
      },
    };
  });

  // ── custom blocks (testimonial / about) — same rules as renderCustomBlocks() ──
  const blocks = parseList(s.custom_blocks).filter((b: any) => b && b.enabled !== false) as any[];
  const testi = blocks.filter(b => b.type === 'testimonial').map(b => ({ b, items: parseList(b.items).filter((it: any) => it && clean(it.text)) }))
    .filter(x => x.items.length).pop();                     // last one wins, like the shop (each render overwrites)
  const aboutBlocks = blocks.filter(b => b.type === 'about' && (clean(b.body) || clean(b.title)));
  const about = aboutBlocks.length ? aboutBlocks[aboutBlocks.length - 1] : null;

  const sections: Section[] = [
    { id: newId('hero'), type: 'hero_slider', props: { intervalMs: 4000 }, blocks: slides },
    {
      id: newId('cats'), type: 'categories', props: { title: L.catTitle },
      blocks: catLabels.map((label, idx) => ({
        id: newId('cat'), type: 'category',
        props: {
          label: catsBn[idx] ? { en: label, bn: catsBn[idx] } : label,
          match: [label, catsBn[idx] || ''].filter(Boolean),
          all: idx === 0,
          image: tileImg(idx),
          autoImage: true,                                   // replaced by the first matching product photo
        },
      })),
    },
    { id: newId('products'), type: 'product_grid', props: { anchor: 'products', eyebrow: L.prodEyebrow, heading: L.prodHeading, sub: L.prodSub, source: 'all',
      labels: pick('loadingText', 'noProducts', 'searchEmpty', 'orderBtn') } },
    {
      id: newId('why'), type: 'why_us', props: { anchor: 'about', eyebrow: L.whyEyebrow, heading: L.whyHeading },
      blocks: [1, 2, 3, 4].map(n => ({ id: newId('why'), type: 'why_card', props: { num: L[`whyNum${n}`], title: L[`why${n}Title`], desc: L[`why${n}Desc`] } })),
    },
  ];
  if (testi) {
    sections.push({
      id: newId('testi'), type: 'testimonials',
      props: { eyebrow: L.testiEyebrow, heading: clean(testi.b.title) || L.testiHeading },
      blocks: testi.items.map((it: any) => ({ id: newId('t'), type: 'testimonial', props: {
        text: clean(it.text), name: clean(it.name), rating: Math.max(1, Math.min(5, Number(it.rating) || 5)) } })),
    });
  }
  if (about) {
    sections.push({ id: newId('about'), type: 'about', props: {
      eyebrow: L.aboutEyebrow, title: clean(about.title), body: clean(about.body), img: safeUrl(clean(about.img)) } });
  }

  const footer: Section = {
    id: newId('footer'), type: 'footer',
    props: {
      businessName: name, logoIcon, logoImg,
      desc: clean(s.footer_desc) || text('#footerDescText'),
      whatsapp,
      showTrackOrder: !!q('.footer [data-i18n="trackOrderLink"]'),
      newsletter: { label: L.newsletterLabel, title: L.newsletterTitle, placeholder: L.newsletterPh, button: L.subscribeBtn },
      labels: pick('quickLinksTitle', 'allProductsLink', 'aboutUsLink', 'trackOrderLink', 'policiesTitle', 'deliveryPolicy',
        'returnPolicy', 'privacyPolicy', 'contactTitle', 'waMsgLink', 'paymentTitle', 'allRights'),
      year: (text('.footer-bottom').match(/©\s*(\d{4})/) || [])[1] || String(new Date().getFullYear()),
    },
  };
  const waFloatHref = attr('a.wa-float', 'href');
  const chat: Section = { id: newId('chat'), type: 'chat_bubble', props: {
    enabled: !!q('#sfChatBubble'), whatsappFloat: (waFloatHref.match(/wa\.me\/(\d+)/) || [])[1] || '',
    // older shops show an emoji on this button instead of the WhatsApp logo — keep whichever the shop has
    whatsappFloatIcon: q('a.wa-float svg') ? '' : Array.from(clean(q('a.wa-float')?.textContent)).slice(0, 4).join('') } };

  const theme: SiteTheme = {
    schema: SCHEMA_VERSION, accent, font: 'poppins-hind',
    globals: { before: [noticeBar, header], after: [footer, chat] },
    legacy: { slug: opts.slug, imported_at: new Date().toISOString(), source: opts.source },
  };
  return { name, theme, page: { schema: SCHEMA_VERSION, sections }, warnings };
}
