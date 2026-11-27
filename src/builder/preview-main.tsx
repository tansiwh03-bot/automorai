// Entry of builder-preview.html: the isolated page (inside an iframe) where the shared Renderer draws a site.
// It has no Supabase client and no Dashboard CSS. It only accepts messages from its parent on the same origin.
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Renderer from './Renderer';
import { validatePage, validateTheme, type PageDoc, type RenderData, type SiteTheme } from './schema';

interface Payload { theme: SiteTheme; page: PageDoc; data: RenderData & { productsLoaded?: boolean }; lang?: 'en' | 'bn'; rev: number }

const post = (msg: Record<string, unknown>) => {
  if (window.parent !== window) window.parent.postMessage(msg, window.location.origin);
};

function PreviewApp() {
  const [p, setP] = useState<Payload | null>(null);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      const m = e.data;
      if (!m || m.type !== 'amr-builder-render') return;
      const problems = [...validateTheme(m.theme), ...validatePage(m.page)];
      if (problems.length) { setErr(problems.slice(0, 5).join('\n')); post({ type: 'amr-builder-error', problems }); return; }
      setErr('');
      setP({ theme: m.theme, page: m.page, data: m.data || { products: [], businessSlug: '' }, lang: m.lang, rev: Number(m.rev) || 0 });
    };
    window.addEventListener('message', onMsg);
    post({ type: 'amr-builder-ready' });
    return () => window.removeEventListener('message', onMsg);
  }, []);

  useEffect(() => { if (p) post({ type: 'amr-builder-rendered', rev: p.rev }); }, [p]);

  const notes: Record<string, string> = {
    cart: 'Preview mode — the cart works on your live shop.',
    product: 'Preview mode — product pages open on your live shop.',
    chat: 'Preview mode — chat works on your live shop.',
    track_order: 'Preview mode — order tracking works on your live shop.',
    newsletter: 'Preview mode — not saved.',
    external_link: 'Preview mode — links are disabled here.',
  };
  const onPreviewAction = (what: string) => {
    setNote(notes[what] || 'Preview mode');
    window.clearTimeout((window as unknown as { __n?: number }).__n);
    (window as unknown as { __n?: number }).__n = window.setTimeout(() => setNote(''), 2600);
  };

  if (err) return <pre style={{ padding: 20, color: '#b42318', whiteSpace: 'pre-wrap' }}>Cannot show this design:\n{err}</pre>;
  if (!p) return null;
  return (
    <>
      {/* key: a new import/remount resets slider, language and filters */}
      <Renderer key={`${p.rev}-${p.lang}`} theme={p.theme} page={p.page} data={p.data} initialLang={p.lang} onPreviewAction={onPreviewAction} />
      {note && (
        <div style={{ position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', zIndex: 9999, background: '#0a1f5c',
          color: '#fff', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontFamily: 'Poppins, sans-serif', boxShadow: '0 8px 24px rgba(0,0,0,.25)' }}>{note}</div>
      )}
    </>
  );
}

createRoot(document.getElementById('root')!).render(<PreviewApp />);
