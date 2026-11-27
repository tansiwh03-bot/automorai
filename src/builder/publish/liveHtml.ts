// Publish step 1 (runs in the Dashboard): turn the builder design into the static parts of the live shop page.
//
// The live shop keeps its existing page and ALL its shop code (product page, cart, checkout, chat, Pixel…). Only the
// visible design parts are swapped for the builder's version: notice bar + header + storefront sections, footer, and
// the floating buttons. To keep that old code working, the static markup gets the same ids / click hooks the old page
// had (productGrid, cartBadge, slide-N, catImgN, onclick="filterByCategory(2)" …). Texts that differ between English and
// Bangla are stored on their element (data-amr-tx) and swapped by the small adapter script on the server side.
//
// The server (n8n "site-builder/publish") re-checks everything here before it goes live.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Renderer, { sectionCss, fontCss } from '../Renderer';
import { builderCss } from '../sections/Pages';
import { storefrontCss } from '../storefrontCss';
import { txt, type PageDoc, type SiteTheme } from '../schema';

export interface LiveParts {
  top: string;       // notice bar + header + <main id="storefrontView">…</main>
  rest: string;      // footer + floating WhatsApp / chat buttons
  css: string;       // appended after the shop's own CSS
  fontImport: string;
  config: LiveConfig;
  warnings: string[];
}
export interface LiveConfig {
  matchers: string[][];          // per category tile (0 = all products)
  autoImage: boolean[];
  catLabels: { en: string; bn: string }[];
  slideCount: number;
  intervalMs: number;
}

const render = (theme: SiteTheme, page: PageDoc, lang: 'en' | 'bn') =>
  renderToStaticMarkup(createElement(Renderer, {
    theme, page, initialLang: lang, data: { products: [], productsLoaded: false, businessSlug: '' },
  }));

const parse = (html: string) => new DOMParser().parseFromString(`<!doctype html><html><body>${html}</body></html>`, 'text/html');

/** Record EN/BN text + attribute differences on the English DOM (same design → same structure). */
function bilingual(en: Element, bn: Element, warn: (m: string) => void) {
  const ec = Array.from(en.childNodes), bc = Array.from(bn.childNodes);
  if (ec.length !== bc.length || ec.some((n, i) => n.nodeType !== bc[i].nodeType || n.nodeName !== bc[i].nodeName)) {
    warn(`Some Bangla text near "${(en.textContent || '').trim().slice(0, 40)}" differs in layout; English is kept there.`);
    return;
  }
  const tx: [number, string, string][] = [];
  ec.forEach((n, i) => {
    if (n.nodeType === Node.TEXT_NODE) {
      if (n.nodeValue !== bc[i].nodeValue) tx.push([i, n.nodeValue || '', bc[i].nodeValue || '']);
    } else if (n.nodeType === Node.ELEMENT_NODE) {
      const a = n as Element, b = bc[i] as Element;
      const at: [string, string, string][] = [];
      for (const k of ['placeholder', 'alt', 'title']) {
        const va = a.getAttribute(k), vb = b.getAttribute(k);
        if (va !== null && vb !== null && va !== vb) at.push([k, va, vb]);
      }
      if (at.length) a.setAttribute('data-amr-at', JSON.stringify(at));
      bilingual(a, b, warn);
    }
  });
  if (tx.length) en.setAttribute('data-amr-tx', JSON.stringify(tx));
}

const ONCLICK = 'data-amr-onclick';
const setClick = (el: Element | null, js: string) => { el?.setAttribute(ONCLICK, js); };

/** Give the static markup the ids and hooks the shop's own script looks for. */
function addLegacyHooks(doc: Document, isHome: boolean) {
  const $ = (s: string) => doc.querySelector(s);
  const $$ = (s: string) => Array.from(doc.querySelectorAll(s));
  if (isHome) {
    setClick($('.header .logo'), 'showStorefront()');
    $$('.header-nav .nav-link, .footer .footer-link').forEach(a => {
      const href = a.getAttribute('href') || '';
      if (href === '#' || href === '#products' || href === '#about') setClick(a, 'showStorefront()');
    });
  } else {
    // inner page: the logo goes home; "#section" links that are not on this page go to that section of the home page
    setClick($('.header .logo'), "location.href='/'");
    $$('a[href^="#"]').forEach(a => {
      const href = a.getAttribute('href') || '#';
      const id = href.slice(1);
      if (!id || !doc.getElementById(id)) a.setAttribute('href', '/' + (id ? href : ''));
    });
  }
  const productsLink = $$('.header-nav .nav-item > .nav-link').find(a => a.getAttribute('href') === '#products');
  if (productsLink) {
    productsLink.parentElement!.id = 'navProductsItem';
    productsLink.parentElement!.querySelector('.nav-dropdown-mega')?.remove();     // the shop's script builds it from live products
  }
  const si = $('.search-input');
  if (si) { si.id = 'searchInput'; si.removeAttribute('value'); si.setAttribute('data-amr-oninput', 'runSearch(this.value)'); }
  setClick($('.search-icon-btn'), 'toggleSearch()');
  $$('.lang-btn').forEach((b, i) => { const l = i === 0 ? 'en' : 'bn'; b.setAttribute('data-lang', l); setClick(b, `setLang('${l}')`); });
  setClick($('.cart-icon-btn'), 'toggleCart(true)');
  const badge = $('.cart-badge'); if (badge) badge.id = 'cartBadge';
  $$('.slider-wrap .slide').forEach((s, i) => { s.id = `slide-${i}`; s.classList.toggle('active', i === 0); });
  $$('.slider-wrap .dot').forEach((d, i) => { setClick(d, `goSlide(${i})`); d.classList.toggle('active', i === 0); });
  $$('.cat-tile').forEach((t, i) => {
    t.setAttribute('data-cat-idx', String(i)); setClick(t, `filterByCategory(${i})`); t.classList.toggle('active', i === 0);
    const img = t.querySelector('.cat-tile-img'); if (img) img.id = `catImg${i}`;
  });
  const grid = $('.product-grid:not(.amr-featured)'); if (grid) grid.id = 'productGrid';   // featured boxes are filled by the adapter
  else {
    // the shop's script expects a product grid; on pages without one it fills this hidden box instead
    const hidden = doc.createElement('div'); hidden.id = 'productGrid'; hidden.setAttribute('style', 'display:none');
    doc.getElementById('storefrontView')?.appendChild(hidden);
  }
  $$('.footer-link').forEach(a => {
    if (/track/i.test(a.textContent || '') && a.getAttribute('href') === '#') setClick(a, 'if(window.openTrackOrder)openTrackOrder();return false');
  });
  const nl = $('.footer-newsletter-row'); if (nl) nl.setAttribute('data-amr-onsubmit', 'return false');
  const ne = $('.footer-newsletter-row input[type=email]'); if (ne) ne.id = 'newsletterEmail';
  const bubble = $('.sf-chat-bubble'); if (bubble) bubble.id = 'sfChatBubble';
  $$('[data-dyad-id],[data-dyad-name]').forEach(e => { e.removeAttribute('data-dyad-id'); e.removeAttribute('data-dyad-name'); });
}

/** data-amr-onclick="x" → onclick="x" (React cannot write string handlers; the values above are fixed, never user text). */
const finalize = (html: string) => html.replace(/ data-amr-(onclick|oninput|onsubmit)="/g, ' $1="');

export function buildLiveParts(theme: SiteTheme, page: PageDoc, opts: { isHome: boolean } = { isHome: true }): LiveParts {
  const warnings: string[] = [];
  const en = parse(render(theme, page, 'en'));
  const bn = parse(render(theme, page, 'bn'));
  // our CSS goes into <head> separately; React may also emit <link rel="preload"> for images — not wanted in the body
  for (const d of [en, bn]) d.querySelectorAll('style, link').forEach(s => s.remove());
  bilingual(en.body, bn.body, m => warnings.push(m));
  addLegacyHooks(en, opts.isHome);

  // split: everything up to the storefront <main> = top; the rest = footer + floating buttons
  const main = en.getElementById('storefrontView');
  if (!main) throw new Error('Design has no storefront area.');
  const kids = Array.from(en.body.children);
  const mi = kids.indexOf(main);
  const top = kids.slice(0, mi + 1).map(k => k.outerHTML).join('\n');
  const rest = kids.slice(mi + 1).map(k => k.outerHTML).join('\n');

  const cats = page.sections.find(s => s.type === 'categories');
  const hero = page.sections.find(s => s.type === 'hero_slider');
  const all = [...theme.globals.before, ...page.sections, ...theme.globals.after];
  const f = fontCss(theme.font);
  const config: LiveConfig = {
    matchers: (cats?.blocks || []).map(b => ((b.props as { match?: string[] }).match || []).map(String)),
    autoImage: (cats?.blocks || []).map(b => (b.props as { autoImage?: boolean }).autoImage !== false),
    catLabels: (cats?.blocks || []).map(b => ({ en: txt((b.props as { label?: string }).label, 'en'), bn: txt((b.props as { label?: string }).label, 'bn') })),
    slideCount: (hero?.blocks || []).length,
    intervalMs: Math.max(1500, Number((hero?.props as { intervalMs?: number } | undefined)?.intervalMs) || 4000),
  };
  return {
    top: finalize(top), rest: finalize(rest),
    css: storefrontCss(theme.accent) + '\n' + builderCss(theme) + '\n' + sectionCss(all) + '\n' + f.vars,
    fontImport: f.imp, config, warnings,
  };
}
