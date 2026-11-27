// "Why choose us", Testimonials and About sections.
import { txt, safeUrl, type Section, type Txt } from '../schema';
import { useRender } from '../context';

export function WhyUs({ s }: { s: Section }) {
  const r = useRender();
  const p = s.props as { anchor?: string; eyebrow?: Txt; heading?: Txt };
  const cards = (s.blocks || []).map(b => b.props as { num?: Txt; title?: Txt; desc?: Txt });
  return (
    <section className="why-section" id={p.anchor || undefined}><div className="container">
      <div><div className="section-eyebrow">{txt(p.eyebrow, r.lang)}</div><div className="section-heading">{txt(p.heading, r.lang)}</div></div>
      <div className="why-grid">
        {cards.map((c, i) => (
          <div className="why-card" key={i}>
            <span className="why-icon">{txt(c.num, r.lang)}</span>
            <div className="why-title">{txt(c.title, r.lang)}</div>
            <div className="why-desc">{txt(c.desc, r.lang)}</div>
          </div>
        ))}
      </div>
    </div></section>
  );
}

export function Testimonials({ s }: { s: Section }) {
  const r = useRender();
  const p = s.props as { eyebrow?: Txt; heading?: Txt };
  const items = (s.blocks || []).map(b => b.props as { text: string; name?: string; rating?: number }).filter(i => i.text);
  if (!items.length) return null;
  return (
    <section className="testimonial-section" style={{ display: 'block' }}><div className="container">
      <div className="section-eyebrow">{txt(p.eyebrow, r.lang)}</div>
      <div className="section-heading">{txt(p.heading, r.lang)}</div>
      <div className="testimonial-grid">
        {items.map((it, i) => (
          <div className="testimonial-card" key={i}>
            <div className="testimonial-stars">{'★★★★★'.slice(0, Math.max(1, Math.min(5, Number(it.rating) || 5)))}</div>
            <div className="testimonial-text">"{it.text}"</div>
            <div className="testimonial-author">{it.name || ''}</div>
          </div>
        ))}
      </div>
    </div></section>
  );
}

export function About({ s }: { s: Section }) {
  const r = useRender();
  const p = s.props as { eyebrow?: Txt; title?: Txt; body?: Txt; img?: string };
  if (!p.title && !p.body) return null;
  return (
    <section className="about-section" style={{ display: 'block' }}><div className="container"><div className="about-grid">
      <img className="about-img" src={safeUrl(p.img)} alt="" />
      <div>
        <div className="section-eyebrow">{txt(p.eyebrow, r.lang)}</div>
        <div className="about-title">{txt(p.title, r.lang)}</div>
        <div className="about-body">{txt(p.body, r.lang)}</div>
      </div>
    </div></div></section>
  );
}
