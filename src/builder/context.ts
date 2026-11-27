import { createContext, useContext } from 'react';
import { txt, type Product, type Txt } from './schema';
import { LEGACY_I18N } from './legacyStrings';

export interface RenderCtx {
  lang: 'en' | 'bn';
  setLang: (l: 'en' | 'bn') => void;
  products: Product[];
  productsLoaded: boolean;
  activeCat: number;                 // index into the categories section (0 = all)
  setActiveCat: (i: number) => void;
  catMatchers: string[][];           // per category tile: names that match product.category
  search: string;
  setSearch: (q: string) => void;
  /** Things a preview cannot do (open cart, place order, chat…) — the host decides what to show. */
  onPreviewAction: (what: string) => void;
  /** Editor only: the block being edited (e.g. a slide) — sliders stop on it. */
  focusBlock?: string;
}

export const Ctx = createContext<RenderCtx | null>(null);
export const useRender = (): RenderCtx => {
  const c = useContext(Ctx);
  if (!c) throw new Error('Renderer context missing');
  return c;
};

// Same matching rules as the legacy shop (normCat / categoryMatches): strip leading emoji/symbols, case-insensitive.
export const normCat = (s: unknown): string => String(s ?? '').replace(/^[^\p{L}\p{N}]+/u, '').trim().toLowerCase();
export const productInCat = (p: Product, idx: number, matchers: string[][]): boolean => {
  if (!idx) return true;
  const pc = normCat(p.category);
  if (!pc) return false;
  return (matchers[idx] || []).some(m => normCat(m) === pc);
};
export const fmtPrice = (n: number, lang: 'en' | 'bn'): string =>
  '৳' + Number(n).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US');

/** A fixed storefront text: the section's own copy (imported from the shop) first, then the template default. */
export const label = (labels: Record<string, Txt> | undefined, key: string, lang: 'en' | 'bn'): string =>
  txt(labels?.[key] ?? LEGACY_I18N[key], lang);
