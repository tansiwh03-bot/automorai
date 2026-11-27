// Entry of builder-preview.html: the isolated page (inside an iframe) where the shared Renderer draws a site.
// It has no Supabase client and no Dashboard CSS. It only accepts messages from its parent on the same origin.
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Renderer from './Renderer';
import { validatePage, validateTheme, type PageDoc, type RenderData, type SiteTheme } from './schema';

interface Payload { theme: SiteTheme; page: PageDoc; data: RenderData & { productsLoaded?: boolean }; lang?: 'en' | 'bn'; rev: number;
  selectedId?: string; editing?: boolean; focusBlock?: string }

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
      if (m?.type === 'amr-builder-scroll') {            // editor picked a section in its list → show it
        const el = document.querySelector(`[data-sid="${String(m.sid).replace(/[^a-zA-Z0-9_-]/g, '')}"] > *`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (!m || m.type !== 'amr-builder-render') return;
      const problems = [...validateTheme(m.theme), ...validatePage(m.page)];
      if (problems.length) { setErr(problems.slice(0, 5).join('\n')); post({ type: 'amr-builder-error', problems }); return; }
      setErr('');
      setP({ theme: m.theme, page: m.page, data: m.data || { products: [], businessSlug: '' }, lang: m.lang, rev: Number(m.rev) || 0,
        selectedId: typeof m.selectedId === 'string' ? m.selectedId : '', editing: !!m.editing,
        focusBlock: typeof m.focusBlock === 'string' ? m.focusBlock : '' });
    };
    window.addEventListener('message', onMsg);
    post({ type: 'amr-builder-ready' });
    return () => window.removeEventListener('message', onMsg);
  }, []);

  useEffect(() => { if (p) post({ type: 'amr-builder-rendered', rev: p.rev }); }, [p]);

  // editing: a click on a section tells the editor which one (capture phase, before the section's own handlers)
  const editing = !!p?.editing;
  useEffect(() => {
    if (!editing) return;
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.('[data-sid]');
      if (el) post({ type: 'amr-builder-pick', sid: el.getAttribute('data-sid') });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [editing]);

  const notes: Record<string, string> = {
    cart: 'Preview mode — the cart works on your live shop.',
    product: 'Preview mode — product pages open on your live shop.',
    chat: 'Preview mode — chat works on your live shop.',
    track_order: 'Preview mode — order tracking works on your live shop.',
    newsletter: 'Preview mode — not saved.',
    external_link: 'Preview mode — links are disabled here.',
  };
  const onPreviewAction = (what: string) => {
    if (what.startsWith('page:')) { post({ type: 'amr-builder-goto', path: what.slice(5) }); return; }   // editor opens that page
    setNote(notes[what] || 'Preview mode');
    window.clearTimeout((window as unknown as { __n?: number }).__n);
    (window as unknown as { __n?: number }).__n = window.setTimeout(() => setNote(''), 2600);
  };

  if (err) return <pre style={{ padding: 20, color: '#b42318', whiteSpace: 'pre-wrap' }}>Cannot show this design:\n{err}</pre>;
  if (!p) return null;
  return (
    <>
      {/* key: a new import/remount resets slider, language and filters */}
      <Renderer key={`${p.rev}-${p.lang}`} theme={p.theme} page={p.page} data={p.data} initialLang={p.lang} onPreviewAction={onPreviewAction} selectedId={p.selectedId} focusBlock={p.focusBlock} />
      {note && (
        <div style={{ position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', zIndex: 9999, background: '#0a1f5c',
          color: '#fff', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontFamily: 'Poppins, sans-serif', boxShadow: '0 8px 24px rgba(0,0,0,.25)' }}>{note}</div>
      )}
    </>
  );
}

createRoot(document.getElementById('root')!).render(<PreviewApp />);
