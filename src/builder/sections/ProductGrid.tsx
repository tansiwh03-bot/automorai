import { txt, safeUrl, type Section, type Txt } from '../schema';
import { useRender, productInCat, fmtPrice, label as lbl } from '../context';

export function ProductGrid({ s }: { s: Section }) {
  const r = useRender();
  const p = s.props as { anchor?: string; eyebrow?: Txt; heading?: Txt; sub?: Txt; labels?: Record<string, Txt> };
  const empty = (t: string) => <div style={{ padding: '40px', textAlign: 'center', color: 'var(--fg2)', gridColumn: '1/-1' }}>{t}</div>;

  let list = r.products.filter(pr => productInCat(pr, r.activeCat, r.catMatchers));
  const q = r.search.trim().toLowerCase();
  if (q) list = list.filter(pr => (pr.title || '').toLowerCase().includes(q));

  return (
    <section className="products-section" id={p.anchor || undefined}><div className="container">
      <div className="section-eyebrow">{txt(p.eyebrow, r.lang)}</div>
      <div className="section-heading">{txt(p.heading, r.lang)}</div>
      <div className="section-sub">{txt(p.sub, r.lang)}</div>
      <div className="product-grid">
        {!r.productsLoaded ? empty(lbl(p.labels, 'loadingText', r.lang))
          : !list.length ? empty(lbl(p.labels, q ? 'searchEmpty' : 'noProducts', r.lang))
          : list.map(pr => {
              const img = safeUrl(pr.images?.[0]) || 'https://via.placeholder.com/600x600?text=No+Image';
              const showOld = !!pr.original_price && pr.original_price > pr.price;
              return (
                <div className="product-card" key={pr.product_id} onClick={() => r.onPreviewAction('product')}>
                  <div className="product-img-wrap"><img className="product-img" src={img} alt={pr.title} loading="lazy" /></div>
                  <div className="product-info">
                    <div className="product-name">{pr.title}</div>
                    <div className="product-price-row">
                      <div><span className="product-price">{fmtPrice(pr.price, r.lang)}</span>
                        {showOld && <span className="product-old-price">{fmtPrice(pr.original_price as number, r.lang)}</span>}</div>
                      <button className="order-btn">{lbl(p.labels, 'orderBtn', r.lang)}</button>
                    </div>
                  </div>
                </div>
              );
            })}
      </div>
    </div></section>
  );
}
