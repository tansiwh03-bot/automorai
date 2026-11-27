import { useState } from 'react';
import { txt, safeUrl, type NavItem, type Section, type Txt } from '../schema';
import { useRender, productInCat, label as lbl } from '../context';

export function NoticeBar({ s }: { s: Section }) {
  const p = s.props as { text?: Txt };
  const r = useRender();
  if (!p.text) return null;
  return <div className="notice-bar">{txt(p.text, r.lang)}</div>;
}

export function Header({ s }: { s: Section }) {
  const p = s.props as { businessName: string; logoImg?: string; nav: NavItem[]; productsMegaMenu?: boolean;
    showSearch?: boolean; showLangSwitch?: boolean; showCart?: boolean; labels?: Record<string, Txt> };
  const r = useRender();
  const [searchOpen, setSearchOpen] = useState(false);
  const logo = safeUrl(p.logoImg);

  const go = (e: React.MouseEvent, link: string) => {
    if (/^https?:/.test(link)) { e.preventDefault(); r.onPreviewAction('external_link'); return; }
    if (/^\/[a-z0-9-]*$/.test(link)) { e.preventDefault(); r.onPreviewAction('page:' + link); return; }   // another page of the site
    if (link.startsWith('#') && link.length > 1) {
      e.preventDefault();
      document.getElementById(link.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    } else { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };

  // "Products" mega menu (desktop hover), built from live products exactly like buildProductsMegaMenu()
  const megaCols = (catLabels: string[]) => catLabels.map((title, idx) => {
    if (!idx) return null;
    const matches = r.products.filter(pr => productInCat(pr, idx, r.catMatchers)).slice(0, 6);
    if (!matches.length) return null;
    return (
      <div className="mega-col" key={idx}>
        <div className="mega-col-title">{title.replace(/^[^\p{L}\p{N}]+/u, '').trim()}</div>
        {matches.map(m => <a key={m.product_id} className="mega-product-link" href={`?p=${encodeURIComponent(m.product_id)}`}
          onClick={e => { e.preventDefault(); r.onPreviewAction('product'); }}>{m.title}</a>)}
      </div>
    );
  }).filter(Boolean);

  return (
    <header className="header"><div className="header-inner">
      <div className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        {logo && <img className="header-logo-img" src={logo} alt="" style={{ display: 'block' }} />}
        {!logo && <div className="logo-text">{p.businessName}</div>}
      </div>
      <nav className="header-nav">
        {(p.nav || []).map((it, i) => {
          const label = txt(it.label, r.lang);
          const kids = (it.children || []).filter(k => txt(k.label, r.lang));
          const isProducts = p.productsMegaMenu && /^#products$/.test(it.link);
          const cols = isProducts && r.products.length ? megaCols(r.catMatchers.map((m, idx) =>
            idx === 0 ? '' : (r.lang === 'bn' ? (m[1] || m[0]) : m[0]) || '')) : [];
          return (
            <div className="nav-item" key={i}>
              <a className="nav-link" href={safeUrl(it.link) || '#'} onClick={e => go(e, it.link)}>{label}</a>
              {kids.length > 0 && (
                <div className="nav-dropdown">{kids.map((k, j) =>
                  <a key={j} className="nav-dropdown-link" href={safeUrl(k.link) || '#'} onClick={e => go(e, k.link)}>{txt(k.label, r.lang)}</a>)}</div>
              )}
              {cols.length > 0 && <div className="nav-dropdown-mega">{cols}</div>}
            </div>
          );
        })}
      </nav>
      <div className="header-right">
        {p.showSearch !== false && (
          <div className="search-wrap">
            <input className={`search-input${searchOpen ? ' open' : ''}`} type="text" value={r.search}
              placeholder={lbl(p.labels, 'searchPh', r.lang)} onChange={e => r.setSearch(e.target.value)} />
            <button className="search-icon-btn" onClick={() => { if (searchOpen) r.setSearch(''); setSearchOpen(!searchOpen); }}>🔍</button>
          </div>
        )}
        {p.showLangSwitch !== false && (
          <div className="lang-switch">
            <button className={`lang-btn${r.lang === 'en' ? ' active' : ''}`} onClick={() => r.setLang('en')}>EN</button>
            <span>/</span>
            <button className={`lang-btn${r.lang === 'bn' ? ' active' : ''}`} onClick={() => r.setLang('bn')}>বাং</button>
          </div>
        )}
        {p.showCart !== false && (
          <button className="cart-icon-btn" onClick={() => r.onPreviewAction('cart')}>🛍️<span className="cart-badge">0</span></button>
        )}
      </div>
    </div></header>
  );
}

