// Dashboard tab "Website Builder (beta)".
// Import the current shop → edit (Simple editor, several pages, templates) as a draft → Publish to the live shop,
// with version history and one-click restore. Nothing reaches the live shop until Publish.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { convertLegacy } from './convertLegacy';
import { loadSite, startImport, saveImported, saveDraft, savePageOnly, ConflictError, fetchSettings, fetchProducts, publishSite, restoreVersion, listVersions,
  createPage, updatePageMeta, aiGenerate, type BuilderSite, type BuilderPage, type SiteVersion } from './api';
import { PAGE_KINDS, TEMPLATES, applyTemplate, type PageKind, type Template } from './editor/pageTemplates';
import { applyPlanToHome, aiPageDoc, type AiPlan } from './editor/aiApply';
import { PAGE_SLUG_RE, RESERVED_SLUGS, type NavItem, type PageDoc, type SiteTheme } from './schema';
import { buildLiveParts } from './publish/liveHtml';
import type { Device, Product } from './schema';
import EditorPanel, { EDITOR_CSS, PageLinksCtx, type Design } from './editor/EditorPanel';

const WEBSITE_UPDATE_API = 'https://n8n2.kingpurefood.com/webhook/automorai/update-website-template';
const DEVICES: { key: Device; label: string; w: number }[] = [
  { key: 'desktop', label: 'Desktop', w: 1280 }, { key: 'tablet', label: 'Tablet', w: 820 }, { key: 'mobile', label: 'Mobile', w: 390 },
];
const VIEW_H = 760;
const AUTOSAVE_MS = 1500;
const HISTORY_MAX = 80;
const MERGE_MS = 1000;            // typing in one field within 1s = one undo step

type SaveState = 'saved' | 'dirty' | 'saving' | 'error' | 'conflict';
interface Props { slug: string; siteName: string; isDraft: boolean; liveUrl?: string }

export default function BuilderBeta({ slug, siteName, isDraft, liveUrl }: Props) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [site, setSite] = useState<BuilderSite | null>(null);
  const [home, setHome] = useState<BuilderPage | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [device, setDevice] = useState<Device>('desktop');
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [rev, setRev] = useState(1);
  const [frameReady, setFrameReady] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [boxW, setBoxW] = useState(900);

  // ── editor state ──
  const [design, setDesign] = useState<Design | null>(null);
  const [selected, setSelected] = useState('');
  const [openBlock, setOpenBlock] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [saveErr, setSaveErr] = useState('');
  const [lastSaved, setLastSaved] = useState('');
  const designRef = useRef<Design | null>(null);
  const known = useRef<{ site: string; page: string }>({ site: '', page: '' });
  const past = useRef<Design[]>([]);
  const future = useRef<Design[]>([]);
  const lastKey = useRef({ key: '', at: 0 });
  const timer = useRef<number | undefined>(undefined);
  const saving = useRef(false);
  const savedDesign = useRef<Design | null>(null);
  const [, force] = useState(0);
  // ── publish / versions ──
  const [versions, setVersions] = useState<SiteVersion[]>([]);
  const [pubBusy, setPubBusy] = useState('');
  const [pubMsg, setPubMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showVersions, setShowVersions] = useState(false);
  // ── pages ──
  const [pages, setPages] = useState<BuilderPage[]>([]);           // meta (title/slug/position); docs live in docsRef
  const [curPage, setCurPage] = useState('');
  const curPageRef = useRef('');
  const docsRef = useRef<Record<string, PageDoc>>({});
  const pageKnown = useRef<Record<string, string>>({});
  const [pagePanel, setPagePanel] = useState<'' | 'add' | 'settings' | 'templates' | 'ai'>('');
  const [aiText, setAiText] = useState('');
  const [aiBusy, setAiBusy] = useState('');
  const [aiMsg, setAiMsg] = useState('');
  const [aiOpts, setAiOpts] = useState({ look: true, pages: true, cats: false });
  const [pageErr, setPageErr] = useState('');

  const refresh = useCallback(async () => {
    if (!slug) return;
    setLoading(true); setError('');
    try {
      const r = await loadSite(slug);
      setSite(r?.site || null); setHome(r?.home || null); setRev(v => v + 1);
      const list = r?.pages || [];
      docsRef.current = Object.fromEntries(list.map(pg => [pg.id, pg.draft_json]));
      pageKnown.current = Object.fromEntries(list.map(pg => [pg.id, pg.updated_at]));
      setPages(list); curPageRef.current = r?.home?.id || ''; setCurPage(curPageRef.current); setPagePanel(''); setPageErr('');
      const d = r?.site && r.home ? { theme: r.site.theme, page: r.home.draft_json } : null;
      setDesign(d); designRef.current = d; savedDesign.current = d;
      known.current = { site: r?.site?.updated_at || '', page: r?.home?.updated_at || '' };
      past.current = []; future.current = []; lastKey.current = { key: '', at: 0 };
      setSaveState('saved'); setSaveErr(''); setLastSaved(r?.home?.updated_at || ''); setSelected('');
      if (r?.site) setVersions(await listVersions(r.site.id).catch(() => []));
    } catch (e) { setError((e as Error).message); }
    setLoading(false);
  }, [slug]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (!slug) return;
    setProductsLoaded(false);
    fetchProducts(slug).then(p => { setProducts(p); setProductsLoaded(true); }).catch(() => setProductsLoaded(true));
  }, [slug]);

  // ── save ──
  const save = useCallback(async () => {
    window.clearTimeout(timer.current);
    const d = designRef.current;
    const pid = curPageRef.current;
    if (!d || !site || !pid || saving.current) return;
    if (d === savedDesign.current) { setSaveState('saved'); return; }
    saving.current = true; setSaveState('saving'); setSaveErr('');
    try {
      known.current = await saveDraft(site.id, pid, d.theme, d.page, known.current);
      pageKnown.current[pid] = known.current.page; docsRef.current[pid] = d.page;
      savedDesign.current = d; setLastSaved(known.current.page);
      if (designRef.current === d) setSaveState('saved');
      else { setSaveState('dirty'); timer.current = window.setTimeout(() => save(), AUTOSAVE_MS); }
    } catch (e) {
      if (e instanceof ConflictError) setSaveState('conflict');
      else { setSaveState('error'); setSaveErr((e as Error).message); }
    }
    saving.current = false;
  }, [site]);

  const apply = (d: Design) => {
    designRef.current = d; setDesign(d);
    if (saveState === 'conflict') return;                     // never overwrite someone else's newer save
    setSaveState(d === savedDesign.current ? 'saved' : 'dirty');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => save(), AUTOSAVE_MS);
  };

  const change = (next: Design, key = '') => {
    const cur = designRef.current;
    if (!cur) return;
    const now = Date.now();
    const merge = key && key === lastKey.current.key && now - lastKey.current.at < MERGE_MS;
    if (!merge) { past.current.push(cur); if (past.current.length > HISTORY_MAX) past.current.shift(); }
    future.current = [];
    lastKey.current = { key, at: now };
    apply(next);
  };
  const undo = () => {
    const prev = past.current.pop();
    if (!prev || !designRef.current) return;
    future.current.push(designRef.current); lastKey.current = { key: '', at: 0 };
    apply(prev); force(x => x + 1);
  };
  const redo = () => {
    const nxt = future.current.pop();
    if (!nxt || !designRef.current) return;
    past.current.push(designRef.current); lastKey.current = { key: '', at: 0 };
    apply(nxt); force(x => x + 1);
  };

  // Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y outside text boxes (inside a text box the browser's own undo is used)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // warn before closing the browser with unsaved changes; save when leaving the tab
  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (designRef.current && designRef.current !== savedDesign.current) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, []);
  const saveRef = useRef(save); saveRef.current = save;
  useEffect(() => () => { if (designRef.current && designRef.current !== savedDesign.current) saveRef.current(); }, []);

  // ── preview iframe ──
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frameRef.current?.contentWindow) return;
      if (e.data?.type === 'amr-builder-ready') setFrameReady(true);
      if (e.data?.type === 'amr-builder-error') setError('Preview could not draw this design: ' + (e.data.problems || []).slice(0, 3).join('; '));
      if (e.data?.type === 'amr-builder-goto') gotoRef.current(String(e.data.path || ''));
      if (e.data?.type === 'amr-builder-pick' && designRef.current) {
        const sid = String(e.data.sid || '');
        const all = [...designRef.current.theme.globals.before, ...designRef.current.page.sections, ...designRef.current.theme.globals.after];
        const hit = all.find(s => s.id.replace(/[^a-zA-Z0-9_-]/g, '') === sid);
        if (hit) { setSelected(hit.id); setOpenBlock(''); }
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  useEffect(() => {
    if (!frameReady || !design) return;
    frameRef.current?.contentWindow?.postMessage({
      type: 'amr-builder-render', theme: design.theme, page: design.page,
      data: { products, productsLoaded, businessSlug: slug }, lang, rev, selectedId: selected, editing: true, focusBlock: openBlock,
    }, window.location.origin);
  }, [frameReady, design, products, productsLoaded, lang, rev, slug, selected, openBlock]);

  const gotoRef = useRef<(path: string) => void>(() => {});
  gotoRef.current = (path: string) => {
    const pg = pages.find(x => (x.slug === 'home' ? '/' : '/' + x.slug) === path);
    if (pg) switchPage(pg.id);
  };

  const pickFromPanel = (id: string) => {
    setSelected(id); setOpenBlock('');
    if (id) frameRef.current?.contentWindow?.postMessage({ type: 'amr-builder-scroll', sid: id }, window.location.origin);
  };

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBoxW(el.clientWidth));
    ro.observe(el); setBoxW(el.clientWidth);
    return () => ro.disconnect();
  }, [site, home]);

  const doImport = async () => {
    const edited = past.current.length > 0 || (designRef.current && designRef.current !== savedDesign.current);
    if (site && home && !window.confirm(edited
      ? 'Re-import replaces the builder design with your current live shop design. Your edits in the builder will be lost. Continue?'
      : 'Re-import copies your current live shop design into the builder again. Continue?')) return;
    window.clearTimeout(timer.current);
    setError(''); setWarnings([]);
    try {
      setBusy('Checking your shop…');
      const start = await startImport(slug);
      let html = start.legacy_html || '';
      if (!html && (start.status === 'draft' || isDraft)) {
        setBusy('Loading your draft design…');
        const { data } = await supabase.auth.getSession();
        const res = await fetch(WEBSITE_UPDATE_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token || ''}` },
          body: JSON.stringify({ business_slug: slug, preview_only: true }),
        });
        const j = await res.json().catch(() => ({}));
        html = j.preview_html || '';
      }
      if (!html) throw new Error('Could not read your current website design. Please try again.');
      setBusy('Converting the design…');
      const settings = await fetchSettings(slug);
      const out = convertLegacy(html, settings, { slug, source: start.status === 'draft' ? 'draft' : 'live' });
      setBusy('Saving to the builder…');
      await saveImported(start.site_id, out.name, out.theme, out.page);
      setWarnings(out.warnings);
      await refresh();
    } catch (e) { setError((e as Error).message); }
    setBusy('');
  };

  // wait until the latest edits are saved (publish always uses the saved draft)
  const flushSave = async (): Promise<boolean> => {
    for (let i = 0; i < 40; i++) {
      if (designRef.current === savedDesign.current && !saving.current) return true;
      if (!saving.current) await save();
      await new Promise(r => setTimeout(r, 250));
    }
    return designRef.current === savedDesign.current;
  };

  // ── pages ──
  const pageOf = (id: string) => pages.find(pg => pg.id === id);
  const pageLink = (pg: BuilderPage) => (pg.slug === 'home' ? '/' : '/' + pg.slug);
  const headerNav = (theme: SiteTheme): NavItem[] => ((theme.globals.before.find(x => x.type === 'header')?.props.nav as NavItem[]) || []);
  const withNav = (theme: SiteTheme, fn: (nav: NavItem[]) => NavItem[]): SiteTheme => ({ ...theme, globals: { ...theme.globals,
    before: theme.globals.before.map(x => (x.type === 'header' ? { ...x, props: { ...x.props, nav: fn(headerNav(theme)) } } : x)) } });

  const switchPage = async (id: string) => {
    if (id === curPageRef.current || !designRef.current) return;
    setPageErr('');
    if (!(await flushSave())) { setPageErr('Your changes on this page are not saved yet — try again in a moment.'); return; }
    const doc = docsRef.current[id];
    if (!doc) return;
    curPageRef.current = id; setCurPage(id);
    const d = { theme: designRef.current.theme, page: doc };
    designRef.current = d; savedDesign.current = d; setDesign(d);
    known.current = { ...known.current, page: pageKnown.current[id] };
    past.current = []; future.current = []; lastKey.current = { key: '', at: 0 };
    setSelected(''); setOpenBlock(''); setSaveState('saved'); setPagePanel('');
  };

  const addPage = async (kind: PageKind, ready?: PageDoc) => {
    if (!site || !designRef.current) return;
    setPageErr('');
    const taken = new Set(pages.map(pg => pg.slug));
    let sl = kind.slug, n = 2;
    while (taken.has(sl)) sl = `${kind.slug}-${n++}`;
    try {
      if (!(await flushSave())) throw new Error('Your changes are not saved yet — try again in a moment.');
      const homeDoc = pages.find(pg => pg.slug === 'home') ? docsRef.current[pages.find(pg => pg.slug === 'home')!.id] : null;
      const doc = ready || kind.make(designRef.current.theme, homeDoc);
      const pg = await createPage(site.id, sl, kind.title, Math.max(0, ...pages.map(x => x.position)) + 1, doc);
      docsRef.current[pg.id] = pg.draft_json; pageKnown.current[pg.id] = pg.updated_at;
      setPages(list => [...list, pg]);
      // open the new page and add it to the menu (one undo step on the new page)
      curPageRef.current = pg.id; setCurPage(pg.id);
      const d = { theme: designRef.current.theme, page: pg.draft_json };
      designRef.current = d; savedDesign.current = d; setDesign(d);
      known.current = { ...known.current, page: pg.updated_at };
      past.current = []; future.current = []; setSelected(''); setPagePanel('');
      // if the menu already has a link with the same name (e.g. "Contact", "About"), point it to the new page instead of adding a twin
      const word = kind.menu.en.split(' ')[0].toLowerCase();
      const labelEn = (l: NavItem['label']) => (typeof l === 'string' ? l : l.en || '').trim().toLowerCase();
      change({ theme: withNav(d.theme, nav => {
        const i = nav.findIndex(it => labelEn(it.label).split(' ')[0] === word && !it.link.startsWith('/'));
        if (i >= 0) return nav.map((it, j) => (j === i ? { ...it, link: '/' + sl } : it));
        return [...nav, { label: { ...kind.menu }, link: '/' + sl, children: [] }];
      }), page: d.page }, 'menu-add');
    } catch (e) { setPageErr((e as Error).message); }
  };

  const renamePage = async (title: string) => {
    const pg = pageOf(curPage); if (!pg || !title.trim()) return;
    try { pageKnown.current[pg.id] = await updatePageMeta(pg.id, { title: title.trim() }); known.current = { ...known.current, page: pageKnown.current[pg.id] };
      setPages(list => list.map(x => (x.id === pg.id ? { ...x, title: title.trim() } : x))); }
    catch (e) { setPageErr((e as Error).message); }
  };

  const changeSlug = async (raw: string) => {
    const pg = pageOf(curPage); if (!pg || pg.slug === 'home' || !designRef.current) return;
    const sl = raw.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
    if (sl === pg.slug) return;
    if (!PAGE_SLUG_RE.test(sl) || RESERVED_SLUGS.includes(sl) || sl === 'home') { setPageErr('Use only small letters, numbers and dashes (e.g. about-us).'); return; }
    if (pages.some(x => x.slug === sl)) { setPageErr('Another page already uses this address.'); return; }
    try {
      if (!(await flushSave())) throw new Error('Your changes are not saved yet — try again in a moment.');
      pageKnown.current[pg.id] = await updatePageMeta(pg.id, { slug: sl }); known.current = { ...known.current, page: pageKnown.current[pg.id] };
      setPages(list => list.map(x => (x.id === pg.id ? { ...x, slug: sl } : x)));
      // menu links that pointed to the old address follow the page
      change({ theme: withNav(designRef.current.theme, nav => nav.map(it => (it.link === '/' + pg.slug ? { ...it, link: '/' + sl } : it))), page: designRef.current.page }, 'slug');
      setPageErr('');
    } catch (e) { setPageErr((e as Error).message); }
  };

  const inMenu = (pg: BuilderPage | undefined, theme: SiteTheme) => !!pg && headerNav(theme).some(it => it.link === pageLink(pg));
  const toggleMenu = () => {
    const pg = pageOf(curPage); if (!pg || !designRef.current) return;
    const d = designRef.current, link = pageLink(pg);
    const theme = inMenu(pg, d.theme) ? withNav(d.theme, nav => nav.filter(it => it.link !== link))
      : withNav(d.theme, nav => [...nav, { label: { en: pg.title, bn: pg.title }, link, children: [] }]);
    change({ theme, page: d.page }, 'menu');
  };

  const setArchived = (archived: boolean) => {
    const pg = pageOf(curPageRef.current); if (!pg || pg.slug === 'home' || !designRef.current) return;
    if (archived && !window.confirm(`Remove the page "${pg.title}"? It is kept under "Removed pages", so you can bring it back. It will not be published.`)) return;
    const d = designRef.current;
    const theme = archived ? withNav(d.theme, nav => nav.filter(it => it.link !== pageLink(pg))) : d.theme;
    const page = { ...d.page }; if (archived) page.archived = true; else delete page.archived;
    change({ theme, page }, 'archive');
    docsRef.current[pg.id] = page; setPages(list => list.slice());
  };

  const useTemplate = async (t: Template) => {
    if (!designRef.current) return;
    setPageErr('');
    if (!(await flushSave())) { setPageErr('Your changes are not saved yet — try again in a moment.'); return; }
    const ids = pages.map(pg => pg.id);
    const docs = ids.map(id => (id === curPageRef.current ? designRef.current!.page : docsRef.current[id]));
    const out = applyTemplate(t, designRef.current.theme, docs);
    // other pages: only their layout choice changes; saved directly (the theme is saved with the current page)
    for (let i = 0; i < ids.length; i++) {
      if (ids[i] === curPageRef.current || JSON.stringify(out.pages[i]) === JSON.stringify(docs[i])) continue;
      try { pageKnown.current[ids[i]] = await savePageOnly(ids[i], out.pages[i], pageKnown.current[ids[i]]); docsRef.current[ids[i]] = out.pages[i]; }
      catch (e) { setPageErr(e instanceof ConflictError ? 'A page was changed in another tab. Load the latest version.' : (e as Error).message); return; }
    }
    change({ theme: out.theme, page: out.pages[ids.indexOf(curPageRef.current)] }, 'template');
    setPagePanel('');
  };

  // ── AI Website Generator ──
  const runAi = async () => {
    if (!designRef.current || !site) return;
    const text = aiText.trim();
    if (text.length < 20) { setAiMsg('Please write at least one or two sentences about your business.'); return; }
    setAiMsg('');
    let plan: AiPlan;
    try {
      setAiBusy('Writing your website… (about 20–40 seconds)');
      const r = await aiGenerate(slug, text);
      plan = r.plan;
      setAiMsg(`Done. You can make ${r.left_today} more AI designs today.`);
    } catch (e) { setAiBusy(''); setAiMsg((e as Error).message); return; }
    setAiBusy('');
    const homePg = pages.find(pg => pg.slug === 'home');
    if (!homePg) return;
    const extra = aiOpts.pages ? ['about', 'contact', 'faq'].filter(k => !pages.some(pg => pg.slug === PAGE_KINDS.find(x => x.key === k)!.slug)) : [];
    if (!window.confirm('Apply the AI design?\n\nIt rewrites the texts on your Home page' + (aiOpts.look ? ', changes the look' : '') +
      (extra.length ? ` and adds these pages: ${extra.join(', ')}` : '') + '. Your products, logo and menu stay. You can undo the Home page change.')) return;
    try {
      // 1) new pages first (each opens itself), 2) then Home last, so "Undo" right after still reverts the Home change
      const wa = String((designRef.current.theme.globals.after.find(x => x.type === 'footer')?.props.whatsapp) || '');
      for (const k of extra) {
        const kind = PAGE_KINDS.find(x => x.key === k)!;
        await addPage(kind, aiPageDoc(k, plan, wa) || undefined);
        if (!(await flushSave())) throw new Error('A new page could not be saved. Please try again.');
      }
      if (curPageRef.current !== homePg.id) await switchPage(homePg.id);
      if (curPageRef.current !== homePg.id || !designRef.current) throw new Error('Could not open the Home page. Try again.');
      const hasCats = (designRef.current.page.sections.find(x => x.type === 'categories')?.blocks || []).length > 1;
      const out = applyPlanToHome(plan, designRef.current.theme, designRef.current.page, { look: aiOpts.look, keepCategories: hasCats && !aiOpts.cats });
      change(out, 'ai');
      setPagePanel('');
    } catch (e) { setAiMsg((e as Error).message); }
  };

  const doPublish = async () => {
    if (!site || !designRef.current) return;
    setPubMsg(null);
    if (saveState === 'conflict') { setPubMsg({ ok: false, text: 'Load the latest version first (it was changed in another tab).' }); return; }
    const live = pages.filter(pg => !(docsRef.current[pg.id] || {}).archived);
    const buildAll = () => live.map(pg => {
      const doc = pg.id === curPageRef.current ? designRef.current!.page : docsRef.current[pg.id];
      return { slug: pg.slug, parts: buildLiveParts(designRef.current!.theme, doc, { isHome: pg.slug === 'home' }) };
    });
    let built;
    try { built = buildAll(); }
    catch (e) { setPubMsg({ ok: false, text: 'This design cannot be published: ' + (e as Error).message }); return; }
    const warn = built.flatMap(b => b.parts.warnings);
    const notes = warn.length ? '\n\nNote: ' + warn.join(' ') : '';
    const names = live.map(pg => pg.slug === 'home' ? 'Home' : pg.title).join(', ');
    if (!window.confirm(`Publish ${live.length} page(s) to your LIVE shop now? (${names})\n\nCustomers will see it right away. Products, cart, checkout and chat keep working as before. ` +
      'Your current live design is saved first, so you can restore it with one click.' + notes)) return;
    try {
      setPubBusy('Saving your draft…');
      if (!(await flushSave())) throw new Error('Your latest changes could not be saved, so nothing was published.');
      setPubBusy('Publishing…');
      const r = await publishSite(slug, buildAll());
      setPubMsg({ ok: true, text: `Published! Version ${r.version} is now live on your shop.` });
      setVersions(await listVersions(site.id).catch(() => versions));
    } catch (e) { setPubMsg({ ok: false, text: (e as Error).message }); }
    setPubBusy('');
  };

  const doRestore = async (v: SiteVersion) => {
    if (!site) return;
    const what = v.kind === 'legacy' ? "your shop's own design from before the builder" : `builder version ${v.version}`;
    if (!window.confirm(`Put ${what} back on your LIVE shop now? (Your builder draft is not changed.)`)) return;
    setPubMsg(null);
    try {
      setPubBusy(`Restoring version ${v.version}…`);
      const r = await restoreVersion(slug, v.version);
      setPubMsg({ ok: true, text: `Restored. Your live shop now shows version ${v.version} again (saved as version ${r.version}).` });
      setVersions(await listVersions(site.id).catch(() => versions));
    } catch (e) { setPubMsg({ ok: false, text: (e as Error).message }); }
    setPubBusy('');
  };

  const dev = DEVICES.find(d => d.key === device)!;
  const scale = Math.min(1, (boxW - 2) / dev.w);
  const imported = !!(site && home && design);
  const statusText: Record<SaveState, string> = {
    saved: lastSaved ? `Draft saved ${new Date(lastSaved).toLocaleTimeString()}` : 'Draft saved',
    dirty: 'Unsaved changes…', saving: 'Saving…', error: 'Not saved', conflict: 'Changed in another tab',
  };
  const statusColor: Record<SaveState, string> = { saved: '#15803d', dirty: '#b45309', saving: '#2563eb', error: '#b42318', conflict: '#b42318' };
  const seg = (on: boolean, color = '#0a1f5c') => ({ border: 0, borderRadius: '8px', padding: '7px 12px', fontWeight: 700, fontSize: '.8rem', cursor: 'pointer',
    background: on ? color : 'transparent', color: on ? '#fff' : '#40536f' });

  return (
    // same page padding as the other Dashboard tabs; minmax(0,1fr) stops the preview from widening the page
    <div className="amr-builder-page" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '16px', maxWidth: '1440px', margin: '0 auto', minWidth: 0, boxSizing: 'border-box' }}>
      <style>{`.amr-builder-page{padding:32px 24px}@media(max-width:768px){.amr-builder-page{padding:20px 14px}}
.amr-bld-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;align-items:start}
.amr-bld-panel{min-width:0}
@media(min-width:1100px){.amr-bld-grid{grid-template-columns:370px minmax(0,1fr)}.amr-bld-panel{max-height:calc(100vh - 120px);overflow:auto;position:sticky;top:16px}.amr-bld-prev{position:sticky;top:16px}}
${EDITOR_CSS}`}</style>
      <div className="amr-pagehead">
        <div className="amr-eyebrow">Website Builder</div>
        <h1>Website Builder <span style={{ fontSize: '.7rem', verticalAlign: 'middle', background: '#e8f7fd', color: '#0b84ad', padding: '3px 8px', borderRadius: '20px', fontWeight: 800 }}>BETA</span></h1>
        <div className="amr-sub">Edit your design here. Changes are saved as a draft — your live shop changes only when you press Publish.</div>
      </div>

      {!slug ? (
        <div className="amr-card">Build your website first, then come back here.</div>
      ) : (
        <div className="amr-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 800, color: '#12284c' }}>{siteName}</div>
            <div className="amr-sub" style={{ marginTop: 3 }}>
              {loading ? 'Loading…' : imported ? (versions[0]?.kind === 'builder' ? `Live: builder version ${versions[0].version} · edits stay in the draft until you publish` : 'Edits stay in the draft until you publish')
                : 'Not in the builder yet. Import copies your current design — your shop stays exactly as it is.'}
              {imported && isDraft && ' · Publishing is available after your website goes live.'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {liveUrl && !isDraft && <a className="amr-btn" href={liveUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>Open live shop ↗</a>}
            <button className={imported ? 'amr-btn' : 'amr-btn amr-btn-primary'} disabled={!!busy || loading || !!pubBusy} onClick={doImport}>
              {busy || (imported ? 'Re-import from live shop' : 'Import my current website')}
            </button>
            {imported && !isDraft && (
              <button className="amr-btn amr-btn-primary" disabled={!!busy || loading || !!pubBusy || saveState === 'conflict'} onClick={doPublish}>
                {pubBusy || 'Publish to live shop'}
              </button>
            )}
          </div>
        </div>
      )}

      {error && <div className="amr-card" style={{ borderColor: '#f5c2c0', background: '#fff6f5', color: '#b42318' }}>{error}</div>}
      {warnings.length > 0 && <div className="amr-card" style={{ background: '#fffaf0', color: '#8a5a00', fontSize: '.82rem' }}>Imported with notes: {warnings.join(' · ')}</div>}
      {saveState === 'conflict' && (
        <div className="amr-card" style={{ borderColor: '#f5c2c0', background: '#fff6f5', color: '#b42318', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>This design was saved from another tab or device, so your latest changes here were not saved (to avoid overwriting it).</span>
          <button className="amr-btn" onClick={() => refresh()}>Load the latest version</button>
        </div>
      )}
      {saveState === 'error' && saveErr && <div className="amr-card" style={{ borderColor: '#f5c2c0', background: '#fff6f5', color: '#b42318' }}>{saveErr}</div>}
      {pubMsg && (
        <div className="amr-card" style={pubMsg.ok ? { borderColor: '#bbf7d0', background: '#f0fdf4', color: '#15803d' } : { borderColor: '#f5c2c0', background: '#fff6f5', color: '#b42318' }}>
          {pubMsg.text} {pubMsg.ok && liveUrl && <a href={liveUrl} target="_blank" rel="noreferrer" style={{ fontWeight: 700 }}>Open live shop ↗</a>}
        </div>
      )}
      {imported && versions.length > 0 && (
        <div className="amr-card" style={{ padding: '14px' }}>
          <button className="amr-ed-link" onClick={() => setShowVersions(!showVersions)}>{showVersions ? '▾' : '▸'} Version history ({versions.length})</button>
          {showVersions && (
            <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
              {versions.map((v, i) => (
                <div key={v.version} className="amr-ed-row" style={{ cursor: 'default' }}>
                  <span className="amr-ed-rowname" style={{ whiteSpace: 'normal' }}>
                    v{v.version} · {v.kind === 'legacy' ? "Shop's own design (before the builder)" : 'Builder design'}
                    {v.note && v.note.startsWith('Restored') ? <em> · {v.note}</em> : null}
                    <span style={{ display: 'block', fontWeight: 500, fontSize: '.72rem', color: '#6b7c97' }}>{new Date(v.created_at).toLocaleString()}</span>
                  </span>
                  {i === 0
                    ? <span style={{ fontSize: '.72rem', fontWeight: 800, color: '#15803d', background: '#dcfce7', padding: '4px 10px', borderRadius: 20 }}>LIVE</span>
                    : <button className="amr-ed-btn" disabled={!!pubBusy} onClick={() => doRestore(v)}>Restore</button>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {imported && design && site && (
        <div className="amr-bld-grid">
          <div className="amr-card amr-bld-panel" style={{ padding: '14px' }}>
            <div className="amr-ed-box" style={{ marginBottom: 10, background: '#fff' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="amr-ed-label" style={{ margin: 0 }}>Page</span>
                <select className="amr-ed-in" style={{ flex: '1 1 140px', width: 'auto' }} value={curPage} onChange={e => switchPage(e.target.value)}>
                  {pages.filter(pg => !(docsRef.current[pg.id] || {}).archived || pg.id === curPage).map(pg => (
                    <option key={pg.id} value={pg.id}>{pg.slug === 'home' ? 'Home' : pg.title} ({pageLink(pg)}){(docsRef.current[pg.id] || {}).archived ? ' — removed' : ''}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button className="amr-ed-btn" onClick={() => setPagePanel(pagePanel === 'add' ? '' : 'add')}>+ Add page</button>
                <button className="amr-ed-btn" onClick={() => setPagePanel(pagePanel === 'settings' ? '' : 'settings')}>⚙ Page settings</button>
                <button className="amr-ed-btn" onClick={() => setPagePanel(pagePanel === 'templates' ? '' : 'templates')}>🎨 Templates</button>
                <button className="amr-ed-btn amr-ed-btn-blue" onClick={() => setPagePanel(pagePanel === 'ai' ? '' : 'ai')}>✨ AI design</button>
              </div>
              {pageErr && <div className="amr-ed-warn">{pageErr}</div>}
              {design.page.archived && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '8px 10px' }}>
                  <span style={{ fontSize: '.78rem', color: '#9a3412', fontWeight: 700 }}>This page is removed — it is not published.</span>
                  <button className="amr-ed-btn amr-ed-btn-blue" onClick={() => setArchived(false)}>Bring this page back</button>
                </div>
              )}
              {pagePanel === 'add' && (
                <div style={{ display: 'grid', gap: 6 }}>
                  <div className="amr-ed-help" style={{ marginTop: 0 }}>The new page is added to your menu. You can change everything on it.</div>
                  {PAGE_KINDS.map(k => (
                    <button key={k.key} className="amr-ed-btn" style={{ textAlign: 'left' }} disabled={pages.length >= 10} onClick={() => addPage(k)}>{k.icon} {k.label}</button>
                  ))}
                  {pages.length >= 10 && <div className="amr-ed-help">A shop can have up to 10 pages.</div>}
                </div>
              )}
              {pagePanel === 'settings' && (() => {
                const pg = pageOf(curPage);
                if (!pg) return null;
                const removed = pages.filter(x => (docsRef.current[x.id] || {}).archived && x.id !== curPage);
                return (
                  <div style={{ display: 'grid', gap: 8 }}>
                    <div><div className="amr-ed-label">Page name</div>
                      <input className="amr-ed-in" key={'t' + pg.id + pg.title} defaultValue={pg.title} onBlur={e => renamePage(e.target.value)} /></div>
                    {pg.slug !== 'home' && <div><div className="amr-ed-label">Address</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><code>/</code>
                        <input className="amr-ed-in" key={'s' + pg.id + pg.slug} defaultValue={pg.slug} onBlur={e => changeSlug(e.target.value)} /></div></div>}
                    <label className="amr-ed-toggle"><input type="checkbox" checked={inMenu(pg, design.theme)} onChange={toggleMenu} /> Show in the menu</label>
                    {pg.slug !== 'home' && !(design.page.archived) && <button className="amr-ed-btn" onClick={() => setArchived(true)}>Remove this page</button>}
                    {removed.length > 0 && <div className="amr-ed-help">Removed pages: {removed.map(x => (
                      <button key={x.id} className="amr-ed-link" style={{ marginRight: 8 }} onClick={() => switchPage(x.id)}>{x.title}</button>))}</div>}
                  </div>
                );
              })()}
              {pagePanel === 'ai' && (
                <div style={{ display: 'grid', gap: 8 }}>
                  <div className="amr-ed-help" style={{ marginTop: 0 }}>Describe your business in Bangla or English. AI writes the texts (both languages), picks a look and photos. Nothing goes live until you publish.</div>
                  <textarea className="amr-ed-in" rows={5} maxLength={1500} value={aiText} onChange={e => setAiText(e.target.value)}
                    placeholder="e.g. We sell handmade cotton kurtis and three-pieces for women in Dhaka. Prices 800–2500 taka. Cash on delivery all over Bangladesh." />
                  <label className="amr-ed-toggle"><input type="checkbox" checked={aiOpts.look} onChange={e => setAiOpts({ ...aiOpts, look: e.target.checked })} /> Also choose colors & layout</label>
                  <label className="amr-ed-toggle"><input type="checkbox" checked={aiOpts.pages} onChange={e => setAiOpts({ ...aiOpts, pages: e.target.checked })} /> Add About, Contact and FAQ pages (if missing)</label>
                  <label className="amr-ed-toggle"><input type="checkbox" checked={aiOpts.cats} onChange={e => setAiOpts({ ...aiOpts, cats: e.target.checked })} /> Replace my categories (only if you have no products yet)</label>
                  <button className="amr-ed-btn amr-ed-btn-blue" disabled={!!aiBusy} onClick={runAi}>{aiBusy || '✨ Write my website'}</button>
                  {aiMsg && <div className="amr-ed-help" style={{ color: /Done/.test(aiMsg) ? '#15803d' : '#b42318' }}>{aiMsg}</div>}
                </div>
              )}
              {pagePanel === 'templates' && (
                <div style={{ display: 'grid', gap: 8 }}>
                  <div className="amr-ed-help" style={{ marginTop: 0 }}>A template changes the look of all pages (colors, font, layouts). Your photos, texts and products stay. You can undo.</div>
                  {TEMPLATES.map(t => {
                    const on = (design.theme.template || 'classic') === t.key;
                    return (
                      <div key={t.key} className="amr-ed-row" style={{ cursor: 'default', borderColor: on ? '#2563eb' : undefined }}>
                        <span style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
                          <span style={{ display: 'inline-flex', borderRadius: 8, overflow: 'hidden', border: '1px solid #dfe7f3', flex: '0 0 auto' }}>
                            {t.swatch.map((c, i) => <span key={i} style={{ width: 16, height: 30, background: c }} />)}</span>
                          <span style={{ minWidth: 0 }}><b>{t.name}</b><span style={{ display: 'block', fontSize: '.72rem', color: '#6b7c97' }}>{t.for}</span></span>
                        </span>
                        {on ? <span style={{ fontSize: '.72rem', fontWeight: 800, color: '#2563eb' }}>IN USE</span>
                          : <button className="amr-ed-btn" onClick={() => useTemplate(t)}>Use</button>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <PageLinksCtx.Provider value={pages.filter(pg => !(docsRef.current[pg.id] || {}).archived).map(pg => ({ v: pageLink(pg), l: (pg.slug === 'home' ? 'Home' : pg.title) + ' page' }))}>
            <EditorPanel design={design} change={change} siteId={site.id} device={device} selected={selected} setSelected={pickFromPanel} openBlock={openBlock} setOpenBlock={setOpenBlock} />
            </PageLinksCtx.Provider>
          </div>

          <div className="amr-card amr-bld-prev" style={{ padding: '14px', minWidth: 0 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <button className="amr-ed-btn" title="Undo (Ctrl+Z)" disabled={!past.current.length} onClick={undo}>↶ Undo</button>
                <button className="amr-ed-btn" title="Redo (Ctrl+Shift+Z)" disabled={!future.current.length} onClick={redo}>↷ Redo</button>
                <button className="amr-ed-btn amr-ed-btn-blue" disabled={saveState === 'saved' || saveState === 'saving' || saveState === 'conflict'} onClick={() => save()}>Save</button>
                <span style={{ fontSize: '.76rem', fontWeight: 700, color: statusColor[saveState] }}>● {statusText[saveState]}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ display: 'inline-flex', background: '#eef3fb', borderRadius: '10px', padding: '3px' }}>
                  {DEVICES.map(d => <button key={d.key} onClick={() => setDevice(d.key)} style={seg(device === d.key)}>{d.label}</button>)}
                </div>
                <div style={{ display: 'inline-flex', background: '#eef3fb', borderRadius: '10px', padding: '3px' }}>
                  {(['en', 'bn'] as const).map(l => <button key={l} onClick={() => setLang(l)} style={seg(lang === l, '#2563eb')}>{l === 'en' ? 'EN' : 'বাংলা'}</button>)}
                </div>
              </div>
            </div>
            <div ref={boxRef} style={{ width: '100%', height: VIEW_H * scale + 2, overflow: 'hidden', background: '#e9eef6', borderRadius: '10px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: dev.w * scale, height: VIEW_H * scale, flex: '0 0 auto' }}>
                <iframe ref={frameRef} title="Website preview" src="/builder-preview.html"
                  style={{ width: dev.w, height: VIEW_H, border: 0, background: '#fff', transform: `scale(${scale})`, transformOrigin: '0 0', display: 'block' }} />
              </div>
            </div>
            <div className="amr-sub" style={{ marginTop: '10px', fontSize: '.76rem' }}>
              {dev.label} · {dev.w}px wide{scale < 1 ? ` · shown at ${Math.round(scale * 100)}%` : ''}. Click a section in the preview to edit it. Products, prices and photos are your real, live data.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
