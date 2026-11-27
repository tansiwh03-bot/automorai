// Block Library sections (Phase 6). Every block is plain data (texts, links, images) drawn by these components —
// no HTML or script from the merchant. Shop parts (product cards, product page, cart, checkout) stay the shop's own:
// Featured Products only marks WHICH products to show; on the live shop the shop's own card code draws them.
import { useEffect, useState } from 'react';
import { txt, safeUrl, type Block, type Section, type Txt } from '../schema';
import { useRender, fmtPrice } from '../context';

const paras = (t: string) => t.split(/\n\s*\n/).map(x => x.trim()).filter(Boolean);
const bgUrl = (u: string) => `url("${u.replace(/"/g, '%22')}")`;

/** Only YouTube / Vimeo, turned into their privacy-friendly embed address; anything else → ''. */
export function videoEmbed(url: unknown): string {
  const u = String(url || '').trim();
  let m = u.match(/^https:\/\/(?:www\.|m\.)?youtube\.com\/watch\?(?:[^#]*&)?v=([A-Za-z0-9_-]{6,20})/) || u.match(/^https:\/\/youtu\.be\/([A-Za-z0-9_-]{6,20})/)
    || u.match(/^https:\/\/(?:www\.)?youtube\.com\/(?:shorts|embed)\/([A-Za-z0-9_-]{6,20})/);
  if (m) return `https://www.youtube-nocookie.com/embed/${m[1]}`;
  m = u.match(/^https:\/\/(?:www\.)?vimeo\.com\/(\d{4,12})/) || u.match(/^https:\/\/player\.vimeo\.com\/video\/(\d{4,12})/);
  if (m) return `https://player.vimeo.com/video/${m[1]}`;
  return '';
}

function Link({ href, className, children, style }: { href: string; className?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  const r = useRender();
  const h = safeUrl(href) || '#';
  return <a className={className} style={style} href={h} onClick={e => {
    if (/^https?:/.test(h)) { e.preventDefault(); r.onPreviewAction('external_link'); }
    else if (/^\/[a-z0-9-]*$/.test(h)) { e.preventDefault(); r.onPreviewAction('page:' + h); }
    else if (h.startsWith('#') && h.length > 1) { e.preventDefault(); document.getElementById(h.slice(1))?.scrollIntoView({ behavior: 'smooth' }); }
  }}>{children}</a>;
}

// ── Column section: small elements in 1–3 columns ────────────────────────────
function Element({ b }: { b: Block }) {
  const r = useRender();
  const p = b.props as Record<string, unknown>;
  const align = ['left', 'center', 'right'].includes(String(p.align)) ? String(p.align) as 'left' : undefined;
  switch (b.type) {
    case 'el_heading': {
      const size = ['s', 'm', 'l'].includes(String(p.size)) ? String(p.size) : 'm';
      return <div className={`amr-el-h amr-el-h-${size}`} style={{ textAlign: align }}>{txt(p.text as Txt, r.lang)}</div>;
    }
    case 'el_text':
      return <div className="amr-el-text" style={{ textAlign: align }}>{paras(txt(p.text as Txt, r.lang)).map((x, i) => <p key={i}>{x}</p>)}</div>;
    case 'el_image': {
      const src = safeUrl(p.img);
      if (!src) return <div className="amr-el-empty">🖼️ {r.lang === 'bn' ? 'ছবি দিন' : 'Add an image'}</div>;
      const img = <img className={'amr-el-img' + (p.round ? ' amr-el-img-round' : '')} src={src} alt={txt(p.alt as Txt, r.lang)} loading="lazy" />;
      return p.link ? <Link href={String(p.link)}>{img}</Link> : img;
    }
    case 'el_video': {
      const src = videoEmbed(p.url);
      if (!src) return <div className="amr-el-empty">▶️ {r.lang === 'bn' ? 'YouTube বা Vimeo লিংক দিন' : 'Add a YouTube or Vimeo link'}</div>;
      return <div className="amr-el-video"><iframe src={src} title="Video" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen /></div>;
    }
    case 'el_button': {
      const outline = p.style === 'outline';
      return <div style={{ textAlign: align }}><Link className={outline ? 'amr-el-btn amr-el-btn-outline' : 'amr-el-btn'} href={String(p.link || '#products')}>{txt(p.label as Txt, r.lang)}</Link></div>;
    }
    case 'el_spacer':
      return <div style={{ height: Math.max(4, Math.min(200, Number(p.height) || 24)) }} />;
    default:
      return null;
  }
}

export function Columns({ s }: { s: Section }) {
  const p = s.props as { columns?: number; mobileColumns?: number; vAlign?: string };
  const n = [1, 2, 3].includes(Number(p.columns)) ? Number(p.columns) : 1;
  const cols: Block[][] = Array.from({ length: n }, () => []);
  for (const b of s.blocks || []) cols[Math.min(n - 1, Math.max(0, Number((b.props as { col?: number }).col) || 0))].push(b);
  return (
    <section className="amr-cols-sec"><div className={`container amr-cols amr-cols-${n}${Number(p.mobileColumns) === 2 && n > 1 ? ' amr-cols-m2' : ''}`}
      style={{ alignItems: p.vAlign === 'center' ? 'center' : 'start' }}>
      {cols.map((list, i) => <div className="amr-col" key={i}>{list.map(b => <Element key={b.id} b={b} />)}</div>)}
    </div></section>
  );
}

// ── Hero banner (one big image) ──────────────────────────────────────────────
export function Banner({ s }: { s: Section }) {
  const r = useRender();
  const p = s.props as { img?: string; title?: Txt; text?: Txt; cta?: Txt; link?: string; align?: string; height?: string; dark?: number };
  const img = safeUrl(p.img);
  const h = ['s', 'm', 'l'].includes(String(p.height)) ? String(p.height) : 'm';
  const dark = Math.max(0, Math.min(80, Number(p.dark ?? 40)));
  return (
    <section className={`amr-banner amr-banner-${h}${p.align === 'center' ? ' amr-banner-center' : ''}`} style={img ? { backgroundImage: bgUrl(img) } : undefined}>
      <div className="amr-banner-shade" style={{ background: `rgba(0,0,0,${dark / 100})` }} />
      <div className="container amr-banner-in">
        {txt(p.title, r.lang) && <h2 className="amr-banner-title">{txt(p.title, r.lang)}</h2>}
        {txt(p.text, r.lang) && <p className="amr-banner-text">{txt(p.text, r.lang)}</p>}
        {txt(p.cta, r.lang) && <Link className="btn-primary" href={p.link || '#products'}>{txt(p.cta, r.lang)}</Link>}
      </div>
    </section>
  );
}

// ── Image gallery ────────────────────────────────────────────────────────────
export function Gallery({ s }: { s: Section }) {
  const r = useRender();
  const p = s.props as { heading?: Txt; columns?: number };
  const n = [2, 3, 4].includes(Number(p.columns)) ? Number(p.columns) : 3;
  const items = (s.blocks || []).map(b => b.props as { img?: string; caption?: Txt }).filter(it => safeUrl(it.img));
  return (
    <section className="amr-gallery"><div className="container">
      {txt(p.heading, r.lang) && <div className="section-heading" style={{ marginBottom: 24 }}>{txt(p.heading, r.lang)}</div>}
      <div className={`amr-gallery-grid amr-gallery-${n}`}>
        {items.map((it, i) => (
          <figure key={i} className="amr-gallery-item"><img src={safeUrl(it.img)} alt={txt(it.caption, r.lang)} loading="lazy" />
            {txt(it.caption, r.lang) && <figcaption>{txt(it.caption, r.lang)}</figcaption>}</figure>
        ))}
        {!items.length && <div className="amr-el-empty">🖼️ {r.lang === 'bn' ? 'গ্যালারিতে ছবি দিন' : 'Add photos to the gallery'}</div>}
      </div>
    </div></section>
  );
}

// ── Offers ───────────────────────────────────────────────────────────────────
export function Offers({ s }: { s: Section }) {
  const r = useRender();
  const p = s.props as { heading?: Txt };
  const items = (s.blocks || []).map(b => b.props as { img?: string; badge?: Txt; title?: Txt; text?: Txt; cta?: Txt; link?: string });
  return (
    <section className="amr-offers"><div className="container">
      {txt(p.heading, r.lang) && <div className="section-heading" style={{ marginBottom: 24 }}>{txt(p.heading, r.lang)}</div>}
      <div className="amr-offers-grid">
        {items.map((it, i) => (
          <div className="amr-offer" key={i}>
            {safeUrl(it.img) && <div className="amr-offer-img" style={{ backgroundImage: bgUrl(safeUrl(it.img)) }} />}
            <div className="amr-offer-body">
              {txt(it.badge, r.lang) && <span className="amr-offer-badge">{txt(it.badge, r.lang)}</span>}
              <div className="amr-offer-title">{txt(it.title, r.lang)}</div>
              {txt(it.text, r.lang) && <div className="amr-offer-text">{txt(it.text, r.lang)}</div>}
              {txt(it.cta, r.lang) && <Link className="amr-el-btn" href={it.link || '#products'}>{txt(it.cta, r.lang)}</Link>}
            </div>
          </div>
        ))}
      </div>
    </div></section>
  );
}

// ── Countdown ────────────────────────────────────────────────────────────────
const two = (n: number) => String(n).padStart(2, '0');
const left = (end: number, now: number) => {
  const t = Math.max(0, Math.floor((end - now) / 1000));
  return { d: Math.floor(t / 86400), h: Math.floor(t / 3600) % 24, m: Math.floor(t / 60) % 60, s: t % 60, done: t === 0 };
};
/** "2026-12-31T23:59" is Bangladesh time (UTC+6) → milliseconds; invalid → NaN. */
export const endTime = (v: unknown) => {
  const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - 6, +m[5]) : NaN;
};
export function Countdown({ s }: { s: Section }) {
  const r = useRender();
  const p = s.props as { title?: Txt; text?: Txt; ends?: string; doneText?: Txt; cta?: Txt; link?: string };
  const end = endTime(p.ends);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const l = Number.isFinite(end) ? left(end, now) : left(0, 0);
  const lab = r.lang === 'bn' ? ['দিন', 'ঘণ্টা', 'মিনিট', 'সেকেন্ড'] : ['Days', 'Hours', 'Minutes', 'Seconds'];
  return (
    // the live shop's small helper script keeps the numbers ticking (data-amr-countdown = end time in ms)
    <section className="amr-countdown" data-amr-countdown={Number.isFinite(end) ? String(end) : '0'}><div className="container">
      {txt(p.title, r.lang) && <div className="section-heading">{txt(p.title, r.lang)}</div>}
      {txt(p.text, r.lang) && <div className="section-sub" style={{ marginBottom: 20 }}>{txt(p.text, r.lang)}</div>}
      <div className="amr-cd-row" style={l.done ? { display: 'none' } : undefined}>
        {(['d', 'h', 'm', 's'] as const).map((k, i) => (
          <div className="amr-cd-box" key={k}><div className={`amr-cd-num amr-cd-${k}`}>{two(l[k])}</div><div className="amr-cd-lab">{lab[i]}</div></div>
        ))}
      </div>
      <div className="amr-cd-done" style={l.done ? undefined : { display: 'none' }}>{txt(p.doneText, r.lang)}</div>
      {txt(p.cta, r.lang) && <div style={{ marginTop: 22 }}><Link className="btn-primary" href={p.link || '#products'}>{txt(p.cta, r.lang)}</Link></div>}
    </div></section>
  );
}

// ── Featured products (chosen by the merchant; cards = the shop's own product cards) ──
export function FeaturedProducts({ s }: { s: Section }) {
  const r = useRender();
  const p = s.props as { heading?: Txt; sub?: Txt; ids?: string[] };
  const ids = (Array.isArray(p.ids) ? p.ids : []).map(String).slice(0, 12);
  const list = ids.map(id => r.products.find(pr => pr.product_id === id)).filter(Boolean) as typeof r.products;
  return (
    <section className="products-section amr-featured-sec"><div className="container">
      {txt(p.heading, r.lang) && <div className="section-heading">{txt(p.heading, r.lang)}</div>}
      {txt(p.sub, r.lang) && <div className="section-sub">{txt(p.sub, r.lang)}</div>}
      <div className="product-grid amr-featured" data-amr-featured={JSON.stringify(ids)}>
        {list.map(pr => (
          <div className="product-card" key={pr.product_id} data-pid={pr.product_id} onClick={() => r.onPreviewAction('product')}>
            <div className="product-img-wrap"><img className="product-img" src={safeUrl(pr.images?.[0]) || 'https://via.placeholder.com/600x600?text=No+Image'} alt={pr.title} loading="lazy" /></div>
            <div className="product-info"><div className="product-name">{pr.title}</div>
              <div className="product-price-row"><div><span className="product-price">{fmtPrice(pr.price, r.lang)}</span>
                {!!pr.original_price && pr.original_price > pr.price && <span className="product-old-price">{fmtPrice(pr.original_price, r.lang)}</span>}</div>
                <button className="order-btn">{r.lang === 'bn' ? 'অর্ডার' : 'Order'}</button></div></div>
          </div>
        ))}
        {!ids.length && <div className="amr-el-empty" style={{ gridColumn: '1/-1' }}>🛍️ {r.lang === 'bn' ? 'দেখানোর জন্য পণ্য বাছুন' : 'Choose products to show'}</div>}
      </div>
    </div></section>
  );
}

// ── Delivery / payment / WhatsApp ────────────────────────────────────────────
export function DeliveryInfo({ s }: { s: Section }) {
  const r = useRender();
  const p = s.props as { heading?: Txt };
  const items = (s.blocks || []).map(b => b.props as { icon?: string; title?: Txt; text?: Txt });
  return (
    <section className="amr-info"><div className="container">
      {txt(p.heading, r.lang) && <div className="section-heading" style={{ marginBottom: 24 }}>{txt(p.heading, r.lang)}</div>}
      <div className="amr-info-grid">{items.map((it, i) => (
        <div className="amr-info-card" key={i}><div className="amr-info-ic">{String(it.icon || '🚚').slice(0, 4)}</div>
          <div><div className="amr-info-title">{txt(it.title, r.lang)}</div><div className="amr-info-text">{txt(it.text, r.lang)}</div></div></div>
      ))}</div>
    </div></section>
  );
}

export function PaymentInfo({ s }: { s: Section }) {
  const r = useRender();
  const p = s.props as { heading?: Txt; cod?: boolean; bkash?: boolean; nagad?: boolean; bank?: boolean; note?: Txt };
  const methods: [boolean | undefined, string, string][] = [[p.cod, '💵', r.lang === 'bn' ? 'ক্যাশ অন ডেলিভারি' : 'Cash on delivery'],
    [p.bkash, '📱', r.lang === 'bn' ? 'বিকাশ' : 'bKash'], [p.nagad, '📲', r.lang === 'bn' ? 'নগদ' : 'Nagad'], [p.bank, '🏦', r.lang === 'bn' ? 'ব্যাংক ট্রান্সফার' : 'Bank transfer']];
  return (
    <section className="amr-info"><div className="container">
      {txt(p.heading, r.lang) && <div className="section-heading" style={{ marginBottom: 24 }}>{txt(p.heading, r.lang)}</div>}
      <div className="amr-pay-row">{methods.filter(m => m[0] !== false).map(([, ic, l], i) => <div className="amr-pay-chip" key={i}><span>{ic}</span>{l}</div>)}</div>
      {txt(p.note, r.lang) && <div className="amr-info-text" style={{ marginTop: 16 }}>{txt(p.note, r.lang)}</div>}
    </div></section>
  );
}

export function WhatsappCta({ s }: { s: Section }) {
  const r = useRender();
  const p = s.props as { heading?: Txt; text?: Txt; number?: string; button?: Txt };
  const wa = String(p.number || '').replace(/[^0-9]/g, '');
  return (
    <section className="amr-wa"><div className="container amr-wa-in">
      <div className="amr-wa-ic">💬</div>
      <div style={{ flex: 1, minWidth: 220 }}>
        {txt(p.heading, r.lang) && <div className="amr-wa-title">{txt(p.heading, r.lang)}</div>}
        {txt(p.text, r.lang) && <div className="amr-info-text">{txt(p.text, r.lang)}</div>}
      </div>
      {wa ? <Link className="amr-wa-btn" href={`https://wa.me/${wa}`}>{txt(p.button, r.lang) || 'WhatsApp'}</Link>
        : <div className="amr-el-empty">{r.lang === 'bn' ? 'WhatsApp নম্বর দিন' : 'Add a WhatsApp number'}</div>}
    </div></section>
  );
}

export const BLOCKS_CSS = `
.amr-cols-sec{padding:48px 0}
.amr-cols{display:grid;gap:32px}.amr-cols-2{grid-template-columns:1fr 1fr}.amr-cols-3{grid-template-columns:1fr 1fr 1fr}
.amr-col{display:flex;flex-direction:column;gap:16px;min-width:0}
.amr-el-h{font-weight:600;letter-spacing:-.4px;line-height:1.2}.amr-el-h-s{font-size:20px}.amr-el-h-m{font-size:28px}.amr-el-h-l{font-size:clamp(30px,4vw,44px)}
.amr-el-text{font-family:var(--font-bn);color:var(--fg2);font-size:15px;line-height:1.8}.amr-el-text p{margin:0 0 12px}
.amr-el-img{width:100%;border-radius:var(--radius-lg);object-fit:cover}.amr-el-img-round{border-radius:50%;aspect-ratio:1/1}
.amr-el-video{position:relative;padding-top:56.25%;border-radius:var(--radius-lg);overflow:hidden;background:#000}
.amr-el-video iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.amr-el-btn{display:inline-block;background:var(--accent);color:#fff;padding:12px 26px;border-radius:50px;font-size:13px;font-weight:600;border:2px solid var(--accent)}
.amr-el-btn-outline{background:transparent;color:var(--accent)}
.amr-el-empty{padding:28px;border:2px dashed var(--border);border-radius:var(--radius-lg);text-align:center;color:var(--fg2);font-size:13px}
.amr-banner{position:relative;background:var(--bg3) center/cover no-repeat;color:#fff;display:flex;align-items:center}
.amr-banner-s{min-height:280px}.amr-banner-m{min-height:420px}.amr-banner-l{min-height:560px}
.amr-banner-shade{position:absolute;inset:0}
.amr-banner-in{position:relative;width:100%;padding-top:48px;padding-bottom:48px}.amr-banner-center .amr-banner-in{text-align:center}
.amr-banner-title{font-size:clamp(28px,4.4vw,52px);font-weight:600;line-height:1.1;letter-spacing:-.5px;max-width:720px;margin:0 0 14px}
.amr-banner-center .amr-banner-title,.amr-banner-center .amr-banner-text{margin-left:auto;margin-right:auto}
.amr-banner-text{font-family:var(--font-bn);font-size:16px;opacity:.92;max-width:560px;margin:0 0 24px;line-height:1.7}
.amr-gallery,.amr-offers,.amr-countdown,.amr-info,.amr-wa{padding:56px 0}
.amr-gallery-grid{display:grid;gap:14px}.amr-gallery-2{grid-template-columns:repeat(2,1fr)}.amr-gallery-3{grid-template-columns:repeat(3,1fr)}.amr-gallery-4{grid-template-columns:repeat(4,1fr)}
.amr-gallery-item{margin:0}.amr-gallery-item img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:var(--radius-lg)}
.amr-gallery-item figcaption{font-size:13px;color:var(--fg2);margin-top:6px;font-family:var(--font-bn)}
.amr-offers-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px}
.amr-offer{border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;background:var(--bg)}
.amr-offer-img{aspect-ratio:16/10;background:var(--bg2) center/cover no-repeat}
.amr-offer-body{padding:18px;display:flex;flex-direction:column;gap:8px;align-items:flex-start}
.amr-offer-badge{background:var(--accent);color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;letter-spacing:.5px}
.amr-offer-title{font-size:18px;font-weight:600}.amr-offer-text{font-family:var(--font-bn);color:var(--fg2);font-size:14px;line-height:1.7}
.amr-countdown{text-align:center;background:var(--bg2)}
.amr-cd-row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.amr-cd-box{min-width:78px;padding:14px 10px;border-radius:var(--radius-lg);background:var(--bg);border:1px solid var(--border)}
.amr-cd-num{font-size:32px;font-weight:700;color:var(--accent);font-variant-numeric:tabular-nums}
.amr-cd-lab{font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--fg2)}
.amr-cd-done{font-size:18px;font-weight:600;font-family:var(--font-bn)}
.amr-info-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}
.amr-info-card{display:flex;gap:14px;padding:20px;border:1px solid var(--border);border-radius:var(--radius-lg);background:var(--bg)}
.amr-info-ic{font-size:26px;line-height:1}.amr-info-title{font-weight:600;margin-bottom:4px;font-family:var(--font-bn)}
.amr-info-text{font-family:var(--font-bn);color:var(--fg2);font-size:14px;line-height:1.7}
.amr-pay-row{display:flex;flex-wrap:wrap;gap:12px}
.amr-pay-chip{display:flex;gap:8px;align-items:center;padding:12px 18px;border:1px solid var(--border);border-radius:50px;font-weight:600;font-family:var(--font-bn);background:var(--bg)}
.amr-wa{background:var(--bg2)}.amr-wa-in{display:flex;gap:20px;align-items:center;flex-wrap:wrap}
.amr-wa-ic{font-size:40px}.amr-wa-title{font-size:22px;font-weight:600;margin-bottom:6px}
.amr-wa-btn{background:#25d366;color:#fff;padding:14px 28px;border-radius:50px;font-weight:700;font-size:14px}
@media(max-width:1024px){.amr-cols-3{grid-template-columns:1fr 1fr}.amr-gallery-4{grid-template-columns:repeat(3,1fr)}}
@media(max-width:768px){.amr-cols-2,.amr-cols-3{grid-template-columns:1fr}.amr-cols-m2{grid-template-columns:1fr 1fr!important;gap:14px}
 .amr-gallery-3,.amr-gallery-4{grid-template-columns:repeat(2,1fr)}.amr-cols-sec,.amr-gallery,.amr-offers,.amr-countdown,.amr-info,.amr-wa{padding:40px 0}
 .amr-cd-box{min-width:64px}.amr-cd-num{font-size:24px}.amr-banner-m{min-height:340px}.amr-banner-l{min-height:440px}}
`;
