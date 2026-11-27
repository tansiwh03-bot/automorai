// Shared renderer: draws a site from the builder format. The same component is used by the Dashboard preview,
// and (next phases) by the editor canvas and the live shop. It only reads the design + live data; it never fetches.
import { useMemo, useState, type ComponentType } from 'react';
import { type PageDoc, type Section, type SiteTheme, type RenderData, type BoxStyle } from './schema';
import { Ctx, type RenderCtx } from './context';
import { storefrontCss } from './storefrontCss';
import { NoticeBar, Header } from './sections/Header';
import { HeroSlider } from './sections/HeroSlider';
import { Categories } from './sections/Categories';
import { ProductGrid } from './sections/ProductGrid';
import { WhyUs, Testimonials, About } from './sections/Content';
import { Footer, ChatBubble } from './sections/Footer';

const REGISTRY: Record<string, ComponentType<{ s: Section }>> = {
  notice_bar: NoticeBar, header: Header, hero_slider: HeroSlider, categories: Categories, product_grid: ProductGrid,
  why_us: WhyUs, testimonials: Testimonials, about: About, footer: Footer, chat_bubble: ChatBubble,
};

// Device breakpoints used by the editor preview (mobile matches the legacy CSS 768px rule)
const BP = { tablet: 1024, mobile: 768 };

const boxCss = (b: Partial<BoxStyle> | undefined): string => {
  if (!b) return '';
  const out: string[] = [];
  if (b.paddingTop != null) out.push(`padding-top:${Math.max(0, Math.min(400, Number(b.paddingTop) || 0))}px`);
  if (b.paddingBottom != null) out.push(`padding-bottom:${Math.max(0, Math.min(400, Number(b.paddingBottom) || 0))}px`);
  if (b.background && /^(#[0-9a-fA-F]{3,8}|rgba?\([\d\s.,%]+\)|transparent)$/.test(b.background)) out.push(`background:${b.background}`);
  if (b.textAlign && ['left', 'center', 'right'].includes(b.textAlign)) out.push(`text-align:${b.textAlign}`);
  return out.join(';');
};
const safeSid = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '');

/** Per-section CSS for style overrides and per-device hiding (no inline styles, so media queries work). */
function sectionCss(sections: Section[]): string {
  const rules: string[] = [];
  for (const s of sections) {
    const sel = `[data-sid="${safeSid(s.id)}"]>*`;
    const base = boxCss(s.style?.base), tab = boxCss(s.style?.tablet), mob = boxCss(s.style?.mobile);
    if (base) rules.push(`${sel}{${base}}`);
    if (s.hidden?.desktop) rules.push(`@media(min-width:${BP.tablet + 1}px){${sel}{display:none!important}}`);
    if (tab) rules.push(`@media(max-width:${BP.tablet}px){${sel}{${tab}}}`);
    if (s.hidden?.tablet) rules.push(`@media(min-width:${BP.mobile + 1}px) and (max-width:${BP.tablet}px){${sel}{display:none!important}}`);
    if (mob) rules.push(`@media(max-width:${BP.mobile}px){${sel}{${mob}}}`);
    if (s.hidden?.mobile) rules.push(`@media(max-width:${BP.mobile}px){${sel}{display:none!important}}`);
  }
  return rules.join('\n');
}

function SectionView({ s }: { s: Section }) {
  const C = REGISTRY[s.type];
  if (!C) return null;                                  // unknown types are skipped, never crash the page
  return <div data-sid={safeSid(s.id)} style={{ display: 'contents' }}><C s={s} /></div>;
}

export interface RendererProps {
  theme: SiteTheme;
  page: PageDoc;
  data: RenderData & { productsLoaded?: boolean };
  initialLang?: 'en' | 'bn';
  onPreviewAction?: (what: string) => void;
}

export default function Renderer({ theme, page, data, initialLang = 'en', onPreviewAction }: RendererProps) {
  const [lang, setLang] = useState<'en' | 'bn'>(initialLang);
  const [activeCat, setActiveCat] = useState(0);
  const [search, setSearch] = useState('');

  const all = useMemo(() => [...theme.globals.before, ...page.sections, ...theme.globals.after], [theme, page]);
  const catMatchers = useMemo(() => {
    const cats = page.sections.find(s => s.type === 'categories');
    return (cats?.blocks || []).map(b => ((b.props as { match?: string[] }).match || []).map(String));
  }, [page]);

  const ctx: RenderCtx = {
    lang, setLang, products: data.products || [], productsLoaded: data.productsLoaded !== false,
    activeCat, setActiveCat, catMatchers, search, setSearch,
    onPreviewAction: onPreviewAction || (() => {}),
  };
  const css = useMemo(() => storefrontCss(theme.accent) + '\n' + sectionCss(all), [theme.accent, all]);

  return (
    <Ctx.Provider value={ctx}>
      <style>{css}</style>
      {theme.globals.before.map(s => <SectionView key={s.id} s={s} />)}
      <main id="storefrontView">{page.sections.map(s => <SectionView key={s.id} s={s} />)}</main>
      {theme.globals.after.map(s => <SectionView key={s.id} s={s} />)}
    </Ctx.Provider>
  );
}
