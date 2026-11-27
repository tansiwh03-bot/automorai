import { txt, safeUrl, type Section, type Txt } from '../schema';
import { useRender, label as lbl } from '../context';

export function Footer({ s }: { s: Section }) {
  const r = useRender();
  const p = s.props as { businessName: string; logoIcon?: string; logoImg?: string; desc?: string; whatsapp?: string; year?: string;
    newsletter?: { label: Txt; title: Txt; placeholder: Txt; button: Txt }; labels?: Record<string, Txt>; showTrackOrder?: boolean };
  const t = (k: string) => lbl(p.labels, k, r.lang);
  const logo = safeUrl(p.logoImg);
  const nl = p.newsletter;
  const jump = (e: React.MouseEvent, id: string) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };

  return (
    <footer className="footer"><div className="container">
      {nl && (
        <div className="footer-newsletter">
          <div className="footer-newsletter-label">{txt(nl.label, r.lang)}</div>
          <div className="footer-newsletter-title">{txt(nl.title, r.lang)}</div>
          <form className="footer-newsletter-row" onSubmit={e => e.preventDefault()}>
            <input type="email" placeholder={txt(nl.placeholder, r.lang)} />
            <button type="button" onClick={() => r.onPreviewAction('newsletter')}>{txt(nl.button, r.lang)}</button>
          </form>
        </div>
      )}
      <div className="footer-grid">
        <div>
          <div className="footer-logo">
            {!logo && <div className="footer-logo-icon">{p.logoIcon}</div>}
            {logo && <img className="footer-logo-img" src={logo} alt="" style={{ display: 'block' }} />}
            <div className="footer-logo-name">{p.businessName}</div>
          </div>
          <div className="footer-desc">{p.desc}</div>
        </div>
        <div><div className="footer-col-title">{t('quickLinksTitle')}</div><div className="footer-links">
          <a className="footer-link" href="#products" onClick={e => jump(e, 'products')}>{t('allProductsLink')}</a>
          <a className="footer-link" href="#about" onClick={e => jump(e, 'about')}>{t('aboutUsLink')}</a>
          {p.showTrackOrder !== false && <a className="footer-link" href="#" onClick={e => { e.preventDefault(); r.onPreviewAction('track_order'); }}>{t('trackOrderLink')}</a>}
        </div></div>
        <div><div className="footer-col-title">{t('policiesTitle')}</div><div className="footer-links">
          <span className="footer-link">{t('deliveryPolicy')}</span><span className="footer-link">{t('returnPolicy')}</span><span className="footer-link">{t('privacyPolicy')}</span>
        </div></div>
        <div>
          <div className="footer-col-title">{t('contactTitle')}</div>
          <div className="footer-links">
            <div className="footer-contact-row">📞 {p.whatsapp}</div>
            <div className="footer-contact-row">💬 <a href={p.whatsapp ? `https://wa.me/${encodeURIComponent(p.whatsapp)}` : '#'} style={{ color: 'inherit' }}
              onClick={e => { e.preventDefault(); r.onPreviewAction('external_link'); }}>{t('waMsgLink')}</a></div>
          </div>
          <div className="footer-col-title" style={{ marginTop: '18px' }}>{t('paymentTitle')}</div>
          <div className="footer-pay-badges"><span className="footer-pay-badge">bKash</span><span className="footer-pay-badge">Nagad</span><span className="footer-pay-badge">Rocket</span><span className="footer-pay-badge">Cash on Delivery</span></div>
        </div>
      </div>
      <div className="footer-bottom"><div>© {p.year} {p.businessName}. <span>{t('allRights')}</span></div><div className="footer-powered">Powered by <a href="https://automorai.com" onClick={e => { e.preventDefault(); r.onPreviewAction('external_link'); }}>Automorai</a></div></div>
    </div></footer>
  );
}

// WhatsApp logo path, copied from the legacy template's floating WhatsApp button
const WA_PATH = 'M16.001 3C8.831 3 3 8.83 3 16c0 2.573.738 4.973 2.016 7.013L3.5 29l6.197-1.482A12.93 12.93 0 0 0 16.001 29C23.17 29 29 23.17 29 16S23.17 3 16.001 3zm0 23.4a10.35 10.35 0 0 1-5.273-1.448l-.378-.225-3.68.88.88-3.593-.246-.37A10.37 10.37 0 0 1 5.6 16c0-5.74 4.662-10.4 10.401-10.4 5.74 0 10.399 4.66 10.399 10.4 0 5.74-4.659 10.4-10.399 10.4zm5.71-7.79c-.313-.157-1.85-.912-2.136-1.017-.287-.104-.496-.157-.705.157-.209.313-.809 1.017-.992 1.226-.183.209-.365.235-.678.078-.313-.156-1.323-.487-2.521-1.555-.932-.832-1.562-1.86-1.745-2.173-.183-.313-.02-.483.14-.64.157-.157.365-.408.548-.613.183-.204.244-.35.365-.587.122-.235.061-.43-.03-.587-.09-.157-.818-1.97-1.121-2.698-.296-.713-.598-.617-.822-.628-.21-.01-.45-.012-.69-.012-.24 0-.626.09-.96.428-.335.339-1.277 1.248-1.277 3.044 0 1.797 1.307 3.533 1.49 3.777.183.244 2.52 3.843 6.106 5.237 3.586 1.395 3.586.93 4.233.871.647-.06 2.137-.874 2.44-1.722.3-.848.3-1.57.21-1.722-.09-.157-.313-.244-.626-.4z';

/** Floating buttons at the bottom-right: WhatsApp (link) and the shop chat bubble. */
export function ChatBubble({ s }: { s: Section }) {
  const r = useRender();
  const p = s.props as { enabled?: boolean; whatsappFloat?: string; whatsappFloatIcon?: string };
  const wa = String(p.whatsappFloat || '').replace(/[^0-9]/g, '');
  return (
    <>
      {wa && (
        <a className="wa-float" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" title="WhatsApp"
          onClick={e => { e.preventDefault(); r.onPreviewAction('external_link'); }}>
          {p.whatsappFloatIcon ? String(p.whatsappFloatIcon).slice(0, 8)
            : <svg viewBox="0 0 32 32" width="28" height="28" fill="#fff"><path d={WA_PATH} /></svg>}
        </a>
      )}
      {p.enabled !== false && <button className="sf-chat-bubble" title="Chat" onClick={() => r.onPreviewAction('chat')}>💬</button>}
    </>
  );
}
