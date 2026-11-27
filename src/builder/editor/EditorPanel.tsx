// Simple editor: left panel of the Website Builder. Edits the same theme + page JSON the renderer draws.
// Every change goes through `change(next, key)` so undo/redo and autosave see it.
import { createContext, useContext, useRef, useState } from 'react';
import { FONTS, safeUrl, type Block, type BoxStyle, type Device, type FontKey, type NavItem, type PageDoc, type Section, type SiteTheme, type Txt } from '../schema';
import { SPECS, LIBRARY, type Field } from './fields';
import { newId } from '../schema';
import { uploadImage } from '../api';

export interface Design { theme: SiteTheme; page: PageDoc }
type Change = (next: Design, key?: string) => void;

const DEFAULT_TRUE = new Set(['showSearch', 'showLangSwitch', 'showCart', 'showTrackOrder', 'enabled']);
const LINKS = [
  { v: '#products', l: 'Products section' }, { v: '#about', l: 'About section' }, { v: '#', l: 'Top of page' },
];
/** The site's pages, offered as link targets ("/" home, "/about-us" …). Set by the Builder tab. */
export const PageLinksCtx = createContext<{ v: string; l: string }[]>([]);
/** The shop's products (for "Featured products"). Set by the Builder tab. */
export const ProductsCtx = createContext<{ product_id: string; title: string; price: number; images?: string[] }[]>([]);

function ProductsInput({ value, onChange }: { value: unknown; onChange: (v: string[]) => void }) {
  const products = useContext(ProductsCtx);
  const ids = Array.isArray(value) ? value.map(String) : [];
  const [q, setQ] = useState('');
  const shown = products.filter(pr => !q || pr.title.toLowerCase().includes(q.toLowerCase())).slice(0, 40);
  return (
    <div>
      {ids.length > 0 && <div className="amr-ed-help" style={{ marginTop: 0, marginBottom: 6 }}>{ids.length} chosen (shown in this order)</div>}
      <input className="amr-ed-in" placeholder="Search products…" value={q} onChange={e => setQ(e.target.value)} />
      <div style={{ maxHeight: 220, overflow: 'auto', marginTop: 6, display: 'grid', gap: 4 }}>
        {shown.map(pr => {
          const on = ids.includes(pr.product_id);
          return (
            <label key={pr.product_id} className="amr-ed-toggle" style={{ fontWeight: 500 }}>
              <input type="checkbox" checked={on} disabled={!on && ids.length >= 12}
                onChange={() => onChange(on ? ids.filter(x => x !== pr.product_id) : [...ids, pr.product_id])} />
              <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pr.title} · ৳{pr.price}</span>
            </label>
          );
        })}
        {!products.length && <div className="amr-ed-help">No products found in your shop yet.</div>}
      </div>
    </div>
  );
}

// ── small inputs ──────────────────────────────────────────────────────────────
const asTxt = (t: unknown): { en: string; bn: string } =>
  t == null ? { en: '', bn: '' } : typeof t === 'string' ? { en: t, bn: t } : { en: String((t as { en?: string }).en ?? ''), bn: String((t as { bn?: string }).bn ?? '') };

function TxtInput({ value, onChange, area }: { value: unknown; onChange: (v: Txt) => void; area?: boolean }) {
  const t = asTxt(value);
  const C = area ? 'textarea' : 'input';
  return (
    <div className="amr-ed-txt">
      <label><span>EN</span><C className="amr-ed-in" value={t.en} onChange={e => onChange({ en: e.target.value, bn: t.bn })} /></label>
      <label><span>বাং</span><C className="amr-ed-in" value={t.bn} onChange={e => onChange({ en: t.en, bn: e.target.value })} /></label>
    </div>
  );
}

function ImageInput({ value, onChange, siteId }: { value: unknown; onChange: (v: string) => void; siteId: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const url = String(value ?? '');
  const shown = safeUrl(url);
  const pick = async (f: File | undefined) => {
    if (!f) return;
    setErr(''); setBusy(true);
    try { onChange(await uploadImage(siteId, f)); } catch (e) { setErr((e as Error).message); }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
  };
  return (
    <div>
      <div className="amr-ed-img">
        <div className="amr-ed-thumb" style={shown ? { backgroundImage: `url("${shown.replace(/"/g, '%22')}")` } : undefined}>{shown ? '' : 'No image'}</div>
        <div style={{ display: 'grid', gap: 6, flex: 1, minWidth: 0 }}>
          <button type="button" className="amr-ed-btn amr-ed-btn-blue" disabled={busy} onClick={() => fileRef.current?.click()}>{busy ? 'Uploading…' : 'Upload image'}</button>
          {url && <button type="button" className="amr-ed-btn" onClick={() => onChange('')}>Remove</button>}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={e => pick(e.target.files?.[0])} />
      </div>
      <input className="amr-ed-in" placeholder="…or paste an image link (https://)" value={url} onChange={e => onChange(e.target.value)} style={{ marginTop: 6 }} />
      {url && !shown && <div className="amr-ed-warn">Only https:// links are shown.</div>}
      {err && <div className="amr-ed-warn">{err}</div>}
    </div>
  );
}

function LinkInput({ value, onChange }: { value: unknown; onChange: (v: string) => void }) {
  const v = String(value ?? '');
  const pageLinks = useContext(PageLinksCtx);
  const all = [...pageLinks, ...LINKS];
  const preset = all.some(x => x.v === v) ? v : 'custom';
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <select className="amr-ed-in" value={preset} onChange={e => onChange(e.target.value === 'custom' ? 'https://' : e.target.value)}>
        {pageLinks.length > 0 && <optgroup label="Pages">{pageLinks.map(x => <option key={x.v} value={x.v}>{x.l}</option>)}</optgroup>}
        <optgroup label="On this page">{LINKS.map(x => <option key={x.v} value={x.v}>{x.l}</option>)}</optgroup>
        <option value="custom">Other link…</option>
      </select>
      {preset === 'custom' && <input className="amr-ed-in" value={v} onChange={e => onChange(e.target.value)} placeholder="https://…" />}
      {preset === 'custom' && v && !safeUrl(v) && <div className="amr-ed-warn">Link must start with https:// or #</div>}
    </div>
  );
}

function FieldInput({ f, value, onChange, siteId }: { f: Field; value: unknown; onChange: (v: unknown) => void; siteId: string }) {
  switch (f.kind) {
    case 'txt': return <TxtInput value={value} onChange={onChange} />;
    case 'txtarea': return <TxtInput value={value} onChange={onChange} area />;
    case 'text': return <input className="amr-ed-in" value={String(value ?? '')} onChange={e => onChange(e.target.value)} />;
    case 'textarea': return <textarea className="amr-ed-in" rows={3} value={String(value ?? '')} onChange={e => onChange(e.target.value)} />;
    case 'image': return <ImageInput value={value} onChange={onChange} siteId={siteId} />;
    case 'link': return <LinkInput value={value} onChange={onChange} />;
    case 'toggle': {
      const on = DEFAULT_TRUE.has(f.key) ? value !== false : !!value;
      return <label className="amr-ed-toggle"><input type="checkbox" checked={on} onChange={e => onChange(e.target.checked)} /> {on ? 'On' : 'Off'}</label>;
    }
    case 'number': {
      const sc = f.scale || 1;
      const n = value == null || value === '' ? '' : Math.round(Number(value) / sc);
      return <input className="amr-ed-in" type="number" min={f.min} max={f.max} value={n} style={{ maxWidth: 120 }}
        onChange={e => {
          if (e.target.value === '') return onChange(undefined);
          const x = Math.max(f.min ?? -1e9, Math.min(f.max ?? 1e9, Number(e.target.value) || 0));
          onChange(x * sc);
        }} />;
    }
    case 'select':
      return <select className="amr-ed-in" value={String(value ?? '')} onChange={e => onChange(e.target.value || undefined)}>
        {(f.options || []).map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>;
    case 'products': return <ProductsInput value={value} onChange={onChange} />;
    case 'datetime':
      return <input className="amr-ed-in" type="datetime-local" value={String(value ?? '')} onChange={e => onChange(e.target.value)} />;
    case 'tags': {
      const list = Array.isArray(value) ? value.map(String) : [];
      return <input className="amr-ed-in" defaultValue={list.join(', ')} key={list.join('|')}
        onBlur={e => onChange(e.target.value.split(',').map(x => x.trim()).filter(Boolean).slice(0, 20))} />;
    }
  }
}

function FieldRow({ f, props, set, siteId }: { f: Field; props: Record<string, unknown>; set: (k: string, v: unknown) => void; siteId: string }) {
  return (
    <div className="amr-ed-field">
      <div className="amr-ed-label">{f.label}</div>
      <FieldInput f={f} value={props[f.key]} onChange={v => set(f.key, v)} siteId={siteId} />
      {f.help && <div className="amr-ed-help">{f.help}</div>}
    </div>
  );
}

// ── design helpers ────────────────────────────────────────────────────────────
const zones = (d: Design) => [d.theme.globals.before, d.page.sections, d.theme.globals.after];
export const findSection = (d: Design, id: string): Section | undefined => zones(d).flat().find(s => s.id === id);

function mapSection(d: Design, id: string, fn: (s: Section) => Section): Design {
  const m = (list: Section[]) => list.map(s => (s.id === id ? fn(s) : s));
  return {
    theme: { ...d.theme, globals: { before: m(d.theme.globals.before), after: m(d.theme.globals.after) } },
    page: { ...d.page, sections: m(d.page.sections) },
  };
}
const move = <T,>(list: T[], i: number, dir: -1 | 1): T[] => {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const out = list.slice(); [out[i], out[j]] = [out[j], out[i]]; return out;
};

// ── style (per device) ────────────────────────────────────────────────────────
function StylePanel({ s, device, update }: { s: Section; device: Device; update: (fn: (s: Section) => Section, key: string) => void }) {
  const slot = device === 'desktop' ? 'base' : device;
  const cur: Partial<BoxStyle> = (s.style?.[slot] as Partial<BoxStyle>) || {};
  const setStyle = (k: keyof BoxStyle, v: unknown) => update(x => {
    const st = { ...(x.style || {}) } as Record<string, Partial<BoxStyle>>;
    const next = { ...(st[slot] || {}) } as Record<string, unknown>;
    if (v === undefined || v === '') delete next[k]; else next[k] = v;
    st[slot] = next as Partial<BoxStyle>;
    return { ...x, style: st };
  }, `style:${s.id}:${slot}:${k}`);
  const hidden = !!s.hidden?.[device];
  const devName = device === 'desktop' ? 'Desktop' : device === 'tablet' ? 'Tablet' : 'Mobile';
  return (
    <div className="amr-ed-box">
      <div className="amr-ed-boxtitle">Layout on {devName}{device === 'desktop' ? ' (and all devices unless changed)' : ''}</div>
      <div className="amr-ed-help" style={{ marginTop: 0 }}>Switch Desktop / Tablet / Mobile above the preview to edit another device.</div>
      <label className="amr-ed-toggle" style={{ margin: '8px 0' }}>
        <input type="checkbox" checked={hidden} onChange={e => update(x => ({ ...x, hidden: { ...(x.hidden || {}), [device]: e.target.checked } }), `hide:${s.id}:${device}`)} />
        Hide this section on {devName}
      </label>
      <div className="amr-ed-grid2">
        <div><div className="amr-ed-label">Space above (px)</div>
          <input className="amr-ed-in" type="number" min={0} max={400} value={cur.paddingTop ?? ''} placeholder="auto"
            onChange={e => setStyle('paddingTop', e.target.value === '' ? undefined : Math.max(0, Math.min(400, Number(e.target.value) || 0)))} /></div>
        <div><div className="amr-ed-label">Space below (px)</div>
          <input className="amr-ed-in" type="number" min={0} max={400} value={cur.paddingBottom ?? ''} placeholder="auto"
            onChange={e => setStyle('paddingBottom', e.target.value === '' ? undefined : Math.max(0, Math.min(400, Number(e.target.value) || 0)))} /></div>
      </div>
      <div className="amr-ed-grid2" style={{ marginTop: 8 }}>
        <div><div className="amr-ed-label">Background</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(cur.background || '') ? cur.background : '#ffffff'} onChange={e => setStyle('background', e.target.value)} />
            {cur.background ? <button type="button" className="amr-ed-btn" onClick={() => setStyle('background', undefined)}>Reset</button> : <span className="amr-ed-help" style={{ margin: 0 }}>default</span>}
          </div></div>
        <div><div className="amr-ed-label">Text align</div>
          <select className="amr-ed-in" value={cur.textAlign || ''} onChange={e => setStyle('textAlign', e.target.value || undefined)}>
            <option value="">default</option><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
          </select></div>
      </div>
    </div>
  );
}

// ── header menu ───────────────────────────────────────────────────────────────
function NavEditor({ nav, set }: { nav: NavItem[]; set: (n: NavItem[]) => void }) {
  return (
    <div className="amr-ed-box">
      <div className="amr-ed-boxtitle">Menu links</div>
      {nav.map((it, i) => (
        <div key={i} className="amr-ed-item">
          <div className="amr-ed-itemhead">
            <b>{asTxt(it.label).en || 'Link'}</b>
            <span>
              <button type="button" className="amr-ed-ic" title="Move up" disabled={i === 0} onClick={() => set(move(nav, i, -1))}>↑</button>
              <button type="button" className="amr-ed-ic" title="Move down" disabled={i === nav.length - 1} onClick={() => set(move(nav, i, 1))}>↓</button>
              <button type="button" className="amr-ed-ic" title="Remove" onClick={() => set(nav.filter((_, j) => j !== i))}>✕</button>
            </span>
          </div>
          <TxtInput value={it.label} onChange={v => set(nav.map((x, j) => (j === i ? { ...x, label: v } : x)))} />
          <div style={{ marginTop: 6 }}><LinkInput value={it.link} onChange={v => set(nav.map((x, j) => (j === i ? { ...x, link: v } : x)))} /></div>
          {!!it.children?.length && <div className="amr-ed-help">{it.children.length} sub-link(s) kept as they are.</div>}
        </div>
      ))}
      {nav.length < 8 && <button type="button" className="amr-ed-btn" onClick={() => set([...nav, { label: { en: 'New link', bn: 'নতুন লিংক' }, link: '#', children: [] }])}>+ Add menu link</button>}
    </div>
  );
}

// ── blocks (slides, categories, cards…) ───────────────────────────────────────
function BlocksEditor({ s, update, siteId, open, setOpen }: { s: Section; update: (fn: (s: Section) => Section, key: string) => void; siteId: string;
  open: string; setOpen: (id: string) => void }) {
  const spec = SPECS[s.type].blocks!;
  const blocks = s.blocks || [];
  const setBlocks = (b: Block[], key: string) => update(x => ({ ...x, blocks: b }), key);
  const kindOf = (b: Block) => spec.kinds?.find(k => k.type === b.type);
  const nCols = s.type === 'columns' ? Math.max(1, Math.min(3, Number(s.props.columns) || 1)) : 1;
  const colField: Field = { key: 'col', label: 'Column', kind: 'select', options: Array.from({ length: nCols }, (_, i) => ({ v: String(i), l: ['Left', 'Middle', 'Right'][nCols === 2 && i === 1 ? 2 : i] + ' column' })) };
  const dup = (b: Block, i: number) => { const c = { ...JSON.parse(JSON.stringify(b)), id: newId('el') } as Block; const l = blocks.slice(); l.splice(i + 1, 0, c); setBlocks(l, `blkdup:${c.id}`); setOpen(c.id); };
  const [adding, setAdding] = useState(false);
  return (
    <div className="amr-ed-box">
      <div className="amr-ed-boxtitle">{spec.kinds ? 'Elements' : spec.label + 's'} ({blocks.length})</div>
      {blocks.map((b, i) => {
        const locked = s.type === 'categories' && i === 0;      // first tile = "All products"
        return (
          <div key={b.id} className="amr-ed-item">
            <div className="amr-ed-itemhead">
              <button type="button" className="amr-ed-link" onClick={() => setOpen(open === b.id ? '' : b.id)}>{open === b.id ? '▾' : '▸'} {spec.title(b)}</button>
              <span>
                <button type="button" className="amr-ed-ic" title="Move up" disabled={i === 0 || locked || (s.type === 'categories' && i === 1)} onClick={() => setBlocks(move(blocks, i, -1), `blk:${s.id}`)}>↑</button>
                <button type="button" className="amr-ed-ic" title="Move down" disabled={i === blocks.length - 1 || locked} onClick={() => setBlocks(move(blocks, i, 1), `blk:${s.id}`)}>↓</button>
                {blocks.length < spec.max && !locked && <button type="button" className="amr-ed-ic" title="Duplicate" onClick={() => dup(b, i)}>⧉</button>}
                <button type="button" className="amr-ed-ic" title="Remove" disabled={blocks.length <= spec.min || locked}
                  onClick={() => { if (window.confirm(`Remove this ${spec.label.toLowerCase()}? You can undo.`)) setBlocks(blocks.filter(x => x.id !== b.id), `blk:${s.id}`); }}>✕</button>
              </span>
            </div>
            {open === b.id && (
              <div style={{ marginTop: 8 }}>
                {[...(nCols > 1 ? [colField] : []), ...(kindOf(b)?.fields || spec.fields)].filter(f => !(locked && f.key === 'match')).map(f => (
                  <FieldRow key={f.key} f={f} props={b.props} siteId={siteId}
                    set={(k, v) => setBlocks(blocks.map(x => (x.id === b.id ? { ...x, props: { ...x.props, [k]: k === 'col' ? Number(v) || 0 : v } } : x)), `bp:${b.id}:${k}`)} />
                ))}
                {locked && <div className="amr-ed-help">This first tile shows all products.</div>}
              </div>
            )}
          </div>
        );
      })}
      {blocks.length < spec.max && !spec.kinds && (
        <button type="button" className="amr-ed-btn" onClick={() => { const nb = spec.make(); setBlocks([...blocks, nb], `blkadd:${nb.id}`); setOpen(nb.id); }}>+ Add {spec.label.toLowerCase()}</button>
      )}
      {blocks.length < spec.max && spec.kinds && (!adding
        ? <button type="button" className="amr-ed-btn" onClick={() => setAdding(true)}>+ Add element</button>
        : <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {spec.kinds.map(k => <button key={k.type} type="button" className="amr-ed-btn" style={{ textAlign: 'left' }}
              onClick={() => { const nb = k.make(); nb.props = { ...nb.props, col: nCols - 1 }; setBlocks([...blocks, nb], `blkadd:${nb.id}`); setOpen(nb.id); setAdding(false); }}>{k.icon} {k.label}</button>)}
            <button type="button" className="amr-ed-link" onClick={() => setAdding(false)}>Cancel</button>
          </div>)}
    </div>
  );
}

/** What a merchant sees in the section list: "2 columns", "▶️ Video", "🔠 Heading: Big sale" … */
function rowLabel(s: Section): string {
  const spec = SPECS[s.type];
  if (s.type !== 'columns') return `${spec.icon} ${spec.label}`;
  const n = Number(s.props.columns) || 1;
  if (n > 1) return `${n === 2 ? '◫' : '▥'} ${n} columns`;
  const first = (s.blocks || [])[0];
  const kind = spec.blocks?.kinds?.find(k => k.type === first?.type);
  if (!kind) return `${spec.icon} Empty block`;
  const t = asTxt(first.props.text ?? first.props.label).en;
  return `${kind.icon} ${kind.label}${t ? ': ' + t.slice(0, 26) : ''}${(s.blocks || []).length > 1 ? ' +' + ((s.blocks || []).length - 1) : ''}`;
}

// ── main panel ────────────────────────────────────────────────────────────────
interface Props {
  design: Design; change: Change; siteId: string; device: Device;
  selected: string; setSelected: (id: string) => void;
  openBlock: string; setOpenBlock: (id: string) => void;
}

export default function EditorPanel({ design, change, siteId, device, selected, setSelected, openBlock, setOpenBlock }: Props) {
  const [adding, setAdding] = useState(false);
  const dragFrom = useRef(-1);
  const [dragOver, setDragOver] = useState(-1);
  const { theme, page } = design;
  const sel = selected ? findSection(design, selected) : undefined;
  const update = (fn: (s: Section) => Section, key: string) => { if (sel) change(mapSection(design, sel.id, fn), key); };

  const pageOps = {
    move: (i: number, dir: -1 | 1) => change({ theme, page: { ...page, sections: move(page.sections, i, dir) } }, `move:${page.sections[i].id}`),
    remove: (id: string) => {
      if (!window.confirm('Remove this section from the page? You can undo.')) return;
      change({ theme, page: { ...page, sections: page.sections.filter(s => s.id !== id) } }, `rm:${id}`);
      if (selected === id) setSelected('');
    },
    duplicate: (id: string) => {
      const i = page.sections.findIndex(x => x.id === id); if (i < 0) return;
      const src = page.sections[i];
      const copy: Section = { ...JSON.parse(JSON.stringify(src)), id: newId(src.type.slice(0, 5)) };
      copy.blocks = (copy.blocks || []).map(b => ({ ...b, id: newId('b') }));
      const list = page.sections.slice(); list.splice(i + 1, 0, copy);
      change({ theme, page: { ...page, sections: list } }, `dup:${copy.id}`);   // stay in the list; the copy sits right below
    },
    reorder: (from: number, to: number) => {
      if (from === to || from < 0 || to < 0) return;
      const list = page.sections.slice(); const [m] = list.splice(from, 1); list.splice(to, 0, m);
      change({ theme, page: { ...page, sections: list } }, `drag:${m.id}`);
    },
    addMade: (s: Section) => {
      const at = page.sections.findIndex(x => x.id === selected);
      const list = page.sections.slice(); list.splice(at >= 0 ? at + 1 : list.length, 0, s);
      change({ theme, page: { ...page, sections: list } }, `add:${s.id}`);
      setSelected(s.id); setAdding(false);
    },
    add: (type: keyof typeof SPECS) => {
      const s = SPECS[type].addable!.make();
      const at = page.sections.findIndex(x => x.id === selected);
      const list = page.sections.slice(); list.splice(at >= 0 ? at + 1 : list.length, 0, s);
      change({ theme, page: { ...page, sections: list } }, `add:${s.id}`);
      setSelected(s.id); setAdding(false);
    },
  };
  const count = (t: string) => page.sections.filter(s => s.type === t).length;

  const Row = ({ s, i }: { s: Section; i?: number }) => {
    const spec = SPECS[s.type];
    const hiddenOn = (['desktop', 'tablet', 'mobile'] as Device[]).filter(d => s.hidden?.[d]);
    const drag = i !== undefined ? {
      draggable: true,
      onDragStart: (e: React.DragEvent) => { dragFrom.current = i; e.dataTransfer.effectAllowed = 'move'; },
      onDragOver: (e: React.DragEvent) => { e.preventDefault(); setDragOver(i); },
      onDragLeave: () => setDragOver(-1),
      onDrop: (e: React.DragEvent) => { e.preventDefault(); setDragOver(-1); pageOps.reorder(dragFrom.current, i); dragFrom.current = -1; },
    } : {};
    return (
      <div className={'amr-ed-row' + (selected === s.id ? ' on' : '') + (dragOver === i ? ' drop' : '')} onClick={() => setSelected(s.id)} {...drag}
        title={i !== undefined ? 'Drag to move' : undefined}>
        <span className="amr-ed-rowname">{rowLabel(s)}{hiddenOn.length ? <em> · hidden on {hiddenOn.join(', ')}</em> : null}</span>
        {i !== undefined && (
          <span onClick={e => e.stopPropagation()}>
            <button type="button" className="amr-ed-ic" title="Move up" disabled={i === 0} onClick={() => pageOps.move(i, -1)}>↑</button>
            <button type="button" className="amr-ed-ic" title="Move down" disabled={i === page.sections.length - 1} onClick={() => pageOps.move(i, 1)}>↓</button>
            <button type="button" className="amr-ed-ic" title="Duplicate" disabled={!!spec.addable && count(s.type) >= spec.addable.max} onClick={() => pageOps.duplicate(s.id)}>⧉</button>
            <button type="button" className="amr-ed-ic" title="Remove section" onClick={() => pageOps.remove(s.id)}>✕</button>
          </span>
        )}
      </div>
    );
  };

  if (sel) {
    const spec = SPECS[sel.type];
    const setProp = (k: string, v: unknown) => update(x => ({ ...x, props: { ...x.props, [k]: v } }), `p:${sel.id}:${k}`);
    return (
      <div className="amr-ed">
        <button type="button" className="amr-ed-link" onClick={() => setSelected('')}>← All sections</button>
        <div className="amr-ed-title">{spec.icon} {spec.label}</div>
        {spec.fields.map(f => <FieldRow key={f.key} f={f} props={sel.props} set={setProp} siteId={siteId} />)}
        {sel.type === 'header' && <NavEditor nav={(sel.props.nav as NavItem[]) || []} set={n => setProp('nav', n)} />}
        {spec.blocks && <BlocksEditor s={sel} update={update} siteId={siteId} open={openBlock} setOpen={setOpenBlock} />}
        <StylePanel s={sel} device={device} update={update} />
      </div>
    );
  }

  return (
    <div className="amr-ed">
      <div className="amr-ed-box">
        <div className="amr-ed-boxtitle">Colors & font</div>
        <div className="amr-ed-grid2">
          <div><div className="amr-ed-label">Main color</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="color" value={theme.accent} onChange={e => change({ theme: { ...theme, accent: e.target.value.toLowerCase() }, page }, 'accent')} />
              <code style={{ fontSize: '.78rem' }}>{theme.accent}</code>
            </div></div>
          <div><div className="amr-ed-label">Font</div>
            <select className="amr-ed-in" value={theme.font || 'poppins-hind'} onChange={e => change({ theme: { ...theme, font: e.target.value as FontKey }, page }, 'font')}>
              {(Object.keys(FONTS) as FontKey[]).map(k => <option key={k} value={k}>{FONTS[k].label}</option>)}
            </select></div>
        </div>
      </div>

      <div className="amr-ed-group">Top of every page</div>
      {theme.globals.before.map(s => <Row key={s.id} s={s} />)}
      <div className="amr-ed-group">Home page sections</div>
      {page.sections.map((s, i) => <Row key={s.id} s={s} i={i} />)}
      {!adding ? (
        <button type="button" className="amr-ed-btn amr-ed-btn-blue" style={{ width: '100%', marginTop: 6 }} onClick={() => setAdding(true)}>+ Add section</button>
      ) : (
        <div className="amr-ed-box">
          <div className="amr-ed-boxtitle">Add a section {selected ? '(after the selected one)' : '(at the end)'}</div>
          {[...new Set(LIBRARY.map(x => x.group))].map(g => (
            <div key={g}>
              <div className="amr-ed-group" style={{ marginTop: 4 }}>{g}</div>
              <div className="amr-ed-lib">
                {LIBRARY.filter(x => x.group === g).map(x => {
                  const full = count(x.type) >= (SPECS[x.type].addable?.max ?? 99);
                  return (
                    <button key={x.key} type="button" className="amr-ed-libitem" disabled={full} onClick={() => pageOps.addMade(x.make())}
                      title={full ? 'Already on this page' : x.desc}>
                      <span className="amr-ed-libic">{x.icon}</span><b>{x.label}</b><span>{full ? 'Already on this page' : x.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <button type="button" className="amr-ed-link" onClick={() => setAdding(false)}>Cancel</button>
        </div>
      )}
      <div className="amr-ed-group">Bottom of every page</div>
      {theme.globals.after.map(s => <Row key={s.id} s={s} />)}
    </div>
  );
}

export const EDITOR_CSS = `
.amr-ed{display:grid;gap:8px;font-size:.84rem;color:#12284c}
.amr-ed-title{font-weight:800;font-size:1.02rem;margin:4px 0 6px}
.amr-ed-group{font-size:.7rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#6b7c97;margin-top:8px}
.amr-ed-row{display:flex;justify-content:space-between;align-items:center;gap:6px;padding:9px 10px;border:1px solid #dfe7f3;border-radius:10px;background:#fff;cursor:pointer}
.amr-ed-row:hover{border-color:#93b4f5}.amr-ed-row.drop{border-color:#06b6d4;box-shadow:0 -3px 0 #06b6d4}
.amr-ed-lib{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px}
.amr-ed-libitem{display:grid;grid-template-columns:auto 1fr;column-gap:8px;align-items:center;text-align:left;border:1px solid #dfe7f3;background:#fff;border-radius:10px;padding:8px;cursor:pointer;color:#12284c;font:inherit}
.amr-ed-libitem:hover{border-color:#2563eb}.amr-ed-libitem:disabled{opacity:.45;cursor:default}
.amr-ed-libitem b{font-size:.8rem}.amr-ed-libitem span:last-child{grid-column:2;font-size:.68rem;color:#6b7c97;line-height:1.3}
.amr-ed-libic{grid-row:span 2;font-size:1.2rem}.amr-ed-row.on{border-color:#2563eb;box-shadow:0 0 0 2px #2563eb22}
.amr-ed-rowname{font-weight:700;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.amr-ed-rowname em{font-weight:500;color:#b45309;font-style:normal}
.amr-ed-ic{border:1px solid #dfe7f3;background:#fff;border-radius:7px;width:28px;height:28px;cursor:pointer;margin-left:3px;color:#0a1f5c}
.amr-ed-ic:disabled{opacity:.35;cursor:default}
.amr-ed-btn{border:1px solid #cfdbee;background:#fff;color:#0a1f5c;border-radius:9px;padding:8px 12px;font-weight:700;cursor:pointer;font-size:.8rem}
.amr-ed-btn:disabled{opacity:.5;cursor:default}
.amr-ed-btn-blue{background:#2563eb;border-color:#2563eb;color:#fff}
.amr-ed-link{border:0;background:none;color:#2563eb;font-weight:700;cursor:pointer;padding:2px 0;text-align:left;font-size:.82rem}
.amr-ed-box{border:1px solid #dfe7f3;border-radius:12px;padding:12px;background:#f8fafd;display:grid;gap:6px}
.amr-ed-boxtitle{font-weight:800}
.amr-ed-item{border:1px solid #e3eaf5;border-radius:10px;padding:8px;background:#fff}
.amr-ed-itemhead{display:flex;justify-content:space-between;align-items:center;gap:6px}
.amr-ed-field{margin-bottom:10px}
.amr-ed-label{font-weight:700;font-size:.76rem;color:#40536f;margin-bottom:4px}
.amr-ed-help{font-size:.72rem;color:#6b7c97;margin-top:4px}
.amr-ed-warn{font-size:.74rem;color:#b42318;margin-top:4px}
.amr-ed-in{width:100%;box-sizing:border-box;border:1px solid #cfdbee;border-radius:8px;padding:7px 9px;font:inherit;font-size:.84rem;background:#fff;color:#12284c}
textarea.amr-ed-in{resize:vertical;min-height:56px}
.amr-ed-in:focus{outline:2px solid #06b6d4;border-color:#06b6d4}
.amr-ed-txt{display:grid;gap:5px}.amr-ed-txt label{display:flex;gap:6px;align-items:flex-start}
.amr-ed-txt label span{flex:0 0 30px;font-size:.7rem;font-weight:800;color:#0b84ad;padding-top:9px}
.amr-ed-toggle{display:flex;gap:8px;align-items:center;font-weight:600;cursor:pointer}
.amr-ed-img{display:flex;gap:10px;align-items:center}
.amr-ed-thumb{flex:0 0 84px;height:60px;border-radius:8px;border:1px solid #dfe7f3;background:#eef3fb center/cover no-repeat;display:flex;align-items:center;justify-content:center;font-size:.68rem;color:#6b7c97}
.amr-ed-grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
`;
