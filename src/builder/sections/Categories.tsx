import { txt, safeUrl, type Section, type Txt } from '../schema';
import { useRender, productInCat } from '../context';

interface CatProps { label: Txt; match: string[]; all?: boolean; image?: string; autoImage?: boolean }

export function Categories({ s }: { s: Section }) {
  const r = useRender();
  const cats = (s.blocks || []).map(b => b.props as unknown as CatProps);
  if (!cats.length) return null;

  // Same rule as updateCategoryTileImages(): tile 0 = first product photo, others = first matching product photo
  const imgFor = (c: CatProps, idx: number): string => {
    if (c.autoImage && r.products.length) {
      const pick = idx === 0 ? r.products[0] : r.products.find(p => productInCat(p, idx, r.catMatchers) && p.images?.[0]);
      const u = pick?.images?.[0];
      if (u) return safeUrl(u);
    }
    return safeUrl(c.image);
  };

  return (
    <section className="categories"><div className="container">
      <div className="categories-title">{txt((s.props as { title?: Txt }).title, r.lang)}</div>
      <div className="cat-grid">
        {cats.map((c, idx) => {
          const img = imgFor(c, idx);
          return (
            <div key={idx} className={`cat-tile${r.activeCat === idx ? ' active' : ''}`} onClick={() => {
              r.setActiveCat(idx);
              document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              <div className="cat-tile-img" style={img ? { backgroundImage: `url('${img}')` } : undefined} />
              <div className="cat-tile-label">{txt(c.label, r.lang)}</div>
            </div>
          );
        })}
      </div>
    </div></section>
  );
}
