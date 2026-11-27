// Sections for inner pages (About, Contact, Privacy, FAQ, custom). They use the shop's own CSS variables, so they follow
// the shop's colors, fonts and template look automatically.
import { useState } from 'react';
import { txt, safeUrl, type Section, type Txt } from '../schema';
import { useRender } from '../context';

/** Paragraphs: a blank line starts a new paragraph. */
const paras = (t: string) => t.split(/\n\s*\n/).map(x => x.trim()).filter(Boolean);

export function PageTitle({ s }: { s: Section }) {
  const r = useRender();
  const p = s.props as { title?: Txt; sub?: Txt; img?: string };
  const img = safeUrl(p.img);
  return (
    <section className={'amr-ptitle' + (img ? ' amr-ptitle-img' : '')} style={img ? { backgroundImage: `url("${img.replace(/"/g, '%22')}")` } : undefined}>
      <div className="container">
        <h1 className="amr-ptitle-h">{txt(p.title, r.lang)}</h1>
        {txt(p.sub, r.lang) && <p className="amr-ptitle-sub">{txt(p.sub, r.lang)}</p>}
      </div>
    </section>
  );
}

export function RichText({ s }: { s: Section }) {
  const r = useRender();
  const p = s.props as { eyebrow?: Txt; heading?: Txt; body?: Txt };
  return (
    <section className="amr-rt"><div className="container amr-rt-inner">
      {txt(p.eyebrow, r.lang) && <div className="section-eyebrow">{txt(p.eyebrow, r.lang)}</div>}
      {txt(p.heading, r.lang) && <div className="section-heading">{txt(p.heading, r.lang)}</div>}
      <div className="amr-rt-body">{paras(txt(p.body, r.lang)).map((x, i) => <p key={i}>{x}</p>)}</div>
    </div></section>
  );
}

export function ContactInfo({ s }: { s: Section }) {
  const r = useRender();
  const p = s.props as { heading?: Txt; intro?: Txt; phone?: string; whatsapp?: string; email?: string; address?: Txt; hours?: Txt; mapLink?: string };
  const wa = String(p.whatsapp || '').replace(/[^0-9]/g, '');
  const email = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(String(p.email || '')) ? String(p.email) : '';
  const map = safeUrl(p.mapLink);
  const ext = (e: React.MouseEvent) => { e.preventDefault(); r.onPreviewAction('external_link'); };
  const rows: [string, string, React.ReactNode][] = [];
  if (p.phone) rows.push(['📞', r.lang === 'bn' ? 'ফোন' : 'Phone', <a href={`tel:${String(p.phone).replace(/[^0-9+]/g, '')}`}>{p.phone}</a>]);
  if (wa) rows.push(['💬', 'WhatsApp', <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" onClick={ext}>+{wa}</a>]);
  if (email) rows.push(['✉️', r.lang === 'bn' ? 'ইমেইল' : 'Email', <a href={`mailto:${email}`}>{email}</a>]);
  if (txt(p.address, r.lang)) rows.push(['📍', r.lang === 'bn' ? 'ঠিকানা' : 'Address', <span>{txt(p.address, r.lang)}</span>]);
  if (txt(p.hours, r.lang)) rows.push(['🕘', r.lang === 'bn' ? 'খোলার সময়' : 'Opening hours', <span>{txt(p.hours, r.lang)}</span>]);
  return (
    <section className="amr-contact"><div className="container">
      {txt(p.heading, r.lang) && <div className="section-heading">{txt(p.heading, r.lang)}</div>}
      {txt(p.intro, r.lang) && <div className="section-sub">{txt(p.intro, r.lang)}</div>}
      <div className="amr-contact-grid">
        {rows.map(([ic, label, val], i) => (
          <div className="amr-contact-card" key={i}><div className="amr-contact-ic">{ic}</div>
            <div><div className="amr-contact-label">{label}</div><div className="amr-contact-val">{val}</div></div></div>
        ))}
      </div>
      {map && <a className="amr-contact-map" href={map} target="_blank" rel="noreferrer" onClick={ext}>{r.lang === 'bn' ? 'ম্যাপে দেখুন →' : 'View on map →'}</a>}
    </div></section>
  );
}

export function Faq({ s }: { s: Section }) {
  const r = useRender();
  const p = s.props as { heading?: Txt };
  const items = (s.blocks || []).map(b => b.props as { q?: Txt; a?: Txt }).filter(it => txt(it.q, r.lang));
  const [open, setOpen] = useState<number>(-1);
  return (
    <section className="amr-faq"><div className="container amr-rt-inner">
      {txt(p.heading, r.lang) && <div className="section-heading" style={{ marginBottom: 24 }}>{txt(p.heading, r.lang)}</div>}
      {items.map((it, i) => (
        // <details> works on the live shop without any script; the state here only mirrors it in the editor preview
        <details className="amr-faq-item" key={i} open={open === i} onToggle={e => { if ((e.target as HTMLDetailsElement).open) setOpen(i); }}>
          <summary>{txt(it.q, r.lang)}</summary>
          <div className="amr-faq-a">{paras(txt(it.a, r.lang)).map((x, j) => <p key={j}>{x}</p>)}</div>
        </details>
      ))}
    </div></section>
  );
}

/** CSS for the sections above + template looks (variants). Only adds rules for new classes / data-variant / theme
 *  options, so a shop without them renders exactly as before. */
export function builderCss(theme: { radius?: string; tone?: string }): string {
  const out = [`
.amr-ptitle{padding:64px 0 40px;background:var(--bg2);text-align:center}
.amr-ptitle-img{background-size:cover;background-position:center;position:relative;color:#fff;padding:110px 0 90px}
.amr-ptitle-img::before{content:'';position:absolute;inset:0;background:rgba(0,0,0,.42)}
.amr-ptitle-img .container{position:relative}
.amr-ptitle-h{font-size:clamp(28px,4vw,42px);font-weight:600;letter-spacing:-.5px;margin:0}
.amr-ptitle-sub{margin:12px auto 0;max-width:620px;color:inherit;opacity:.8;font-family:var(--font-bn);font-size:15px;line-height:1.7}
.amr-rt,.amr-faq,.amr-contact{padding:64px 0}
.amr-rt-inner{max-width:820px}
.amr-rt-body{margin-top:16px;font-family:var(--font-bn);color:var(--fg2);font-size:15px;line-height:1.85}
.amr-rt-body p{margin:0 0 14px}
.amr-contact-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin-top:24px}
.amr-contact-card{display:flex;gap:14px;align-items:flex-start;padding:20px;border:1px solid var(--border);border-radius:var(--radius-lg);background:var(--bg)}
.amr-contact-ic{font-size:22px;line-height:1}
.amr-contact-label{font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--fg2);font-weight:600;margin-bottom:4px}
.amr-contact-val{font-family:var(--font-bn);font-size:15px;color:var(--fg);word-break:break-word}
.amr-contact-val a{color:inherit;text-decoration:none;border-bottom:1px solid var(--border)}
.amr-contact-map{display:inline-block;margin-top:20px;color:var(--accent);font-weight:600;text-decoration:none}
.amr-faq-item{border-bottom:1px solid var(--border);padding:4px 0}
.amr-faq-item summary{cursor:pointer;list-style:none;padding:16px 28px 16px 0;font-weight:600;font-size:15px;position:relative;font-family:var(--font-bn)}
.amr-faq-item summary::-webkit-details-marker{display:none}
.amr-faq-item summary::after{content:'+';position:absolute;right:4px;top:12px;font-size:20px;color:var(--fg2)}
.amr-faq-item[open] summary::after{content:'−'}
.amr-faq-a{color:var(--fg2);font-family:var(--font-bn);font-size:14.5px;line-height:1.8;padding:0 0 14px}
.amr-faq-a p{margin:0 0 10px}
[data-variant="split"] .slider-wrap{background:var(--bg2)}
[data-variant="split"] .slide::after{display:none}
[data-variant="split"] .slide-img{left:auto;right:0;width:56%}
[data-variant="split"] .slide-content{color:var(--fg);margin:0;width:44%;max-width:none;padding:0 40px 0 max(28px,calc((100vw - 1240px)/2 + 28px))}
[data-variant="split"] .slide-title{font-size:clamp(28px,3.4vw,46px)}
[data-variant="split"] .slide-tag{color:var(--accent);opacity:1}
[data-variant="split"] .dot{background:rgba(0,0,0,.2)}
[data-variant="split"] .dot.active{background:var(--fg)}
[data-variant="compact"] .slider-wrap{height:400px}
[data-variant="circles"] .cat-tile-img{border-radius:50%}
[data-variant="circles"] .cat-tile.active .cat-tile-img{border-color:var(--accent)}
@media(min-width:1025px){[data-variant="grid3"] .product-grid{grid-template-columns:repeat(3,1fr);gap:44px 32px}}
@media(max-width:768px){
 [data-variant="split"] .slider-wrap{height:560px}
 [data-variant="split"] .slide{align-items:flex-end}
 [data-variant="split"] .slide-img{width:100%;height:55%;top:0;bottom:auto}
 [data-variant="split"] .slide-content{width:100%;padding:0 22px 64px}
 [data-variant="compact"] .slider-wrap{height:300px}
 .amr-ptitle{padding:44px 0 28px}.amr-ptitle-img{padding:72px 0 56px}.amr-rt,.amr-faq,.amr-contact{padding:44px 0}
}`];
  if (theme.radius === 'sharp') out.push(':root{--radius:0px;--radius-lg:0px;--radius-xl:0px}');
  if (theme.radius === 'round') out.push(':root{--radius:14px;--radius-lg:22px;--radius-xl:30px}');
  // tones only in light mode — the shop's own dark-mode colors stay as they are
  const tones: Record<string, string> = { cool: '--bg2:#f3f6fa;--bg3:#e7ecf3;--border:#e2e8f0', neutral: '--bg2:#f5f5f5;--bg3:#ebebeb;--border:#e5e5e5',
    warm: '--bg2:#fbf5ef;--bg3:#f3e9de;--border:#eadfd2' };
  if (theme.tone && tones[theme.tone]) out.push(`@media(prefers-color-scheme:light){:root{${tones[theme.tone]}}}`);
  return out.join('\n');
}
