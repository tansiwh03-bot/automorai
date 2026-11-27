// Dashboard tab "Website Builder (beta)" — Phase 1: import the current shop into the new format and preview it.
// Nothing here changes the live shop: there is no publish button in this phase.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { convertLegacy } from './convertLegacy';
import { loadSite, startImport, saveImported, fetchSettings, fetchProducts, type BuilderSite, type BuilderPage } from './api';
import type { Device, Product } from './schema';

const WEBSITE_UPDATE_API = 'https://n8n2.kingpurefood.com/webhook/automorai/update-website-template';
const DEVICES: { key: Device; label: string; w: number }[] = [
  { key: 'desktop', label: 'Desktop', w: 1280 }, { key: 'tablet', label: 'Tablet', w: 820 }, { key: 'mobile', label: 'Mobile', w: 390 },
];
const VIEW_H = 760;

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

  const refresh = useCallback(async () => {
    if (!slug) return;
    setLoading(true); setError('');
    try {
      const r = await loadSite(slug);
      setSite(r?.site || null); setHome(r?.home || null); setRev(v => v + 1);
    } catch (e) { setError((e as Error).message); }
    setLoading(false);
  }, [slug]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (!slug) return;
    setProductsLoaded(false);
    fetchProducts(slug).then(p => { setProducts(p); setProductsLoaded(true); }).catch(() => setProductsLoaded(true));
  }, [slug]);

  // the preview iframe tells us when it is ready to receive a design
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frameRef.current?.contentWindow) return;
      if (e.data?.type === 'amr-builder-ready') setFrameReady(true);
      if (e.data?.type === 'amr-builder-error') setError('Preview could not draw this design: ' + (e.data.problems || []).slice(0, 3).join('; '));
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  useEffect(() => {
    if (!frameReady || !site || !home) return;
    frameRef.current?.contentWindow?.postMessage({
      type: 'amr-builder-render', theme: site.theme, page: home.draft_json,
      data: { products, productsLoaded, businessSlug: slug }, lang, rev,
    }, window.location.origin);
  }, [frameReady, site, home, products, productsLoaded, lang, rev, slug]);

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBoxW(el.clientWidth));
    ro.observe(el); setBoxW(el.clientWidth);
    return () => ro.disconnect();
  }, [site, home]);

  const doImport = async () => {
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

  const dev = DEVICES.find(d => d.key === device)!;
  const scale = Math.min(1, (boxW - 2) / dev.w);
  const imported = !!(site && home);

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      <div className="amr-pagehead">
        <div className="amr-eyebrow">Website Builder</div>
        <h1>Website Builder <span style={{ fontSize: '.7rem', verticalAlign: 'middle', background: '#e8f7fd', color: '#0b84ad', padding: '3px 8px', borderRadius: '20px', fontWeight: 800 }}>BETA</span></h1>
        <div className="amr-sub">Phase 1 preview. Your live shop does not change here — editing and publishing come in the next phases.</div>
      </div>

      {!slug ? (
        <div className="amr-card">Build your website first, then come back here.</div>
      ) : (
        <div className="amr-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 800, color: '#12284c' }}>{siteName}</div>
            <div className="amr-sub" style={{ marginTop: 3 }}>
              {loading ? 'Loading…' : imported
                ? `Imported into the builder · last saved ${new Date(home!.updated_at).toLocaleString()}`
                : 'Not in the builder yet. Import copies your current design — your shop stays exactly as it is.'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {liveUrl && !isDraft && <a className="amr-btn" href={liveUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>Open live shop ↗</a>}
            <button className="amr-btn amr-btn-primary" disabled={!!busy || loading} onClick={doImport}>
              {busy || (imported ? 'Re-import from current website' : 'Import my current website')}
            </button>
          </div>
        </div>
      )}

      {error && <div className="amr-card" style={{ borderColor: '#f5c2c0', background: '#fff6f5', color: '#b42318' }}>{error}</div>}
      {warnings.length > 0 && <div className="amr-card" style={{ background: '#fffaf0', color: '#8a5a00', fontSize: '.82rem' }}>Imported with notes: {warnings.join(' · ')}</div>}

      {imported && (
        <div className="amr-card" style={{ padding: '14px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'inline-flex', background: '#eef3fb', borderRadius: '10px', padding: '3px' }}>
              {DEVICES.map(d => (
                <button key={d.key} onClick={() => setDevice(d.key)} style={{
                  border: 0, borderRadius: '8px', padding: '7px 14px', fontWeight: 700, fontSize: '.8rem', cursor: 'pointer',
                  background: device === d.key ? '#0a1f5c' : 'transparent', color: device === d.key ? '#fff' : '#40536f' }}>{d.label}</button>
              ))}
            </div>
            <div style={{ display: 'inline-flex', background: '#eef3fb', borderRadius: '10px', padding: '3px' }}>
              {(['en', 'bn'] as const).map(l => (
                <button key={l} onClick={() => setLang(l)} style={{
                  border: 0, borderRadius: '8px', padding: '7px 12px', fontWeight: 700, fontSize: '.8rem', cursor: 'pointer',
                  background: lang === l ? '#2563eb' : 'transparent', color: lang === l ? '#fff' : '#40536f' }}>{l === 'en' ? 'EN' : 'বাংলা'}</button>
              ))}
            </div>
          </div>
          <div ref={boxRef} style={{ width: '100%', height: VIEW_H * scale + 2, overflow: 'hidden', background: '#e9eef6', borderRadius: '10px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: dev.w * scale, height: VIEW_H * scale, flex: '0 0 auto' }}>
              <iframe ref={frameRef} title="Website preview" src="/builder-preview.html"
                style={{ width: dev.w, height: VIEW_H, border: 0, background: '#fff', transform: `scale(${scale})`, transformOrigin: '0 0', display: 'block' }} />
            </div>
          </div>
          <div className="amr-sub" style={{ marginTop: '10px', fontSize: '.76rem' }}>
            {dev.label} · {dev.w}px wide{scale < 1 ? ` · shown at ${Math.round(scale * 100)}%` : ''}. Products, prices and photos are your real, live data.
          </div>
        </div>
      )}
    </div>
  );
}
