import { useEffect, useState } from 'react';
import { txt, safeUrl, type Section, type Txt } from '../schema';
import { useRender } from '../context';

interface SlideProps { img: string; tag: string; title: string; desc: string; cta: Txt; ctaLink: string; trustLine?: Txt }

export function HeroSlider({ s }: { s: Section }) {
  const r = useRender();
  const slides = (s.blocks || []).map(b => b.props as unknown as SlideProps);
  const interval = Math.max(1500, Number((s.props as { intervalMs?: number }).intervalMs) || 4000);
  const [cur, setCur] = useState(0);
  const n = slides.length;

  // in the editor, show the slide being edited and stop rotating
  const focusIdx = r.focusBlock ? (s.blocks || []).findIndex(b => b.id === r.focusBlock) : -1;
  useEffect(() => { if (focusIdx >= 0) setCur(focusIdx); }, [focusIdx]);
  useEffect(() => {
    if (n < 2 || focusIdx >= 0) return;
    const t = setInterval(() => setCur(c => (c + 1) % n), interval);
    return () => clearInterval(t);
  }, [n, interval, focusIdx]);
  useEffect(() => { if (cur >= n && n) setCur(0); }, [cur, n]);

  if (!n) return null;
  return (
    <section className="slider-wrap">
      {slides.map((sl, i) => (
        <div key={i} className={`slide${i === cur ? ' active' : ''}`}>
          <img className="slide-img" src={safeUrl(sl.img)} alt="" />
          <div className="slide-content container">
            {sl.tag && <div className="slide-tag">{sl.tag}</div>}
            <h1 className="slide-title">{sl.title}</h1>
            <p className="slide-desc">{sl.desc}</p>
            <a className="btn-primary" href={safeUrl(sl.ctaLink) || '#products'} onClick={e => {
              e.preventDefault();
              const id = (sl.ctaLink || '#products').replace(/^#/, '');
              document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
            }}>{txt(sl.cta, r.lang)}</a>
            {sl.trustLine && txt(sl.trustLine, r.lang) && <div className="trust-line">{txt(sl.trustLine, r.lang)}</div>}
          </div>
        </div>
      ))}
      {n > 1 && (
        <div className="slider-dots">
          {slides.map((_, i) => <button key={i} className={`dot${i === cur ? ' active' : ''}`} onClick={() => setCur(i)} />)}
        </div>
      )}
    </section>
  );
}
