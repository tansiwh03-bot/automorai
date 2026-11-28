import { useState, useEffect, useRef, Fragment } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import SalesReport from '../components/SalesReport';
import BuilderBeta from '../builder/BuilderBeta';
import { liveDesignKind } from '@/builder/api';
import { LayoutDashboard, Inbox as InboxIcon, Globe, Package, Boxes, ShoppingBag, BarChart3, Bell, ChevronDown, Users, CreditCard, Sparkles, Plug, Truck, Megaphone, Workflow, Settings as SettingsIcon, LayoutTemplate } from 'lucide-react';

// Attaches the logged-in user's Supabase session token so backend endpoints can verify
// the caller actually owns the business_slug being requested (see n8n "Verify Website Owner").
const getAuthHeader = async (): Promise<Record<string, string>> => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const FACEBOOK_APP_ID = '1458889719428985';
const REDIRECT_URI = 'https://automorai.com/dashboard';
const WEBHOOK_URL = 'https://n8n2.kingpurefood.com/webhook/automorai/new-customer';
const CONFIG_ID = '1766373457898596';
const INBOX_API = 'https://n8n2.kingpurefood.com/webhook/automorai/inbox';
const REPLY_API = 'https://n8n2.kingpurefood.com/webhook/automorai/inbox/reply';
const WEBSITE_BUILDER_API = 'https://n8n2.kingpurefood.com/webhook/automorai/build-website-template';
const WEBSITE_UPDATE_API = 'https://n8n2.kingpurefood.com/webhook/automorai/update-website-template';
const MY_WEBSITES_API = 'https://n8n2.kingpurefood.com/webhook/automorai/my-websites';
const ORDERS_API = 'https://n8n2.kingpurefood.com/webhook/automorai/website-orders';
const ORDER_STATUS_API = 'https://n8n2.kingpurefood.com/webhook/automorai/website-orders/update-status';
const NEW_ORDER_API = 'https://n8n2.kingpurefood.com/webhook/automorai/new-order';
const PRODUCTS_API = 'https://n8n2.kingpurefood.com/webhook/automorai/website-products';
const SETTINGS_API = 'https://n8n2.kingpurefood.com/webhook/automorai/website-settings';
const MY_PACKAGE_API = 'https://n8n2.kingpurefood.com/webhook/automorai/my-package';
const COURIER_SETTINGS_API = 'https://n8n2.kingpurefood.com/webhook/automorai/courier-settings';
const COURIER_PHONE_CHECK_API = 'https://n8n2.kingpurefood.com/webhook/automorai/courier/phone-check';
const COURIER_BOOK_API = 'https://n8n2.kingpurefood.com/webhook/automorai/courier/book';
const COURIER_BOOKINGS_API = 'https://n8n2.kingpurefood.com/webhook/automorai/courier/bookings';
const COURIER_PATHAO_GEO_API = 'https://n8n2.kingpurefood.com/webhook/automorai/courier/pathao/geo';
const CUSTOM_DOMAIN_API = 'https://n8n2.kingpurefood.com/webhook/automorai/custom-domain';
const SUPABASE_URL = 'https://wwettpkioulkofohfdxl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ul461fEnojpr4GxdJv-P8Q_hySiflQt';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Message { role: string; message: string; timestamp: string; }
interface Conversation {
  id: string; sender_id: string; name: string;
  platform: 'whatsapp' | 'messenger' | 'facebook' | 'website' | string;
  page_id: string; messages: Message[]; last_message: string; last_time: string;
}
interface NavSubItem { label: string; link: string; }
interface NavItem { label: string; link: string; children?: NavSubItem[]; }
interface TestimonialItem { name: string; text: string; rating: number; }
interface TestimonialBlock { type: 'testimonial'; enabled: boolean; title: string; items: TestimonialItem[]; }
interface AboutBlock { type: 'about'; enabled: boolean; title: string; body: string; img: string; }
type CustomBlock = TestimonialBlock | AboutBlock;
interface WebsiteSettings {
  business_slug: string;
  slide1_img: string; slide1_tag: string; slide1_title: string; slide1_desc: string;
  slide2_img: string; slide2_tag: string; slide2_title: string; slide2_desc: string;
  slide3_img: string; slide3_tag: string; slide3_title: string; slide3_desc: string;
  footer_desc: string;
  logo_img: string;
  nav_menu: NavItem[];
  custom_blocks: CustomBlock[];
  bkash_number: string;
  nagad_number: string;
  bank_details: string;
  delivery_charge_dhaka: string;
  delivery_charge_outside: string;
  return_policy: string;
  shop_address: string;
  shop_hours: string;
  fb_pixel_id: string;
  ga_id: string;
  gtm_id: string;
}
interface WebsiteForm {
  business_name: string; niche: string; whatsapp_number: string; accent_color: string;
}
interface Product {
  product_id?: string; business_slug: string; title: string; description: string; category?: string;
  price: number; original_price?: number; images: string[]; sizes: string[]; colors: string[];
  stock: number; is_active?: boolean;
}
interface Order {
  id: string; site_id: string; product_title: string; product_price: number;
  selected_size: string; selected_color: string; quantity: number;
  customer_name: string; customer_phone: string; customer_email: string; customer_address: string;
  payment_method: string; transaction_id: string; status: string;
  delivery_location: string; delivery_charge: number;
  created_at: string;
  source?: string; woo_order_id?: string;
}

// ─── UI Helpers & Styles ──────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 13px', background: '#fff',
  border: '1px solid #dbe3f0', borderRadius: '9px', color: '#17243b',
  fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box'
};

const btnStyle = (bg: string, fg: string): React.CSSProperties => ({
  width: '100%', padding: '12px', background: bg, color: fg,
  border: 'none', borderRadius: '8px', fontWeight: 700,
  cursor: 'pointer', marginBottom: '12px', fontSize: '0.9rem', transition: 'all 0.2s'
});

const taskCardStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid #e4eaf3', borderRadius: '14px',
  padding: '20px', display: 'flex', flexDirection: 'column',
  boxShadow: '0 8px 26px rgba(15,39,83,.06)',
};
const taskCardIconStyle: React.CSSProperties = {
  fontSize: '1.6rem', marginBottom: '12px',
};
const taskCardTitleStyle: React.CSSProperties = {
  fontWeight: 700, fontSize: '0.98rem', marginBottom: '6px',
};
const taskCardDescStyle: React.CSSProperties = {
  color: '#718096', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: '16px', flex: 1,
};
const taskCardBtnStyle: React.CSSProperties = {
  padding: '9px 16px', background: '#2563eb', color: 'white', border: 'none',
  borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', alignSelf: 'flex-start',
};

const TaskCard = ({ icon, title, desc, action, done }: { icon: string; title: string; desc: string; action?: { label: string; onClick: () => void }; done?: boolean }) => (
  <div style={taskCardStyle}>
    <div style={taskCardIconStyle}>{icon}</div>
    <div style={{ ...taskCardTitleStyle, color: done ? '#159768' : '#12284c' }}>{done ? `✅ ${title}` : title}</div>
    <div style={taskCardDescStyle}>{desc}</div>
    {action && <button onClick={action.onClick} style={taskCardBtnStyle}>{action.label}</button>}
  </div>
);

const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => {
  const isRequired = label.endsWith(' *');
  const labelText = isRequired ? label.slice(0, -2) : label;
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: '#52647d', fontWeight: 650 }}>
        {labelText}{isRequired && <span style={{ color: '#e5484d' }}> *</span>}
      </label>
      {children}
    </div>
  );
};

const Toggle = ({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#fff', border: '1px solid #e4eaf3', padding: '14px 16px', borderRadius: '12px', boxShadow: '0 8px 26px rgba(15,39,83,.06)' }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#12284c' }}>{label}</div>
      <div style={{ fontSize: '0.78rem', color: '#718096' }}>{desc}</div>
    </div>
    <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} style={{ cursor: 'pointer', width: '18px', height: '18px' }} />
  </div>
);

const PlatformBadge = ({ platform }: { platform: string }) => {
  const config: Record<string, { label: string; color: string }> = {
    whatsapp:  { label: 'WhatsApp',  color: '#25D366' },
    messenger: { label: 'Messenger', color: '#0099FF' },
    facebook:  { label: 'Facebook',  color: '#1877F2' },
    website:   { label: 'Website',   color: '#2563eb' },
  };
  const c = config[platform] ?? { label: platform, color: '#718096' };
  return (
    <span style={{ fontSize: '0.7rem', background: c.color + '22', color: c.color,
      border: `1px solid ${c.color}44`, borderRadius: '4px', padding: '2px 6px', fontWeight: 600 }}>
      {c.label}
    </span>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
// ── WooCommerce connection card (Integrations tab). Backend: n8n "Automorai - WooCommerce". ──
const WOO_API = 'https://n8n2.kingpurefood.com/webhook/automorai/woo';
function WooCommerceCard({ siteId, hasPkg, isBig, onOpenWebsite, onOpenOrders }: { siteId: string; hasPkg: boolean; isBig: boolean; onOpenWebsite: () => void; onOpenOrders: () => void }) {
  const [st, setSt] = useState<{ connected: boolean; store_url: string; last_order_at: string } | null>(null);
  const [form, setForm] = useState({ store_url: '', consumer_key: '', consumer_secret: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(false);
  const load = async () => {
    if (!siteId) return;
    try {
      const r = await fetch(`${WOO_API}/status?business_slug=${encodeURIComponent(siteId)}`, { headers: await getAuthHeader() });
      const d = await r.json(); if (d.success) setSt(d);
    } catch {}
  };
  useEffect(() => { load(); }, [siteId]);
  const connect = async () => {
    setErr(''); setBusy(true);
    try {
      const r = await fetch(`${WOO_API}/connect`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(await getAuthHeader()) },
        body: JSON.stringify({ business_slug: siteId, ...form }) });
      const d = await r.json().catch(() => ({}));
      if (d.error_code === 'no_package') { window.location.href = '/buy-package?package=automation&plan=big'; return; }
      if (d.error_code === 'need_big') { window.location.href = '/buy-package?package=automation&plan=big'; return; }
      if (!d.success) setErr(d.error || 'Could not connect. Please try again.');
      else { setForm({ store_url: '', consumer_key: '', consumer_secret: '' }); setOpen(false); await load(); }
    } catch { setErr('Network error. Please try again.'); }
    setBusy(false);
  };
  const disconnect = async () => {
    if (!confirm('Disconnect your WooCommerce store? New Woo orders will stop coming to Automorai.')) return;
    setBusy(true);
    try { await fetch(`${WOO_API}/disconnect`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(await getAuthHeader()) }, body: JSON.stringify({ business_slug: siteId }) }); await load(); } catch {}
    setBusy(false);
  };
  const box: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #dbe3f0', borderRadius: '9px', fontSize: '0.86rem', boxSizing: 'border-box', marginBottom: '8px' };
  return (
    <div className="amr-card" style={{ marginBottom: '14px', border: '1.5px solid #e9d5ff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f3e8ff', color: '#7c3aed', display: 'grid', placeItems: 'center', fontSize: '15px', fontWeight: 900, flex: 'none' }}>Woo</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#12284c' }}>WooCommerce store <span style={{ background: '#2563eb', color: '#fff', borderRadius: '6px', padding: '1px 6px', fontSize: '0.62rem', marginLeft: '4px' }}>NEW</span></div>
          <div style={{ color: '#718096', fontSize: '0.76rem' }}>Every WooCommerce order comes into Automorai — fraud check, 1-click Steadfast booking, WhatsApp &amp; email alerts.</div>
        </div>
        {st?.connected
          ? <span className="amr-pill delivered" style={{ flex: 'none' }}>✓ Connected</span>
          : !siteId ? <button className="amr-btn" style={{ flex: 'none', whiteSpace: 'nowrap' }} onClick={onOpenWebsite}>Create workspace</button>
          : !hasPkg ? <button className="amr-btn" style={{ flex: 'none', whiteSpace: 'nowrap' }} onClick={() => { window.location.href = '/buy-package?package=automation&plan=big'; }}>Buy Big plan</button>
          : !isBig ? <button className="amr-btn" style={{ flex: 'none', whiteSpace: 'nowrap' }} onClick={() => { window.location.href = '/buy-package?package=automation&plan=big'; }}>Upgrade to Big</button>
          : <button className="amr-btn" style={{ flex: 'none', whiteSpace: 'nowrap' }} onClick={() => setOpen(v => !v)}>{open ? 'Close' : 'Connect'}</button>}
      </div>
      {siteId && !st?.connected && !isBig && <p style={{ fontSize: '0.76rem', color: '#718096', margin: '10px 0 0' }}>WooCommerce connection is part of the Big plan (৳4,990/month).</p>}
      {!siteId && <p style={{ fontSize: '0.76rem', color: '#718096', margin: '10px 0 0' }}>First create your free Automorai website from the Website tab — it becomes your workspace where Woo orders appear.</p>}
      {st?.connected && (
        <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#344256', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <span>Store: <b>{st.store_url.replace(/^https?:\/\//, '')}</b></span>
          <span style={{ color: '#718096' }}>Last order: {st.last_order_at ? new Date(st.last_order_at).toLocaleString('en-GB') : 'waiting for the first order'}</span>
          <button onClick={onOpenOrders} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, cursor: 'pointer', padding: 0 }}>View orders →</button>
          <button onClick={disconnect} disabled={busy} style={{ marginLeft: 'auto', background: 'none', border: '1px solid #f1c4c4', color: '#c44d4d', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', fontSize: '0.75rem' }}>Disconnect</button>
        </div>
      )}
      {open && !st?.connected && siteId && hasPkg && isBig && (
        <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: '16px' }}>
          <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '0.78rem', color: '#344256', lineHeight: 1.6 }}>
            <li>Open your WordPress admin → <b>WooCommerce → Settings → Advanced → REST API</b>.</li>
            <li>Click <b>Add key</b>. Description: <i>Automorai</i>, Permissions: <b>Read/Write</b> → <b>Generate API key</b>.</li>
            <li>Copy the <b>Consumer key</b> and <b>Consumer secret</b> here and press Connect.</li>
            <li style={{ color: '#718096' }}>We create one order webhook in your store. Your keys are stored encrypted. Disconnect any time.</li>
          </ol>
          <div>
            <input style={box} placeholder="Store address, e.g. https://myshop.com" value={form.store_url} onChange={e => setForm({ ...form, store_url: e.target.value })} />
            <input style={box} placeholder="Consumer key (ck_...)" value={form.consumer_key} onChange={e => setForm({ ...form, consumer_key: e.target.value.trim() })} />
            <input style={box} type="password" placeholder="Consumer secret (cs_...)" value={form.consumer_secret} onChange={e => setForm({ ...form, consumer_secret: e.target.value.trim() })} />
            {err && <p style={{ color: '#c44d4d', fontSize: '0.78rem', margin: '0 0 8px' }}>{err}</p>}
            <button className="amr-btn" style={{ width: '100%' }} disabled={busy || !form.store_url || !form.consumer_key || !form.consumer_secret} onClick={connect}>{busy ? 'Connecting…' : 'Connect WooCommerce'}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── "Install app" button (PWA). Hidden when already opened as an installed app. ──
function InstallAppButton() {
  const isStandalone = typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true);
  const [canPrompt, setCanPrompt] = useState<boolean>(() => typeof window !== 'undefined' && !!(window as any).__amrInstallPrompt);
  const [showHelp, setShowHelp] = useState(false);
  useEffect(() => {
    const on = () => setCanPrompt(!!(window as any).__amrInstallPrompt);
    window.addEventListener('amr-install-ready', on);
    return () => window.removeEventListener('amr-install-ready', on);
  }, []);
  if (isStandalone) return null;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const onClick = async () => {
    const ev = (window as any).__amrInstallPrompt;
    if (ev) {
      ev.prompt();
      try { await ev.userChoice; } catch {}
      (window as any).__amrInstallPrompt = null; setCanPrompt(false);
    } else {
      setShowHelp(v => !v);
    }
  };
  return (
    <div style={{ marginBottom: '10px' }}>
      <button onClick={onClick} style={{ width: '100%', padding: '9px', background: 'linear-gradient(110deg,#19c6ea,#2563eb)', color: '#fff',
        border: 'none', borderRadius: '9px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
        📲 Install app{canPrompt ? '' : ' on your phone'}
      </button>
      {showHelp && (
        <div style={{ marginTop: '8px', background: '#ffffff14', border: '1px solid #ffffff2e', borderRadius: '9px', padding: '10px', fontSize: '0.74rem', color: '#dce8ff', lineHeight: 1.5 }}>
          {isIOS
            ? <>iPhone: open automorai.com in <b>Safari</b> → tap <b>Share</b> (□↑) → <b>Add to Home Screen</b>.</>
            : <>Android: open automorai.com in <b>Chrome</b> → tap <b>⋮</b> (top right) → <b>Install app</b> or <b>Add to Home screen</b>.</>}
          <div style={{ marginTop: '6px', color: '#a9bee5' }}>The Automorai icon will appear on your phone and open your dashboard directly.</div>
        </div>
      )}
    </div>
  );
}

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'inbox' | 'website' | 'builder' | 'products' | 'stock' | 'orders' | 'courier' | 'customers' | 'assistant' | 'marketing' | 'automations' | 'integrations' | 'settings' | 'billing' | 'reports'>('home');
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [packages, setPackages] = useState<string[]>([]);
  // Plan tier from the server: 'starter' | 'business' | 'big' ('' = no package). paidUntil = ISO date the plan runs until.
  const [planTier, setPlanTier] = useState<string>('');
  const [paidUntil, setPaidUntil] = useState<string>('');

  // Home state
  const [commentReply,   setCommentReply]   = useState(true);
  const [messengerReply, setMessengerReply] = useState(true);
  const [connectedPage,  setConnectedPage]  = useState<string | null>(null);
  const [status,         setStatus]         = useState<string>('');
  const [widgetCopied,   setWidgetCopied]   = useState(false);
  const [waPageId,       setWaPageId]       = useState<string | null>(null);

  // Inbox state
  const [conversations,        setConversations]        = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [inboxLoading,         setInboxLoading]         = useState(false);
  const [inboxError,           setInboxError]           = useState('');
  const [replyText,            setReplyText]            = useState('');
  const [replySending,         setReplySending]         = useState(false);
  const [replyError,           setReplyError]           = useState('');

  // Website Builder state
  const [websiteForm, setWebsiteForm] = useState<WebsiteForm>({
    business_name: '', niche: 'kids_wear', whatsapp_number: '', accent_color: '#2563eb',
  });
  const [websiteBuilding,  setWebsiteBuilding]  = useState(false);
  const [websiteResult,    setWebsiteResult]    = useState<{ url: string; business_name: string; site_id?: string; status?: 'draft' | 'active' } | null>(null);
  const [websiteError,     setWebsiteError]     = useState('');
  const [websiteUpdating,  setWebsiteUpdating]  = useState(false);
  const [websiteUpdateMsg, setWebsiteUpdateMsg] = useState('');
  const [websiteUrlCopied, setWebsiteUrlCopied] = useState(false);
  // Custom domain (Cloudflare for SaaS)
  const [showDomain,    setShowDomain]    = useState(false);
  const [domainInput,   setDomainInput]   = useState('');
  const [domainInfo,    setDomainInfo]    = useState<{ has_domain?: boolean; connected?: boolean; domain?: string; ssl_status?: string; hostname_status?: string; cname_target?: string; verification?: string } | null>(null);
  const [domainLoading, setDomainLoading] = useState(false);
  const [domainBusy,    setDomainBusy]    = useState(false);
  const [domainMsg,     setDomainMsg]     = useState('');
  // Free draft sites are only previewed here (never deployed) until the Automation package is bought.
  const [previewHtml,      setPreviewHtml]      = useState('');
  const [previewLoading,   setPreviewLoading]   = useState(false);
  const [previewReloadKey, setPreviewReloadKey] = useState(0);
  const [goingLive,        setGoingLive]        = useState(false);
  const [goLiveError,      setGoLiveError]      = useState('');
  const [previewFullscreen, setPreviewFullscreen] = useState(false);
  const isDraftSite = websiteResult?.status === 'draft';

  // Website Settings (slider + footer) state
  const emptySettings: WebsiteSettings = {
    business_slug: '',
    slide1_img: '', slide1_tag: '', slide1_title: '', slide1_desc: '',
    slide2_img: '', slide2_tag: '', slide2_title: '', slide2_desc: '',
    slide3_img: '', slide3_tag: '', slide3_title: '', slide3_desc: '',
    footer_desc: '',
    logo_img: '',
    nav_menu: [],
    custom_blocks: [],
    bkash_number: '',
    nagad_number: '',
    bank_details: '',
    delivery_charge_dhaka: '',
    delivery_charge_outside: '',
    return_policy: '',
    shop_address: '',
    shop_hours: '',
    fb_pixel_id: '',
    ga_id: '',
    gtm_id: '',
  };
  const [showSettings,     setShowSettings]     = useState(false);
  const [websiteSettings,  setWebsiteSettings]  = useState<WebsiteSettings>(emptySettings);
  const [settingsLoading,  setSettingsLoading]  = useState(false);
  const [settingsSaving,   setSettingsSaving]   = useState(false);
  const [settingsSaved,    setSettingsSaved]    = useState(false);
  const [settingsUploading, setSettingsUploading] = useState<string>(''); // holds which field is uploading, e.g. 'slide1_img'

  // Courier (delivery) integration — account-level credentials, not per-site
  const [courierProvider, setCourierProvider] = useState<'none' | 'steadfast' | 'pathao'>('none');
  const [courierConfigured, setCourierConfigured] = useState<{ steadfast: boolean; pathao: boolean }>({ steadfast: false, pathao: false });
  const [courierForm, setCourierForm] = useState({
    steadfast_api_key: '', steadfast_secret_key: '',
    pathao_client_id: '', pathao_client_secret: '', pathao_username: '', pathao_password: '',
  });
  const [courierSaving, setCourierSaving] = useState(false);
  const [courierSaved, setCourierSaved] = useState(false);
  const [courierError, setCourierError] = useState('');

  // Current site_id (from websiteResult or localStorage)
  const [currentSiteId, setCurrentSiteId] = useState<string>(() => {
    try {
      const setSite = new URLSearchParams(window.location.search).get('set_site');
      if (setSite) { localStorage.setItem('automorai_site_id', setSite); return setSite; }
      return localStorage.getItem('automorai_site_id') || '';
    } catch { return ''; }
  });

  // Products state
  const [products,        setProducts]        = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch,   setProductSearch]   = useState('');
  const [productCatFilter, setProductCatFilter] = useState('');
  // Stock tab: inline stock edits (product_id -> typed value) and which row is saving
  const [stockEdit,    setStockEdit]    = useState<Record<string, string>>({});
  const [stockSavingId, setStockSavingId] = useState<string>('');
  const LOW_STOCK = 5;
  const [showAddProduct,  setShowAddProduct]  = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm,     setProductForm]     = useState<Omit<Product, 'product_id' | 'is_active'>>({
    business_slug: currentSiteId, title: '', description: '', category: '', price: 0, original_price: 0,
    images: [], sizes: [], colors: [], stock: 10,
  });
  const [productSaving,   setProductSaving]   = useState(false);
  const [productError,    setProductError]    = useState('');
  const [sizeInput,       setSizeInput]       = useState('');
  const [colorInput,      setColorInput]      = useState('');
  const [imageInput,      setImageInput]      = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUploading, setImageUploading] = useState(false);

  // Orders state
  const [orders,        setOrders]        = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderSearch,   setOrderSearch]   = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createForm, setCreateForm] = useState({ product_title: '', product_price: 0, quantity: 1, customer_name: '', customer_phone: '', customer_address: '', payment_method: 'cod', delivery_location: 'inside' });
  // Courier delivery-history check per phone (fraud/return risk), keyed by phone
  const [phoneRisk, setPhoneRisk] = useState<Record<string, { found: boolean; delivered: number; returned: number; total: number; return_rate: number; risk: string;
    courier?: { pathao?: { status: string; rating?: string; note?: string }; steadfast?: { status: string; numbers?: Record<string, number>; note?: string } } }>>({});

  // ── Facebook OAuth ──
  const urlParams = new URLSearchParams(window.location.search);
  const fbCode    = urlParams.get('code');

  // The site switch (?set_site=slug) itself already happened in currentSiteId's initializer above,
  // so this just tidies the URL afterward.
  useEffect(() => {
    if (urlParams.get('set_site')) window.history.replaceState({}, '', '/dashboard');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The account's sites (and whether each is a free draft or live) come from the backend,
  // so the right view shows on any browser/device, not just the one that built the site.
  const [mySites, setMySites] = useState<{ business_slug: string; business_name: string; website_url: string; status?: string }[]>([]);

  useEffect(() => {
    if (!user?.email) return;
    getAuthHeader().then(headers => fetch(MY_PACKAGE_API, { headers }))
      .then(res => res.json())
      .then(data => { if (Array.isArray(data.packages)) setPackages(data.packages); setPlanTier(data.tier || ''); setPaidUntil(data.paid_until || ''); })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user?.email) return;
    getAuthHeader().then(headers => fetch(`${MY_WEBSITES_API}?user_id=${encodeURIComponent(user.email)}`, { headers }))
      .then(res => res.json())
      .then(data => {
        const sites: typeof mySites = data.sites || [];
        setMySites(sites);
        const s = sites.find(x => x.business_slug === currentSiteId) || sites[0];
        if (!s) return;
        if (s.business_slug !== currentSiteId) {
          setCurrentSiteId(s.business_slug);
          try { localStorage.setItem('automorai_site_id', s.business_slug); } catch {}
        }
        setWebsiteResult({ url: s.website_url, business_name: s.business_name, site_id: s.business_slug,
          status: s.status === 'draft' ? 'draft' : 'active' });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, currentSiteId]);

  useEffect(() => {
    if (fbCode && !connectedPage && user) {
      setStatus('Facebook connected! Exchanging token...');
      fetch('/api/exchange-token', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: fbCode }) })
        .then(r => r.json())
        .then(tokenData => {
          if (tokenData.error || !tokenData.access_token) {
            setStatus('❌ Token exchange failed: ' + (tokenData.error || 'unknown error')); return;
          }
          setStatus('Setting up automation...');
          return getAuthHeader().then(authHeaders =>
            fetch(WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders },
              body: JSON.stringify({ user_id: user.email, email: user.email, page_id: 'pending',
                page_access_token: tokenData.access_token, comment_reply_enabled: true,
                messenger_reply_enabled: true, timestamp: new Date().toISOString() }) })
              .then(r => r.json())
              .then(webhookData => {
                if (webhookData.error_code === 'no_package') {
                  setStatus('');
                  window.location.href = '/buy-package?package=automation';
                  return;
                }
                setConnectedPage(webhookData.page_name || 'Facebook Page');
                setStatus('✅ Connected successfully!');
                window.history.replaceState({}, '', '/dashboard');
              })
          );
        })
        .catch(() => setStatus('❌ Connection failed. Please try again.'));
    }
  }, [fbCode, connectedPage, user]);

  useEffect(() => {
    if (!user) return;
    getAuthHeader().then(headers =>
      fetch(`https://n8n2.kingpurefood.com/webhook/automorai/inbox?user_id=${encodeURIComponent(user.email)}`, { headers })
        .then(r => r.json()).then(data => { if (data.wa_page_ids?.length > 0) setWaPageId(data.wa_page_ids[0]); })
        .catch(() => {})
    );
  }, [user]);

  useEffect(() => {
    if (activeTab !== 'inbox' || !user) return;
    setInboxLoading(true); setInboxError('');
    getAuthHeader().then(headers =>
      fetch(`${INBOX_API}?user_id=${encodeURIComponent(user.email)}`, { headers })
        .then(r => r.json()).then(data => { setConversations(data.conversations || []); setInboxLoading(false); })
        .catch(() => { setInboxError('Could not load conversations. Please try again.'); setInboxLoading(false); })
    );
  }, [activeTab, user]);

  useEffect(() => {
    if ((activeTab !== 'products' && activeTab !== 'stock' && activeTab !== 'home' && activeTab !== 'assistant') || !currentSiteId) return;
    loadProducts();
  }, [activeTab, currentSiteId]);

  useEffect(() => {
    if (activeTab !== 'website' || !currentSiteId || !showSettings) return;
    loadWebsiteSettings();
    loadCourierSettings();
  }, [activeTab, currentSiteId, showSettings]);

  useEffect(() => {
    if (!['integrations', 'courier', 'marketing'].includes(activeTab) || !user?.email) return;
    loadCourierSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user?.email]);

  useEffect(() => {
    if (!['orders', 'reports', 'home', 'customers', 'assistant', 'courier'].includes(activeTab) || !currentSiteId) return;
    loadOrders();
  }, [activeTab, currentSiteId]);

  // A draft is never deployed, so its preview HTML is regenerated on demand (no deploy happens).
  const loadDraftPreview = async (slug: string) => {
    setPreviewLoading(true);
    try {
      const res = await fetch(WEBSITE_UPDATE_API, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(await getAuthHeader()) },
        body: JSON.stringify({ business_slug: slug, preview_only: true }),
      });
      const data = await res.json();
      if (data.success && data.preview_html) setPreviewHtml(data.preview_html);
    } catch {}
    setPreviewLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'website' && isDraftSite && currentSiteId && !previewHtml && !previewLoading) loadDraftPreview(currentSiteId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isDraftSite, currentSiteId]);

  if (!user) return <p style={{ color: 'white' }}>Please login</p>;

  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await fetch(`${PRODUCTS_API}?business_slug=${encodeURIComponent(currentSiteId)}`, {
        headers: await getAuthHeader(),
      });
      const data = await res.json();
      setProducts(data.success && Array.isArray(data.products) ? data.products : []);
    } catch { setProducts([]); }
    setProductsLoading(false);
  };

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch(`${ORDERS_API}?business_slug=${encodeURIComponent(currentSiteId)}`, {
        headers: await getAuthHeader(),
      });
      const data = await res.json();
      const list = data.success && Array.isArray(data.orders) ? data.orders : [];
      setOrders(list);
      loadPhoneRisks(list);
      loadBookings();
    } catch { setOrders([]); }
    setOrdersLoading(false);
  };

  const handleCreateOrder = async () => {
    setCreateError('');
    const f = createForm;
    if (!currentSiteId) { setCreateError('Select a website first.'); return; }
    if (!f.product_title.trim() || !f.customer_name.trim()) { setCreateError('Product and customer name are required.'); return; }
    if (!/^01[3-9]\d{8}$/.test(f.customer_phone.trim())) { setCreateError('Enter a valid 11-digit mobile number (01XXXXXXXXX).'); return; }
    if (!(Number(f.product_price) > 0)) { setCreateError('Enter a valid price.'); return; }
    setCreateSaving(true);
    try {
      const qty = Number(f.quantity) || 1;
      // owner token: lets the server accept the owner's own price (without it the order is checked like a storefront order)
      const res = await fetch(NEW_ORDER_API, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(await getAuthHeader()) },
        body: JSON.stringify({
          business_slug: currentSiteId, product_title: f.product_title.trim(), product_price: Number(f.product_price), quantity: qty,
          selected_size: '', selected_color: '', customer_name: f.customer_name.trim(), customer_phone: f.customer_phone.trim(), customer_email: '',
          customer_address: f.customer_address.trim(), payment_method: f.payment_method, transaction_id: '', delivery_location: f.delivery_location,
          delivery_charge: 0, total_price: Number(f.product_price) * qty, source: 'manual',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success !== false) {
        setCreateOrderOpen(false);
        setCreateForm({ product_title: '', product_price: 0, quantity: 1, customer_name: '', customer_phone: '', customer_address: '', payment_method: 'cod', delivery_location: 'inside' });
        loadOrders();
        loadProducts();   // stock may have changed
      } else {
        setCreateError(data.error || 'Could not create the order. Make sure your website is live.');
      }
    } catch { setCreateError('Connection error. Please try again.'); }
    setCreateSaving(false);
  };

  // AI Business Assistant — answers only from the store's real loaded orders/products. Never invents numbers.
  const answerAI = (qRaw: string): string => {
    const q = qRaw.toLowerCase();
    const amt = (o: Order) => (Number(o.product_price) || 0) * (Number(o.quantity) || 1);
    const now = Date.now(); const DAY = 86400000;
    const inDays = (d: number) => orders.filter(o => now - new Date(o.created_at).getTime() < d * DAY);
    const live = (list: Order[]) => list.filter(o => (o.status || '').toLowerCase() !== 'cancelled');
    const sumSales = (list: Order[]) => live(list).reduce((s, o) => s + amt(o), 0);
    const taka = (n: number) => '৳' + Math.round(n).toLocaleString();
    const today = new Date().toDateString();
    if (/today/.test(q) && /(sell|sale|sales|revenue|income|koto|bikri|earn)/.test(q)) {
      const t = orders.filter(o => { try { return new Date(o.created_at).toDateString() === today; } catch { return false; } });
      return `Today: ${t.length} order${t.length === 1 ? '' : 's'}, ${taka(sumSales(t))} in sales (cancelled excluded).`;
    }
    if (/(week|7 ?day)/.test(q)) { const l = inDays(7); return `Last 7 days: ${l.length} orders, ${taka(sumSales(l))} in sales.`; }
    if (/(month|30 ?day)/.test(q)) { const l = inDays(30); return `Last 30 days: ${l.length} orders, ${taka(sumSales(l))} in sales.`; }
    if (/(best|top|most)[^.]*(sell|sold|product)|which product/.test(q)) {
      const m: Record<string, { u: number; s: number }> = {};
      live(orders).forEach(o => { const k = o.product_title || 'Unknown'; m[k] = m[k] || { u: 0, s: 0 }; m[k].u += Number(o.quantity) || 1; m[k].s += amt(o); });
      const top = Object.entries(m).sort((a, b) => b[1].s - a[1].s).slice(0, 3);
      if (!top.length) return 'No sales yet, so there is no best-selling product.';
      return 'Best sellers: ' + top.map(([n, v]) => `${n} (${v.u} sold, ${taka(v.s)})`).join('; ') + '.';
    }
    if (/(low stock|out of stock|restock|stock out|kom stock|running out)/.test(q)) {
      const low = products.filter(p => Number(p.stock) <= 5 && Number(p.stock) > 0).map(p => `${p.title} (${p.stock})`);
      const out = products.filter(p => Number(p.stock) === 0).map(p => p.title);
      if (!low.length && !out.length) return 'All products are well stocked. 👍';
      let s = ''; if (out.length) s += `Out of stock: ${out.join(', ')}. `; if (low.length) s += `Low stock: ${low.join(', ')}.`; return s.trim();
    }
    if (/pending/.test(q)) { const p = orders.filter(o => (o.status || '').toLowerCase() === 'pending'); return `You have ${p.length} pending order${p.length === 1 ? '' : 's'} waiting to be processed.`; }
    if (/(how many order|total order|number of order)/.test(q)) return `You have ${orders.length} orders in total for ${wsName}.`;
    if (/customer/.test(q)) { const set = new Set(orders.map(o => (o.customer_phone || o.customer_name || '').trim()).filter(Boolean)); return `You have ${set.size} unique customers so far.`; }
    if (/(how many product|product count|total product)/.test(q)) return `You have ${products.length} products in your catalog.`;
    return "I answer from your real store data. Ask about: today's / this week's / this month's sales, best-selling products, low or out-of-stock items, pending orders, customers, or product count.";
  };
  const askAI = (text?: string) => {
    const q = (text ?? aiInput).trim(); if (!q) return;
    const ans = answerAI(q);
    setAiMessages(m => [...m, { role: 'user', text: q }, { role: 'ai', text: ans }]);
    setAiInput('');
  };

  // check each customer's delivery history (delivered vs returned) from the courier data we collect
  const loadPhoneRisks = async (list: Order[]) => {
    const phones = Array.from(new Set(list.map(o => (o.customer_phone || '').trim()).filter(p => /^01\d{9}$/.test(p))));
    const todo = phones.filter(p => !(p in phoneRisk));
    if (!todo.length) return;
    const auth = await getAuthHeader();
    for (const p of todo) {
      try {
        const res = await fetch(`${COURIER_PHONE_CHECK_API}?phone=${encodeURIComponent(p)}`, { headers: auth });
        const d = await res.json();
        if (d && d.success) setPhoneRisk(prev => ({ ...prev, [p]: d }));
      } catch { /* ignore; badge just won't show */ }
    }
  };

  const handleSaveProduct = async () => {
    if (!productForm.title.trim()) { setProductError('Enter product title'); return; }
    if (!productForm.price) { setProductError('Enter price'); return; }
    if (!currentSiteId) { setProductError('Create a website first'); return; }
    setProductSaving(true); setProductError('');
    try {
      const url = editingProductId ? `${PRODUCTS_API}/update` : `${PRODUCTS_API}/add`;
      const body = editingProductId
        ? { ...productForm, product_id: editingProductId, business_slug: currentSiteId }
        : { ...productForm, business_slug: currentSiteId };
      const res = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(await getAuthHeader()) },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddProduct(false);
        setEditingProductId(null);
        setProductForm({ business_slug: currentSiteId, title: '', description: '', category: '', price: 0, original_price: 0, images: [], sizes: [], colors: [], stock: 10 });
        setSizeInput(''); setColorInput(''); setImageInput('');
        loadProducts();
      } else { setProductError('Could not save. Please try again.'); }
    } catch { setProductError('Connection error।'); }
    setProductSaving(false);
  };

  // Stock: save a new stock number for one product (reuses the product /update endpoint)
  const handleSaveStock = async (p: Product) => {
    const id = p.product_id || '';
    const raw = stockEdit[id];
    const val = Math.max(0, Math.round(Number(raw)));
    if (!id || raw === undefined || isNaN(val)) return;
    setStockSavingId(id);
    try {
      const res = await fetch(`${PRODUCTS_API}/update`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(await getAuthHeader()) },
        body: JSON.stringify({ ...p, stock: val, product_id: id, business_slug: currentSiteId }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts(prev => prev.map(x => (x.product_id === id ? { ...x, stock: val } : x)));
        setStockEdit(prev => { const n = { ...prev }; delete n[id]; return n; });
      }
    } catch { /* keep the typed value so the user can retry */ }
    setStockSavingId('');
  };

  const handleEditProduct = (p: Product) => {
    setEditingProductId(p.product_id || null);
    setProductForm({
      business_slug: currentSiteId, title: p.title, description: p.description || '', category: p.category || '',
      price: p.price, original_price: p.original_price || 0, images: p.images || [], sizes: p.sizes || [], colors: p.colors || [], stock: p.stock,
    });
    setShowAddProduct(true);
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConversation || !user) return;
    setReplySending(true); setReplyError('');
    const messageToSend = replyText.trim();
    try {
      const res = await fetch(REPLY_API, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(await getAuthHeader()) },
        body: JSON.stringify({
          user_id: user.email,
          platform: selectedConversation.platform,
          sender_id: selectedConversation.sender_id,
          page_id: selectedConversation.page_id,
          message: messageToSend,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const sentMsg = { role: 'business', message: messageToSend, timestamp: new Date().toISOString() };
        setSelectedConversation(prev => prev ? { ...prev, messages: [...prev.messages, sentMsg] } : prev);
        setConversations(prev => prev.map(c => c.id === selectedConversation.id
          ? { ...c, messages: [...c.messages, sentMsg], last_message: messageToSend, last_time: sentMsg.timestamp }
          : c));
        setReplyText('');
      } else {
        setReplyError(data.message || 'Could not send reply.');
      }
    } catch {
      setReplyError('Connection error।');
    }
    setReplySending(false);
  };

  const loadWebsiteSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch(`${SETTINGS_API}?business_slug=${encodeURIComponent(currentSiteId)}`, {
        headers: await getAuthHeader(),
      });
      const data = await res.json();
      if (data.success && data.settings) {
        setWebsiteSettings({
          ...emptySettings,
          ...data.settings,
          business_slug: currentSiteId,
          nav_menu: Array.isArray(data.settings.nav_menu) ? data.settings.nav_menu : [],
          custom_blocks: Array.isArray(data.settings.custom_blocks) ? data.settings.custom_blocks : [],
        });
      }
    } catch {}
    setSettingsLoading(false);
  };

  const handleSettingsChange = (field: keyof WebsiteSettings, value: string) =>
    setWebsiteSettings(prev => ({ ...prev, [field]: value }));

  // ── Navigation menu helpers ──
  const addNavItem = () =>
    setWebsiteSettings(prev => ({ ...prev, nav_menu: [...prev.nav_menu, { label: '', link: '', children: [] }] }));
  const removeNavItem = (idx: number) =>
    setWebsiteSettings(prev => ({ ...prev, nav_menu: prev.nav_menu.filter((_, i) => i !== idx) }));
  const updateNavItem = (idx: number, field: 'label' | 'link', value: string) =>
    setWebsiteSettings(prev => ({ ...prev, nav_menu: prev.nav_menu.map((it, i) => i === idx ? { ...it, [field]: value } : it) }));
  const addSubItem = (idx: number) =>
    setWebsiteSettings(prev => ({ ...prev, nav_menu: prev.nav_menu.map((it, i) => i === idx ? { ...it, children: [...(it.children || []), { label: '', link: '' }] } : it) }));
  const removeSubItem = (idx: number, subIdx: number) =>
    setWebsiteSettings(prev => ({ ...prev, nav_menu: prev.nav_menu.map((it, i) => i === idx ? { ...it, children: (it.children || []).filter((_, si) => si !== subIdx) } : it) }));
  const updateSubItem = (idx: number, subIdx: number, field: 'label' | 'link', value: string) =>
    setWebsiteSettings(prev => ({ ...prev, nav_menu: prev.nav_menu.map((it, i) => i === idx ? { ...it, children: (it.children || []).map((c, si) => si === subIdx ? { ...c, [field]: value } : c) } : it) }));

  // ── Extra sections (testimonial / about) helpers ──
  const getTestimonialBlock = (): TestimonialBlock =>
    (websiteSettings.custom_blocks.find(b => b.type === 'testimonial') as TestimonialBlock) || { type: 'testimonial', enabled: false, title: '', items: [] };
  const getAboutBlock = (): AboutBlock =>
    (websiteSettings.custom_blocks.find(b => b.type === 'about') as AboutBlock) || { type: 'about', enabled: false, title: '', body: '', img: '' };
  const setBlock = (block: CustomBlock) =>
    setWebsiteSettings(prev => {
      const rest = prev.custom_blocks.filter(b => b.type !== block.type);
      return { ...prev, custom_blocks: [...rest, block] };
    });
  const addTestimonialItem = () => {
    const b = getTestimonialBlock();
    setBlock({ ...b, items: [...b.items, { name: '', text: '', rating: 5 }] });
  };
  const removeTestimonialItem = (idx: number) => {
    const b = getTestimonialBlock();
    setBlock({ ...b, items: b.items.filter((_, i) => i !== idx) });
  };
  const updateTestimonialItem = (idx: number, field: keyof TestimonialItem, value: string) => {
    const b = getTestimonialBlock();
    setBlock({ ...b, items: b.items.map((it, i) => i === idx ? { ...it, [field]: field === 'rating' ? (parseInt(value) || 5) : value } : it) });
  };

  const handleSettingsImageUpload = async (field: keyof WebsiteSettings, file: File | null) => {
    if (!file) return;
    setSettingsUploading(field);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `slide-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const res = await fetch(`${SUPABASE_URL}/storage/v1/object/product-images/${fileName}`, {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': file.type },
        body: file,
      });
      if (res.ok) {
        const url = `${SUPABASE_URL}/storage/v1/object/public/product-images/${fileName}`;
        handleSettingsChange(field, url);
      }
    } catch {}
    setSettingsUploading('');
  };

  const loadCourierSettings = async () => {
    try {
      const res = await fetch(COURIER_SETTINGS_API, { headers: await getAuthHeader() });
      const data = await res.json();
      if (data.success) {
        setCourierProvider((data.provider as 'none' | 'steadfast' | 'pathao') || 'none');
        const configured = { steadfast: !!data.steadfast_configured, pathao: !!data.pathao_configured };
        setCourierConfigured(configured);
        return configured;
      }
    } catch {}
    return null;
  };

  const handleCourierFormChange = (field: keyof typeof courierForm, value: string) =>
    setCourierForm(prev => ({ ...prev, [field]: value }));

  const handleSaveCourierSettings = async () => {
    setCourierSaving(true); setCourierSaved(false); setCourierError('');
    const failMsg = 'Could not save. Please try again. If it keeps failing, contact support.';
    try {
      const res = await fetch(`${COURIER_SETTINGS_API}/save`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(await getAuthHeader()) },
        body: JSON.stringify({ provider: courierProvider, ...courierForm }),
      });
      const data = await res.json();
      if (data.success) {
        // Read it back: only say "Saved" when the server really has the keys.
        const configured = await loadCourierSettings();
        const ok = courierProvider === 'none' || (configured && configured[courierProvider]);
        if (ok) {
          setCourierSaved(true); setTimeout(() => setCourierSaved(false), 2500);
          setCourierForm({ steadfast_api_key: '', steadfast_secret_key: '', pathao_client_id: '', pathao_client_secret: '', pathao_username: '', pathao_password: '' });
        } else {
          setCourierError(failMsg);
        }
      } else {
        setCourierError(data.error || failMsg);
      }
    } catch {
      setCourierError(failMsg);
    }
    setCourierSaving(false);
  };

  const handleSaveSettings = async () => {
    if (!currentSiteId) return;
    setSettingsSaving(true); setSettingsSaved(false);
    try {
      const res = await fetch(`${SETTINGS_API}/save`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(await getAuthHeader()) },
        body: JSON.stringify({ ...websiteSettings, business_slug: currentSiteId }),
      });
      const data = await res.json();
      if (data.success) { setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 2500); }
    } catch {}
    setSettingsSaving(false);
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setImageUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      try {
        const res = await fetch(`${SUPABASE_URL}/storage/v1/object/product-images/${fileName}`, {
          method: 'POST',
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': file.type },
          body: file,
        });
        if (res.ok) {
          uploaded.push(`${SUPABASE_URL}/storage/v1/object/public/product-images/${fileName}`);
        }
      } catch {}
    }
    if (uploaded.length > 0) {
      setProductForm(p => ({ ...p, images: [...p.images, ...uploaded] }));
    }
    setImageUploading(false);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await fetch(`${PRODUCTS_API}/delete?product_id=${encodeURIComponent(productId)}`, {
        method: 'DELETE', headers: await getAuthHeader(),
      });
      loadProducts();
    } catch {}
  };

  // Titles the website builder auto-generates as placeholder products (see n8n "Add Sample Products").
  // Matched by title rather than a marker in the description, since the description shown to real
  // customers is a normal-looking product description with no "this is a sample" wording.
  const SAMPLE_PRODUCT_TITLES = new Set([
    'Party Frock', 'Cotton Dress', 'T-Shirt Set', 'Shorts Set', 'Baby Onesie', 'Soft Blanket', 'Baby Cap', 'Socks Set',
    'Floral Dress', 'Casual Top', 'Cotton Shirt', 'Denim Jeans', 'Wool Sweater', 'Puffer Jacket', 'Leather Belt', 'Sunglasses',
    'Smartphone Case', 'Screen Protector', 'Laptop Sleeve', 'Cooling Pad', 'Wireless Earbuds', 'Bluetooth Speaker', 'Power Bank', 'USB Cable',
    'Premium Rice 5kg', 'Organic Wheat Flour', 'Fresh Vegetable Box', 'Organic Greens Pack', 'Fresh Fish Pack', 'Chicken Pack', 'Spice Mix Pack', 'Turmeric Powder',
    'Face Serum', 'Moisturizer Cream', 'Lipstick Set', 'Foundation', 'Hair Oil', 'Shampoo Set', 'Eau de Parfum', 'Body Mist',
    'Vitamin C Tablets', 'Pain Relief Tablets', 'Hand Sanitizer', 'First Aid Kit', 'Baby Lotion', 'Diaper Pack', 'Digital Thermometer', 'BP Monitor',
    'Wooden Side Table', 'Cushion Chair', 'Wall Clock', 'Framed Wall Art', 'Table Lamp', 'LED String Light', 'Storage Basket', 'Photo Frame Set',
    'Running Shoes', 'Sports Sneakers', 'Track Suit', 'Gym T-Shirt', 'Yoga Mat', 'Dumbbell Set', 'Sports Water Bottle', 'Sports Cap',
    'Silver Ring', 'Gold-Plated Ring', 'Pendant Necklace', 'Chain Necklace', 'Stud Earrings', 'Hoop Earrings', 'Analog Watch', 'Smart Watch',
    'Trending Item', 'Bestseller Item', 'New Arrival', 'Just Launched', 'Discount Pick', 'Special Offer Item', 'Featured Pick', 'Staff Favorite',
  ]);
  const isSampleProduct = (p: Product) => SAMPLE_PRODUCT_TITLES.has(p.title);

  const handleDeleteAllSamples = async () => {
    const samples = products.filter(isSampleProduct);
    if (!samples.length) return;
    if (!confirm(`${samples.length} sample product(s) will be deleted. Are you sure?`)) return;
    for (const p of samples) {
      if (!p.product_id) continue;
      try {
        await fetch(`${PRODUCTS_API}/delete?product_id=${encodeURIComponent(p.product_id)}`, {
          method: 'DELETE', headers: await getAuthHeader(),
        });
      } catch {}
    }
    loadProducts();
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await fetch(ORDER_STATUS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeader()) },
        body: JSON.stringify({ order_id: orderId, status }),
      });
      loadOrders();
      if (status === 'cancelled' || status === 'pending') loadProducts();   // cancel gives stock back
    } catch {}
  };

  // ── Courier booking (Steadfast) ──
  const [bookings, setBookings] = useState<Record<string, { tracking_code: string; consignment_id: string; courier_status: string; created_at: string }>>({});
  const [bookingOrderId, setBookingOrderId] = useState('');

  const loadBookings = async () => {
    try {
      const res = await fetch(`${COURIER_BOOKINGS_API}?business_slug=${encodeURIComponent(currentSiteId)}`, { headers: await getAuthHeader() });
      const d = await res.json();
      if (d && d.success && d.bookings) setBookings(d.bookings);
    } catch {}
  };

  const handleSendToCourier = async (o: Order) => {
    if (!courierConfigured.steadfast) { alert('First save your Steadfast API keys in Settings → Courier Integration.'); return; }
    if (!window.confirm(`Book this parcel with Steadfast?\n${o.customer_name}, ${o.customer_phone}\nCOD ৳${o.product_price * o.quantity + (o.delivery_charge || 0)}`)) return;
    setBookingOrderId(o.id);
    try {
      const res = await fetch(COURIER_BOOK_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeader()) },
        body: JSON.stringify({
          business_slug: currentSiteId, order_id: o.id,
          recipient_name: o.customer_name, recipient_phone: o.customer_phone, recipient_address: o.customer_address,
          cod_amount: o.product_price * o.quantity + (o.delivery_charge || 0),
          item_description: `${o.product_title} (x${o.quantity})`,
        }),
      });
      const d = await res.json();
      if (d.success) { await loadBookings(); await handleUpdateOrderStatus(o.id, 'shipped'); }
      else alert('Could not book: ' + (d.error || 'unknown error'));
    } catch { alert('Could not reach the courier service. Try again.'); }
    setBookingOrderId('');
  };

  // ── Courier booking (Pathao) ──
  type GeoItem = { id: number; name: string };
  const [pathaoOrder, setPathaoOrder] = useState<Order | null>(null);
  const [geoStores, setGeoStores] = useState<GeoItem[]>([]);
  const [geoCities, setGeoCities] = useState<GeoItem[]>([]);
  const [geoZones, setGeoZones] = useState<GeoItem[]>([]);
  const [geoAreas, setGeoAreas] = useState<GeoItem[]>([]);
  const [geoSel, setGeoSel] = useState<{ store: string; city: string; zone: string; area: string }>({ store: '', city: '', zone: '', area: '' });
  const [geoLoading, setGeoLoading] = useState('');
  const [pathaoBooking, setPathaoBooking] = useState(false);

  const fetchGeo = async (kind: string, id?: string | number): Promise<GeoItem[]> => {
    try {
      const url = `${COURIER_PATHAO_GEO_API}?kind=${kind}${id != null ? `&id=${id}` : ''}`;
      const res = await fetch(url, { headers: await getAuthHeader() });
      const d = await res.json();
      return (d && d.success && Array.isArray(d.items)) ? d.items : [];
    } catch { return []; }
  };

  const openPathaoBooking = async (o: Order) => {
    if (!courierConfigured.pathao) { alert('First save your Pathao API keys in Settings → Courier Integration.'); return; }
    setPathaoOrder(o);
    setGeoSel({ store: '', city: '', zone: '', area: '' });
    setGeoZones([]); setGeoAreas([]);
    setGeoLoading('loading');
    const [stores, cities] = await Promise.all([fetchGeo('store'), fetchGeo('city')]);
    setGeoStores(stores); setGeoCities(cities);
    setGeoSel(s => ({ ...s, store: stores.length === 1 ? String(stores[0].id) : '' }));
    setGeoLoading('');
  };

  const onGeoCity = async (cityId: string) => {
    setGeoSel(s => ({ ...s, city: cityId, zone: '', area: '' }));
    setGeoZones([]); setGeoAreas([]);
    if (!cityId) return;
    setGeoLoading('zone');
    setGeoZones(await fetchGeo('zone', cityId));
    setGeoLoading('');
  };
  const onGeoZone = async (zoneId: string) => {
    setGeoSel(s => ({ ...s, zone: zoneId, area: '' }));
    setGeoAreas([]);
    if (!zoneId) return;
    setGeoLoading('area');
    setGeoAreas(await fetchGeo('area', zoneId));
    setGeoLoading('');
  };

  const confirmPathaoBooking = async () => {
    const o = pathaoOrder;
    if (!o) return;
    if (!geoSel.store || !geoSel.city || !geoSel.zone) { alert('Please select store, city and zone.'); return; }
    setPathaoBooking(true);
    try {
      const res = await fetch(COURIER_BOOK_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeader()) },
        body: JSON.stringify({
          provider: 'pathao', business_slug: currentSiteId, order_id: o.id,
          recipient_name: o.customer_name, recipient_phone: o.customer_phone, recipient_address: o.customer_address,
          cod_amount: o.product_price * o.quantity + (o.delivery_charge || 0),
          item_description: `${o.product_title} (x${o.quantity})`,
          store_id: Number(geoSel.store), recipient_city: Number(geoSel.city),
          recipient_zone: Number(geoSel.zone), recipient_area: geoSel.area ? Number(geoSel.area) : undefined,
        }),
      });
      const d = await res.json();
      if (d.success) { await loadBookings(); await handleUpdateOrderStatus(o.id, 'shipped'); setPathaoOrder(null); }
      else alert('Could not book: ' + (d.error || 'unknown error'));
    } catch { alert('Could not reach the courier service. Try again.'); }
    setPathaoBooking(false);
  };

  const handleFacebookConnect = () => {
    const fbURL = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&config_id=${CONFIG_ID}&response_type=code`;
    window.location.href = fbURL;
  };
  const handleWhatsAppConnect = () => { window.location.href = '/connect-whatsapp'; };
    // Own website → self-serve IDs in Settings (applied live, no rebuild). No website yet → old request form.
    const handlePixelGAConnect  = () => {
      if (!currentSiteId) { window.location.href = '/connect-pixel-ga'; return; }
      setActiveTab('website'); setShowSettings(true);
      setTimeout(() => document.getElementById('amr-tracking')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 700);
    };

  const handleToggleChange = (type: 'comment' | 'messenger', value: boolean) => {
    if (type === 'comment') setCommentReply(value); else setMessengerReply(value);
    fetch(WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.email,
        comment_reply_enabled: type === 'comment' ? value : commentReply,
        messenger_reply_enabled: type === 'messenger' ? value : messengerReply }) });
  };

  const handleWebsiteFormChange = (field: keyof WebsiteForm, value: string) =>
    setWebsiteForm(prev => ({ ...prev, [field]: value }));

  const handleBuildWebsite = async () => {
    if (!websiteForm.business_name.trim()) { setWebsiteError('Enter business name'); return; }
    if (!websiteForm.whatsapp_number.trim()) { setWebsiteError('Enter WhatsApp number'); return; }
    setWebsiteBuilding(true); setWebsiteError(''); setWebsiteResult(null);
    try {
      const res = await fetch(WEBSITE_BUILDER_API, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(await getAuthHeader()) },
        body: JSON.stringify({
          business_name: websiteForm.business_name,
          niche: websiteForm.niche,
          whatsapp_number: websiteForm.whatsapp_number,
          accent_color: websiteForm.accent_color,
          user_id: user.email,
        }),
      });
      const data = await res.json();
      if (data.success && (data.website_url || data.status === 'draft')) {
        const isDraft = data.status === 'draft';
        setWebsiteResult({ url: data.website_url || '', business_name: websiteForm.business_name, site_id: data.slug,
          status: isDraft ? 'draft' : 'active' });
        setPreviewHtml(isDraft ? (data.preview_html || '') : '');
        if (data.slug) {
          setCurrentSiteId(data.slug);
          try { localStorage.setItem('automorai_site_id', data.slug); } catch {}
          setProductForm(prev => ({ ...prev, business_slug: data.slug }));
        }
      } else if (data.error_code === 'limit_reached') {
        setWebsiteError('You already have a website on this account. Contact support to add another.');
      } else {
        setWebsiteError('Could not create website. Please try again.');
      }
    } catch { setWebsiteError('Connection error. Please try again.'); }
    setWebsiteBuilding(false);
  };

  const handleGoLive = async () => {
    if (!currentSiteId) return;
    setGoingLive(true); setGoLiveError('');
    try {
      const res = await fetch(WEBSITE_UPDATE_API, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(await getAuthHeader()) },
        body: JSON.stringify({ business_slug: currentSiteId }),
      });
      const data = await res.json();
      if (data.success && data.website_url) {
        setWebsiteResult(prev => prev ? { ...prev, url: data.website_url, status: 'active' } : prev);
        setPreviewHtml('');
      } else {
        setGoLiveError('Could not make the website live. Please try again.');
      }
    } catch {
      setGoLiveError('Connection error. Please try again.');
    }
    setGoingLive(false);
  };

  // Shown only inside the sandboxed preview: orders/chat are refused server-side for drafts anyway,
  // this just tells the owner why instead of looking broken.
  const PREVIEW_GUARD = '<script>window.__AMR_PREVIEW=true;(function(){var f=window.fetch;window.fetch=function(u,o){var s=String(u||"");'
    + 'if(s.indexOf("/new-order")>-1){alert("Preview mode: orders start working once your website is live.");'
    + 'return Promise.resolve(new Response(JSON.stringify({success:false}),{headers:{"Content-Type":"application/json"}}));}'
    + 'if(s.indexOf("/storefront-chat")>-1){return Promise.resolve(new Response(JSON.stringify({reply:"Preview mode: chat works once the website is live."}),{headers:{"Content-Type":"application/json"}}));}'
    + 'return f.apply(this,arguments);};})();</' + 'script>';
  const previewDoc = previewHtml ? previewHtml.replace(/<head[^>]*>/i, m => m + PREVIEW_GUARD) : '';

  const handleUpdateWebsite = async () => {
    if (!currentSiteId) return;
    // a shop published from the Website Builder would lose that design here — say so clearly
    const builderLive = (await liveDesignKind(currentSiteId).catch(() => null)) === 'builder';
    if (builderLive && !confirm('Your live shop shows a design published from the Website Builder. Updating here replaces it with the standard template design (your builder design is kept — you can publish it again from Website Builder). Continue?')) return;
    if (!builderLive && !confirm('Update this website to the latest design and features? Your products and settings stay exactly as they are — only the site’s look and features get refreshed.')) return;
    setWebsiteUpdating(true); setWebsiteUpdateMsg('');
    try {
      const res = await fetch(WEBSITE_UPDATE_API, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(await getAuthHeader()) },
        body: JSON.stringify({ business_slug: currentSiteId }),
      });
      const data = await res.json();
      if (data.success) {
        setWebsiteUpdateMsg('Updated! Your website now has the latest design and features.');
      } else {
        setWebsiteUpdateMsg('Could not update the website. Please try again.');
      }
    } catch {
      setWebsiteUpdateMsg('Connection error. Please try again.');
    }
    setWebsiteUpdating(false);
  };

  // ----- Custom domain -----
  const loadDomainStatus = async () => {
    if (!currentSiteId) return;
    setDomainLoading(true);
    try {
      const res = await fetch(`${CUSTOM_DOMAIN_API}/status?business_slug=${encodeURIComponent(currentSiteId)}`, { headers: await getAuthHeader() });
      const data = await res.json();
      if (data.success) setDomainInfo(data);
    } catch { /* ignore */ }
    setDomainLoading(false);
  };

  const handleConnectDomain = async () => {
    if (!currentSiteId) return;
    const d = domainInput.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/\.$/, '');
    if (!/^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(d.replace(/^www\./, ''))) {
      setDomainMsg('Please enter a valid domain, e.g. shop.yourbrand.com'); return;
    }
    setDomainBusy(true); setDomainMsg('');
    try {
      const res = await fetch(`${CUSTOM_DOMAIN_API}/connect`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(await getAuthHeader()) },
        body: JSON.stringify({ business_slug: currentSiteId, domain: d }),
      });
      const data = await res.json();
      if (data.success) {
        setDomainMsg('ok');
        setDomainInput('');
        await loadDomainStatus();
      } else {
        setDomainMsg(data.error || 'Could not connect the domain. Please try again.');
      }
    } catch {
      setDomainMsg('Connection error. Please try again.');
    }
    setDomainBusy(false);
  };

  const handleDisconnectDomain = async () => {
    if (!currentSiteId) return;
    if (!confirm('Disconnect this custom domain? Your store will still work on its normal link; only the custom domain stops working.')) return;
    setDomainBusy(true); setDomainMsg('');
    try {
      const res = await fetch(`${CUSTOM_DOMAIN_API}/disconnect`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(await getAuthHeader()) },
        body: JSON.stringify({ business_slug: currentSiteId }),
      });
      const data = await res.json();
      if (data.success) { setDomainInfo(null); setDomainMsg(''); await loadDomainStatus(); }
      else setDomainMsg(data.error || 'Could not disconnect. Please try again.');
    } catch { setDomainMsg('Connection error. Please try again.'); }
    setDomainBusy(false);
  };

  const formatTime = (ts: string) => {
    if (!ts) return '';
    try {
      const d = new Date(ts); const now = new Date();
      const diffH = (now.getTime() - d.getTime()) / 36e5;
      if (diffH < 24) return d.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
      return d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' });
    } catch { return ''; }
  };

  const statusColors: Record<string, string> = {
    pending: '#ffb84c', confirmed: '#2563eb', shipped: '#0099FF', delivered: '#25D366', cancelled: '#c44d4d'
  };
  const paymentLabels: Record<string, string> = { cod: '🚚 Cash on Delivery', bkash: '📱 bKash', nagad: '💵 Nagad', bank: '🏦 Bank Transfer' };

  const niches = [
    { value: 'kids_wear', label: '👶 Kids Wear' }, { value: 'clothing', label: '👗 Fashion / Clothing' },
    { value: 'electronics', label: '⚡ Electronics' }, { value: 'food', label: '🌿 Food' },
    { value: 'beauty', label: '💄 Beauty / Cosmetics' }, { value: 'pharmacy', label: '💊 Pharmacy' },
    { value: 'home_decor', label: '🏠 Home Decor' }, { value: 'sports', label: '🏀 Sports' },
    { value: 'jewelry', label: '💍 Jewelry' }, { value: 'general', label: '🛒 General Store' },
  ];

  const commonSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
  const commonColors = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Gray', 'Navy', 'Brown'];

  const navTabs = [
    { key: 'home' as const, label: 'Overview', Icon: LayoutDashboard, group: 'Main menu' },
    { key: 'inbox' as const, label: 'Unified Inbox', Icon: InboxIcon, group: 'Main menu' },
    { key: 'website' as const, label: 'Website & Store', Icon: Globe, group: 'Main menu' },
    { key: 'builder' as const, label: 'Website Builder (beta)', Icon: LayoutTemplate, group: 'Main menu' },
    { key: 'products' as const, label: 'Products', Icon: Package, group: 'Main menu' },
    { key: 'stock' as const, label: 'Inventory', Icon: Boxes, group: 'Main menu' },
    { key: 'orders' as const, label: 'Orders', Icon: ShoppingBag, group: 'Main menu' },
    { key: 'courier' as const, label: 'Courier & Delivery', Icon: Truck, group: 'Main menu' },
    { key: 'customers' as const, label: 'Customers', Icon: Users, group: 'Main menu' },
    { key: 'reports' as const, label: 'Analytics', Icon: BarChart3, group: 'Main menu' },
    { key: 'marketing' as const, label: 'Marketing & Pixel', Icon: Megaphone, group: 'Growth & tools' },
    { key: 'automations' as const, label: 'AI & Automations', Icon: Workflow, group: 'Growth & tools' },
    { key: 'assistant' as const, label: 'AI Assistant', Icon: Sparkles, group: 'Growth & tools' },
    { key: 'integrations' as const, label: 'Integrations', Icon: Plug, group: 'Growth & tools' },
    { key: 'settings' as const, label: 'Settings', Icon: SettingsIcon, group: 'Growth & tools' },
    { key: 'billing' as const, label: 'Billing', Icon: CreditCard, group: 'Growth & tools' },
  ];
  const curTab = navTabs.find(t => t.key === activeTab);
  const wsName = websiteResult?.business_name || (mySites[0]?.business_name) || 'My Store';
  const wsInitials = (wsName.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2) || 'A').toUpperCase();

  return (
    <div style={{ minHeight: '100vh', background: '#f3f6fb', fontFamily: "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif", color: '#17243b', display: 'flex' }}>

      <style>{`
        /* ===== Automor.ai dashboard design tokens (navy / electric-blue / cyan) ===== */
        .amr-sidebar { width: 248px; min-width: 248px; position: sticky; top: 0; left: auto; }
        .amr-sidebar-overlay { display: none; }
        .amr-mobile-topbar { display: none; }
        .amr-card { background:#fff; border:1px solid #e4eaf3; border-radius:14px; padding:18px; box-shadow:0 8px 26px rgba(15,39,83,.06); }
        .amr-pagehead h1 { font-size:1.55rem; margin:4px 0; color:#12284c; letter-spacing:-.4px; }
        .amr-eyebrow { font-size:.68rem; letter-spacing:1px; text-transform:uppercase; color:#2563eb; font-weight:800; }
        .amr-sub { color:#718096; font-size:.85rem; }
        .amr-btn { border:1px solid #e4eaf3; background:#fff; color:#29405f; padding:10px 15px; border-radius:9px; font-weight:650; cursor:pointer; font-size:.82rem; transition:.15s; }
        .amr-btn:hover { filter:brightness(.98); transform:translateY(-1px); }
        .amr-btn-primary { background:linear-gradient(110deg,#2563eb,#16b8e8); color:#fff; border:0; box-shadow:0 6px 14px #2563eb33; }
        .amr-stat-num { font-size:1.55rem; font-weight:800; letter-spacing:-.6px; margin:11px 0 5px; color:#10264b; }
        .amr-stat-ico { width:36px; height:36px; border-radius:10px; display:grid; place-items:center; background:#eaf2ff; color:#2563eb; font-size:17px; }
        .amr-pill { display:inline-flex; padding:4px 9px; border-radius:20px; font-size:.66rem; font-weight:700; }
        .amr-pill.pending{background:#fff4df;color:#b87914}.amr-pill.processing{background:#e8f2ff;color:#2563eb}
        .amr-pill.delivered{background:#e4f8ef;color:#159768}.amr-pill.cancelled{background:#ffeded;color:#c44d4d}
        .amr-table { border-collapse:collapse; width:100%; font-size:.8rem; }
        .amr-table th { text-align:left; color:#8794a8; font-weight:600; font-size:.62rem; text-transform:uppercase; letter-spacing:.5px; padding:10px 8px; border-bottom:1px solid #e4eaf3; }
        .amr-table td { padding:12px 8px; border-bottom:1px solid #edf1f6; color:#40536f; }
        .amr-table tr:last-child td { border-bottom:0; }
        .amr-input { width:100%; box-sizing:border-box; border:1px solid #dbe3f0; border-radius:10px; padding:11px 13px; font:inherit; font-size:.9rem; color:#17243b; background:#fff; }
        .amr-input:focus { outline:none; border-color:#2563eb; box-shadow:0 0 0 3px #2563eb1f; }
        @media (max-width: 860px){ .amr-overview-grid{ grid-template-columns:1fr !important; } }
        @media (max-width: 760px){ .amr-inbox{ grid-template-columns:1fr !important; } }
        .amr-stats4 { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; }
        .amr-quick4 { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; }
        @media (max-width: 1050px){ .amr-stats4, .amr-quick4 { grid-template-columns:repeat(2,minmax(0,1fr)); } }
        .amr-desktop-topbar { display:flex; }
        @media (max-width: 768px){ .amr-desktop-topbar{ display:none !important; } }
        .amr-mobile-topbar { display: none; }
        @media (max-width: 768px) {
          .amr-sidebar {
            position: fixed !important; left: -268px; top: 0; z-index: 210; width: 264px; min-width: 264px;
            box-shadow: 15px 0 40px rgba(7,26,60,.4); transition: left 0.25s;
          }
          .amr-sidebar.open { left: 0 !important; }
          .amr-sidebar-overlay.open {
            display: block; position: fixed; inset: 0; background: rgba(7,20,38,.55); z-index: 205;
          }
          .amr-mobile-topbar { display: flex !important; }
          .amr-sidebar-close { display: inline-flex !important; }
        }
      `}</style>

      {/* ── Sidebar ── */}
      <div className={`amr-sidebar${sidebarOpen ? ' open' : ''}`} style={{ background: 'linear-gradient(180deg,#0a1f5c,#10264b)', color: '#dce8ff',
        display: 'flex', flexDirection: 'column', height: '100dvh', maxHeight: '100dvh', overflowY: 'auto' }}>
        <div style={{ padding: '22px 18px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800, fontSize: '1.2rem', color: '#fff', letterSpacing: '.2px' }}>
            <span style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg,#2563eb,#16b8e8)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 900, boxShadow: '0 5px 15px #07183e' }}>A</span>
            <span>Automor<span style={{ color: '#26c9ef' }}>ai</span></span>
          </span>
          <button className="amr-sidebar-close" onClick={() => setSidebarOpen(false)} style={{
            display: 'none', background: 'transparent', border: 'none', color: '#9db9ee', fontSize: '1.3rem', cursor: 'pointer',
          }}>✕</button>
        </div>
        <div onClick={() => { setActiveTab('home'); setSidebarOpen(false); }}
          style={{ margin: '2px 14px 16px', padding: '11px 12px', border: '1px solid #ffffff24', borderRadius: '12px', background: '#ffffff0d', cursor: 'pointer' }}>
          <div style={{ color: '#9db9ee', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Workspace</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '5px' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wsName}</span>
            <ChevronDown size={14} color="#9db9ee" style={{ flex: 'none' }} />
          </div>
        </div>
        <div style={{ flex: '1 0 auto', padding: '0 12px' }}>
          {navTabs.map((tab, idx) => {
            const on = activeTab === tab.key;
            const Ic = tab.Icon;
            const showGroup = idx === 0 || navTabs[idx - 1].group !== tab.group;
            return (
            <Fragment key={tab.key}>
            {showGroup && <div style={{ fontSize: '.58rem', textTransform: 'uppercase', letterSpacing: '1.2px', color: '#8da8d8', padding: idx === 0 ? '0 8px 7px' : '15px 8px 7px', fontWeight: 700 }}>{tab.group}</div>}
            <button onClick={() => { setActiveTab(tab.key); setSidebarOpen(false); }} style={{
              display: 'flex', alignItems: 'center', gap: '12px', width: '100%', textAlign: 'left',
              padding: '11px 13px', borderRadius: '10px', border: 'none', cursor: 'pointer', marginBottom: '3px',
              fontWeight: 600, fontSize: '0.88rem',
              background: on ? 'linear-gradient(90deg,#2563eb,#1c74df)' : 'transparent',
              color: on ? '#fff' : '#c6d6f4', boxShadow: on ? '0 5px 14px #07183e55' : 'none', transition: 'all 0.15s',
            }}>
              <Ic size={18} strokeWidth={2} /><span>{tab.label}</span>
              {tab.key === 'inbox' && conversations.length > 0 && <span style={{ marginLeft: 'auto', background: '#26c9ef', color: '#09265a', borderRadius: '20px', padding: '1px 7px', fontSize: '0.62rem', fontWeight: 800 }}>{conversations.length}</span>}
            </button>
            </Fragment>
          );})}
        </div>
        <div style={{ padding: '14px 18px', borderTop: '1px solid #ffffff20' }}>
          <div style={{ color: '#26c9ef', fontSize: '0.72rem', fontWeight: 600, marginBottom: '8px' }}>● All systems operational</div>
          <InstallAppButton />
          <div style={{ color: '#a9bee5', fontSize: '0.72rem', marginBottom: '10px', wordBreak: 'break-all' }}>{user.email}</div>
          <button onClick={logout} style={{ width: '100%', padding: '9px', background: '#ffffff12',
            color: '#dce8ff', border: '1px solid #ffffff2e', borderRadius: '9px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      <div className={`amr-sidebar-overlay${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* ── Main content ── */}
      <div style={{ flex: 1, minWidth: 0, height: '100vh', overflowY: 'auto' }}>
        <div className="amr-mobile-topbar" style={{
          alignItems: 'center', gap: '14px', padding: '12px 16px', background: '#fff',
          borderBottom: '1px solid #e4eaf3', position: 'sticky', top: 0, zIndex: 100,
        }}>
          <button onClick={() => setSidebarOpen(true)} style={{
            background: '#eef4ff', border: 'none', color: '#17243b', fontSize: '1.2rem', cursor: 'pointer', padding: '7px 10px', borderRadius: '9px',
          }}>☰</button>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '1.1rem', color: '#12284c' }}>
            <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg,#2563eb,#16b8e8)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 900, fontSize: '0.9rem' }}>A</span>
            <span>Automor<span style={{ color: '#2563eb' }}>ai</span></span>
          </span>
        </div>

        {/* ── Desktop topbar ── */}
        <div className="amr-desktop-topbar" style={{ alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', height: '66px', background: '#fff', borderBottom: '1px solid #e4eaf3', position: 'sticky', top: 0, zIndex: 90 }}>
          <div style={{ fontSize: '0.82rem', color: '#718096' }}>Workspace / <b style={{ color: '#17243b' }}>{curTab?.label || 'Overview'}</b></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button title="Notifications" onClick={() => setActiveTab('inbox')} style={{ position: 'relative', width: '37px', height: '37px', border: '1px solid #e4eaf3', borderRadius: '10px', background: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
              <Bell size={17} color="#52647d" />
              {conversations.length > 0 && <span style={{ position: 'absolute', right: '7px', top: '6px', width: '7px', height: '7px', background: '#ef5d5d', borderRadius: '50%', border: '1px solid #fff' }} />}
            </button>
            <button onClick={() => setActiveTab('settings')} title="Account & settings" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'grid', placeItems: 'center', background: '#dcecff', color: '#0a1f5c', fontWeight: 800, fontSize: '0.8rem' }}>{wsInitials}</div>
              <div style={{ fontSize: '0.78rem', lineHeight: 1.2, textAlign: 'left' }}>
                <div style={{ fontWeight: 700, color: '#17243b' }}>{wsName}</div>
                <div style={{ color: '#8290a4' }}>Store Admin</div>
              </div>
            </button>
          </div>
        </div>

      {/* ════════ HOME TAB ════════ */}
      {activeTab === 'home' && (
        <div style={{ padding: '40px 32px', maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', marginBottom: '22px' }}>
            <div>
              <div className="amr-eyebrow">Business command center</div>
              <h1 style={{ fontSize: '1.55rem', margin: '4px 0 2px', color: '#12284c', letterSpacing: '-0.4px' }}>{(() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; })()}, {wsName} 👋</h1>
              <p className="amr-sub" style={{ margin: 0 }}>Here's what's happening in your business today.</p>
            </div>
            <div style={{ display: 'flex', gap: '9px', flexWrap: 'wrap' }}>
              <span className="amr-btn" style={{ cursor: 'default' }}>📅 Today</span>
              <button className="amr-btn amr-btn-primary" style={{ color: '#fff' }} onClick={() => { setCreateError(''); setCreateOrderOpen(true); }}>＋ Create Order</button>
            </div>
          </div>

          {status && (
            <div style={{ background: '#eaf2ff', border: '1px solid #cfe0ff', borderRadius: '10px',
              padding: '12px 14px', marginBottom: '20px', fontSize: '0.9rem', color: '#1b4dd1', fontWeight: 600 }}>{status}</div>
          )}

          {currentSiteId && !isDraftSite && (() => {
            const amt = (o: Order) => (Number(o.product_price) || 0) * (Number(o.quantity) || 1) + (Number(o.delivery_charge) || 0);
            const today = new Date().toDateString();
            const todayOrders = orders.filter(o => { try { return new Date(o.created_at).toDateString() === today; } catch { return false; } });
            const todayRev = todayOrders.reduce((s, o) => s + amt(o), 0);
            const pending = orders.filter(o => (o.status || '').toLowerCase() === 'pending').length;
            const lowStock = products.filter(p => Number(p.stock) <= 5 && Number(p.stock) > 0).length;
            const outStock = products.filter(p => Number(p.stock) === 0).length;
            const unread = conversations.length;
            const yKey = new Date(Date.now() - 86400000).toDateString();
            const yOrders = orders.filter(o => { try { return new Date(o.created_at).toDateString() === yKey; } catch { return false; } });
            const yRev = yOrders.reduce((s, o) => s + amt(o), 0);
            const custCount = new Set(orders.map(o => (o.customer_phone || o.customer_name || '').trim()).filter(Boolean)).size;
            const trend = (now: number, before: number) => { if (!before) return null; const p = Math.round(((now - before) / before) * 100); return { p, up: p >= 0 }; };
            const revTrend = trend(todayRev, yRev); const ordTrend = trend(todayOrders.length, yOrders.length);
            const alertCount = (outStock + lowStock > 0 ? 1 : 0) + (pending > 0 ? 1 : 0) + (unread > 0 ? 1 : 0);
            const recent = [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
            const pillClass = (s: string) => {
              const v = (s || '').toLowerCase();
              if (v === 'delivered') return 'delivered';
              if (v === 'cancelled' || v === 'canceled' || v === 'returned') return 'cancelled';
              if (v === 'pending' || v === '') return 'pending';
              return 'processing';
            };
            const fmtDate = (d: string) => { try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); } catch { return d; } };
            const Stat = ({ label, value, ico, foot, tr }: { label: string; value: string; ico: string; foot?: React.ReactNode; tr?: { p: number; up: boolean } | null }) => (
              <div className="amr-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#718096', fontSize: '0.75rem', fontWeight: 600 }}>{label}<span className="amr-stat-ico">{ico}</span></div>
                <div className="amr-stat-num">{value}</div>
                {tr ? <div style={{ fontSize: '0.7rem', color: tr.up ? '#16a879' : '#c44d4d', fontWeight: 700 }}>{tr.up ? '↗' : '↘'} {Math.abs(tr.p)}% <span style={{ color: '#8794a8', fontWeight: 400 }}>vs yesterday</span></div> : (foot && <div style={{ fontSize: '0.7rem', color: '#718096' }}>{foot}</div>)}
              </div>
            );
            return (
              <>
                <div className="amr-stats4" style={{ marginBottom: '18px' }}>
                  <Stat label="Today's Revenue" ico="৳" value={`৳${todayRev.toLocaleString()}`} tr={revTrend} foot={`${todayOrders.length} orders today`} />
                  <Stat label="Total Orders" ico="🛍️" value={String(orders.length)} tr={ordTrend} foot={ordersLoading ? 'Loading…' : 'All time'} />
                  <Stat label="Customers" ico="👥" value={String(custCount)} foot="Unique buyers" />
                  <Stat label="Products" ico="📦" value={String(products.length)} foot={lowStock + outStock > 0 ? <span style={{ color: '#d98a20' }}>⚠ {lowStock + outStock} low in stock</span> : 'In stock'} />
                </div>

                {(() => {
                  const DAY = 86400000; const n = Date.now();
                  const days: { key: string; label: string; sales: number; ordersN: number }[] = [];
                  for (let i = 13; i >= 0; i--) { const d = new Date(n - i * DAY); days.push({ key: d.toDateString(), label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), sales: 0, ordersN: 0 }); }
                  const idx: Record<string, number> = {}; days.forEach((d, i) => { idx[d.key] = i; });
                  orders.forEach(o => { const k = (() => { try { return new Date(o.created_at).toDateString(); } catch { return ''; } })(); if (idx[k] === undefined) return; days[idx[k]].ordersN += 1; if ((o.status || '').toLowerCase() !== 'cancelled') days[idx[k]].sales += amt(o); });
                  const maxS = Math.max(1, ...days.map(d => d.sales)); const maxO = Math.max(1, ...days.map(d => d.ordersN));
                  const W = 660, H = 170, LX = 40, RX = W - 8, topPad = 10, botPad = 24; const plotW = RX - LX, plotH = H - topPad - botPad;
                  const px = (i: number) => days.length === 1 ? LX : LX + (i / (days.length - 1)) * plotW;
                  const salesPts = days.map((d, i) => [px(i), topPad + plotH - (d.sales / maxS) * plotH]);
                  const ordersPts = days.map((d, i) => [px(i), topPad + plotH - (d.ordersN / maxO) * plotH]);
                  const toPath = (p: number[][]) => p.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' ');
                  const salesLine = toPath(salesPts); const ordersLine = toPath(ordersPts);
                  const areaPath = `${salesLine} L${RX} ${topPad + plotH} L${LX} ${topPad + plotH} Z`;
                  const grid = [0, 0.33, 0.66, 1].map(f => ({ y: topPad + plotH * f, v: Math.round(maxS * (1 - f)) }));
                  const xTicks = [0, 3, 6, 9, 13].filter(i => i < days.length);
                  const kfmt = (v: number) => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v);
                  const total14 = days.reduce((s, d) => s + d.sales, 0);
                  // Sales by channel (real) — orders currently come through the website storefront
                  const payNames: Record<string, string> = { website: 'Website', facebook: 'Facebook', messenger: 'Messenger', whatsapp: 'WhatsApp', other: 'Other' };
                  const payColors: Record<string, string> = { website: '#2563eb', facebook: '#1877f2', messenger: '#26c9ef', whatsapp: '#16a879', other: '#f59e0b' };
                  const payMap: Record<string, number> = {};
                  orders.forEach(o => { if ((o.status || '').toLowerCase() === 'cancelled') return; const k = (((o as unknown as { channel?: string }).channel) || 'website').toLowerCase(); payMap[k] = (payMap[k] || 0) + amt(o); });
                  const payEntries = Object.entries(payMap).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
                  const payTotal = payEntries.reduce((s, [, v]) => s + v, 0);
                  let acc = 0;
                  const stops = payEntries.map(([k, v]) => { const from = (acc / (payTotal || 1)) * 100; acc += v; const to = (acc / (payTotal || 1)) * 100; return `${payColors[k] || '#9fb0cc'} ${from}% ${to}%`; });
                  const conic = stops.length ? `conic-gradient(${stops.join(',')})` : 'conic-gradient(#e9eef6 0 100%)';
                  return (
                    <div className="amr-overview-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(240px,1fr)', gap: '16px', marginBottom: '18px' }}>
                      <div className="amr-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                          <div><h3 style={{ margin: 0, fontSize: '0.95rem', color: '#183052' }}>Sales Performance</h3><span style={{ fontSize: '0.72rem', color: '#718096' }}>Revenue &amp; orders overview · ৳{Math.round(total14).toLocaleString()}</span></div>
                          <span className="amr-btn" style={{ cursor: 'default', fontSize: '0.72rem', padding: '6px 11px', flex: 'none' }}>Last 14 days</span>
                        </div>
                        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '185px' }}>
                          <defs><linearGradient id="ovFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#2563eb" stopOpacity="0.2" /><stop offset="1" stopColor="#2563eb" stopOpacity="0" /></linearGradient></defs>
                          {grid.map((g, i) => <g key={i}><line x1={LX} x2={RX} y1={g.y} y2={g.y} stroke="#eef1f7" strokeWidth="1" /><text x="0" y={g.y + 3} fontSize="9" fill="#91a0b5">৳{kfmt(g.v)}</text></g>)}
                          {xTicks.map(i => <text key={i} x={px(i)} y={H - 8} fontSize="9" fill="#91a0b5" textAnchor="middle">{days[i].label}</text>)}
                          <path d={areaPath} fill="url(#ovFill)" />
                          <path d={salesLine} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d={ordersLine} fill="none" stroke="#26c9ef" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '0.72rem', color: '#718096', marginTop: '4px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }} />Revenue</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#26c9ef' }} />Orders</span>
                        </div>
                      </div>
                      <div className="amr-card">
                        <h3 style={{ margin: '0 0 2px', fontSize: '0.95rem', color: '#183052' }}>Sales by Channel</h3>
                        <span style={{ fontSize: '0.72rem', color: '#718096' }}>Where your orders come from</span>
                        {payTotal === 0 ? <div style={{ color: '#8794a8', fontSize: '0.82rem', padding: '24px 0', textAlign: 'center' }}>No sales yet.</div> : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
                            <div style={{ width: '104px', height: '104px', borderRadius: '50%', background: conic, flex: 'none', position: 'relative' }}>
                              <div style={{ position: 'absolute', inset: '16px', background: '#fff', borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 800, color: '#16315b', fontSize: '0.82rem', textAlign: 'center' }}>৳{payTotal >= 100000 ? (payTotal / 100000).toFixed(2) + 'L' : Math.round(payTotal).toLocaleString()}</div>
                            </div>
                            <div style={{ display: 'grid', gap: '8px', flex: 1 }}>
                              {payEntries.map(([k, v]) => (
                                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#66758a' }}>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: payColors[k] || '#9fb0cc' }} />{payNames[k] || k}</span>
                                  <b style={{ color: '#233d61' }}>{Math.round((v / payTotal) * 100)}%</b>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <div className="amr-quick4" style={{ marginBottom: '18px' }}>
                  {[
                    { ico: '📦', t: 'Add Product', s: 'Publish a new item', go: () => setActiveTab('products') },
                    { ico: '🧾', t: 'Create Order', s: 'Place an order manually', go: () => { setCreateError(''); setCreateOrderOpen(true); } },
                    { ico: '🌐', t: 'Edit Website', s: 'Update your storefront', go: () => setActiveTab('website') },
                    { ico: '◎', t: 'Marketing Setup', s: 'Pixel & tracking tools', go: () => setActiveTab('marketing') },
                  ].map(q => (
                    <button key={q.t} onClick={q.go} style={{ textAlign: 'left', background: '#fff', border: '1px solid #e4eaf3', borderRadius: '12px', padding: '15px', cursor: 'pointer', boxShadow: '0 8px 26px rgba(15,39,83,.06)' }}>
                      <div style={{ fontSize: '19px' }}>{q.ico}</div>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', marginTop: '8px', color: '#1d3659' }}>{q.t}</div>
                      <div style={{ color: '#718096', fontSize: '0.7rem' }}>{q.s}</div>
                    </button>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.55fr) minmax(260px,1fr)', gap: '16px', marginBottom: '20px' }} className="amr-overview-grid">
                  <div className="amr-card" style={{ overflowX: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div><h3 style={{ margin: 0, fontSize: '0.95rem', color: '#183052' }}>Recent Orders</h3><span style={{ fontSize: '0.72rem', color: '#718096' }}>Latest activity from your store</span></div>
                      <button className="amr-btn" onClick={() => setActiveTab('orders')}>View all →</button>
                    </div>
                    {recent.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#8794a8', fontSize: '0.85rem' }}>No orders yet.</div>
                    ) : (
                      <table className="amr-table" style={{ minWidth: '500px' }}>
                        <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
                        <tbody>
                          {recent.map((o, i) => {
                            const init = (o.customer_name || '?').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
                            return (
                            <tr key={o.id || i}>
                              <td style={{ fontWeight: 700, color: '#2563eb' }}>#{String(o.id || '').slice(-5).toUpperCase() || (1001 + i)}</td>
                              <td><span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 650, color: '#213b5e' }}><span style={{ width: '26px', height: '26px', borderRadius: '8px', background: '#e7f1ff', color: '#2563eb', display: 'grid', placeItems: 'center', fontSize: '0.62rem', fontWeight: 800, flex: 'none' }}>{init}</span>{o.customer_name || '—'}</span></td>
                              <td>{fmtDate(o.created_at)}</td>
                              <td><b>৳{amt(o).toLocaleString()}</b></td>
                              <td><span className={`amr-pill ${pillClass(o.status)}`}>{o.status || 'pending'}</span></td>
                            </tr>
                          );})}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div className="amr-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#183052' }}>Needs Your Attention</h3>
                      <span style={{ fontSize: '0.66rem', fontWeight: 700, color: '#2563eb', background: '#edf4ff', borderRadius: '20px', padding: '3px 9px' }}>{alertCount} alert{alertCount === 1 ? '' : 's'}</span>
                    </div>
                    <div style={{ display: 'grid', gap: '13px' }}>
                      {outStock + lowStock > 0 && (
                        <div style={{ display: 'flex', gap: '11px', alignItems: 'flex-start' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '9px', display: 'grid', placeItems: 'center', background: '#fff4df', flex: 'none' }}>⚠</div>
                          <div><strong style={{ fontSize: '0.82rem', color: '#263d5d' }}>Low / out of stock</strong><div style={{ color: '#8794a8', fontSize: '0.76rem', marginTop: '3px' }}>{lowStock + outStock} products need restocking.</div><a onClick={() => setActiveTab('stock')} style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 700, cursor: 'pointer' }}>Review inventory →</a></div>
                        </div>
                      )}
                      {pending > 0 && (
                        <div style={{ display: 'flex', gap: '11px', alignItems: 'flex-start' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '9px', display: 'grid', placeItems: 'center', background: '#eaf2ff', flex: 'none' }}>🛍️</div>
                          <div><strong style={{ fontSize: '0.82rem', color: '#263d5d' }}>Pending orders</strong><div style={{ color: '#8794a8', fontSize: '0.76rem', marginTop: '3px' }}>{pending} orders waiting to be processed.</div><a onClick={() => setActiveTab('orders')} style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 700, cursor: 'pointer' }}>Open orders →</a></div>
                        </div>
                      )}
                      {unread > 0 && (
                        <div style={{ display: 'flex', gap: '11px', alignItems: 'flex-start' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '9px', display: 'grid', placeItems: 'center', background: '#eaf2ff', flex: 'none' }}>✉️</div>
                          <div><strong style={{ fontSize: '0.82rem', color: '#263d5d' }}>Customer messages</strong><div style={{ color: '#8794a8', fontSize: '0.76rem', marginTop: '3px' }}>{unread} conversations in your inbox.</div><a onClick={() => setActiveTab('inbox')} style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 700, cursor: 'pointer' }}>Open inbox →</a></div>
                        </div>
                      )}
                      {outStock + lowStock === 0 && pending === 0 && (
                        <div style={{ display: 'flex', gap: '11px', alignItems: 'flex-start' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '9px', display: 'grid', placeItems: 'center', background: '#e4f8ef', flex: 'none' }}>✓</div>
                          <div><strong style={{ fontSize: '0.82rem', color: '#263d5d' }}>Store health is good</strong><div style={{ color: '#8794a8', fontSize: '0.76rem', marginTop: '3px' }}>No pending orders or stock issues.</div></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {(() => {
            const title = !websiteResult ? 'Build Your Website' : isDraftSite ? 'Your Website Preview Is Ready' : 'View & Edit Your Website';
            const desc = !websiteResult
              ? 'Build your website with AI for free and preview it. Make it live with the Automation package.'
              : isDraftSite
                ? (packages.includes('automation') ? 'Your package is active — make your website live now.' : 'Only you can see it. Buy the Automation package to make it live.')
                : 'Manage slider, products, menu — all from here.';
            const cta = !websiteResult ? 'Get Started →' : isDraftSite ? 'View Preview →' : 'View →';
            return (
              <div onClick={() => setActiveTab('website')} style={{
                background: 'linear-gradient(135deg,#2563eb,#1b4dd1)', borderRadius: '16px', padding: '28px',
                marginBottom: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap',
              }}>
                <div>
                  <div style={{ fontSize: '1.7rem', marginBottom: '8px' }}>🚀</div>
                  <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'white', marginBottom: '6px' }}>{title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.88rem' }}>{desc}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); setActiveTab('website'); }} style={{
                  padding: '12px 24px', background: 'white', color: '#1b4dd1', border: 'none', borderRadius: '8px',
                  fontWeight: 800, fontSize: '0.92rem', cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                  {cta}
                </button>
              </div>
            );
          })()}

          {mySites.length > 1 && (
            <div style={{ background: '#fff', border: '1px solid #e4eaf3', borderRadius: '14px', padding: '18px', marginBottom: '20px', boxShadow: '0 8px 26px rgba(15,39,83,.06)' }}>
              <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: '0.9rem', color: '#2563eb' }}>
                {websiteResult ? `You have ${mySites.length} websites — switch between them:` : `You have ${mySites.length} websites — which one do you want to manage?`}
              </p>
              {mySites.map(s => {
                const isActive = s.business_slug === currentSiteId;
                return (
                  <div key={s.business_slug} onClick={() => {
                    setCurrentSiteId(s.business_slug);
                    try { localStorage.setItem('automorai_site_id', s.business_slug); } catch {}
                    setWebsiteResult({ url: s.website_url, business_name: s.business_name, site_id: s.business_slug,
                      status: s.status === 'draft' ? 'draft' : 'active' });
                    setPreviewHtml('');
                  }} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
                    width: '100%', textAlign: 'left', padding: '10px 14px', marginBottom: '8px',
                    background: isActive ? '#eaf2ff' : '#f6f9ff', color: '#17243b',
                    border: isActive ? '1px solid #2563eb' : '1px solid #e4eaf3', borderRadius: '10px',
                    cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
                  }}>
                    <span>{isActive ? '✓ ' : ''}{s.business_name}</span>
                    <a href={s.website_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                      style={{ color: '#2563eb', fontWeight: 400, fontSize: '0.8rem', whiteSpace: 'nowrap', textDecoration: 'underline' }}>
                      Open ↗
                    </a>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            {packages.includes('automation') ? (
              <TaskCard icon="📘" title="Connect Facebook Page" done={!!connectedPage}
                desc={connectedPage ? `${connectedPage} is connected.` : 'Connect your Facebook Page to auto-reply to comments and Messenger.'}
                action={connectedPage ? undefined : { label: 'Connect', onClick: handleFacebookConnect }} />
            ) : (
              <TaskCard icon="📘" title="Connect Facebook Page"
                desc="Buy the Automation package to unlock Facebook, WhatsApp, and Pixel/Analytics."
                action={{ label: 'Buy Package', onClick: () => { window.location.href = '/buy-package?package=automation'; } }} />
            )}
            {packages.includes('automation') ? (
              <TaskCard icon="💬" title="Connect WhatsApp Business"
                desc="Automatically chat with customers and show products on WhatsApp."
                action={{ label: 'Connect', onClick: handleWhatsAppConnect }} />
            ) : (
              <TaskCard icon="💬" title="Connect WhatsApp Business"
                desc="Buy the Automation package to unlock Facebook, WhatsApp, and Pixel/Analytics."
                action={{ label: 'Buy Package', onClick: () => { window.location.href = '/buy-package?package=automation'; } }} />
            )}
            {packages.includes('automation') ? (
              <TaskCard icon="📊" title="Pixel and Analytics Setup"
                desc="Track visitor behavior with Facebook Pixel and Google Analytics."
                action={{ label: 'Setup', onClick: handlePixelGAConnect }} />
            ) : (
              <TaskCard icon="📊" title="Pixel and Analytics Setup"
                desc="Buy the Automation package to unlock Facebook, WhatsApp, and Pixel/Analytics."
                action={{ label: 'Buy Package', onClick: () => { window.location.href = '/buy-package?package=automation'; } }} />
            )}
          </div>

          {waPageId && (
            <div style={{ background: '#fff', border: '1px solid #e4eaf3', borderRadius: '14px', padding: '18px', marginBottom: '20px', boxShadow: '0 8px 26px rgba(15,39,83,.06)' }}>
              <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '0.9rem', color: '#2563eb' }}>🌐 Your Website Widget Code</p>
              <p style={{ margin: '0 0 10px', fontSize: '0.8rem', color: '#718096' }}>Paste this code into your website</p>
              <pre style={{ background: '#0a1733', border: '1px solid #16315b', borderRadius: '8px', padding: '12px',
                fontSize: '0.72rem', color: '#9df0ff', overflowX: 'auto', margin: '0 0 10px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {`<script\n  src="https://automorai.com/automorai-widget.js"\n  data-page-id="${waPageId}"\n  data-business="Your Business Name"\n  data-color="#2563eb">\n</script>`}
              </pre>
              <button onClick={() => { navigator.clipboard.writeText(`<script\n  src="https://automorai.com/automorai-widget.js"\n  data-page-id="${waPageId}"\n  data-business="Your Business Name"\n  data-color="#2563eb">\n</script>`); setWidgetCopied(true); setTimeout(() => setWidgetCopied(false), 2000); }}
                style={{ width: '100%', padding: '10px', background: widgetCopied ? '#16a879' : '#2563eb',
                  color: 'white', border: 'none', borderRadius: '8px',
                  fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                {widgetCopied ? '✅ Copied!' : '📋 Copy Code'}
              </button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '16px' }}>
            <Toggle label="Comment Auto-Reply" desc="Auto-reply to Facebook comments" value={commentReply} onChange={v => handleToggleChange('comment', v)} />
            <Toggle label="Messenger Auto-Reply" desc="Auto-reply to Messenger messages" value={messengerReply} onChange={v => handleToggleChange('messenger', v)} />
          </div>
        </div>
      )}

      {createOrderOpen && (
        <div onClick={() => !createSaving && setCreateOrderOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(7,20,38,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '16px', padding: '22px', width: '100%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 70px rgba(7,26,60,.35)' }}>
            <h3 style={{ margin: '0 0 14px', color: '#12284c' }}>Create New Order</h3>
            {createError && <div style={{ background: '#ffeded', color: '#c44d4d', borderRadius: '8px', padding: '9px 12px', fontSize: '0.82rem', marginBottom: '12px' }}>{createError}</div>}
            <FormField label="Product *">
              <input list="co-products" className="amr-input" value={createForm.product_title} onChange={e => { const t = e.target.value; const match = products.find(p => p.title === t); setCreateForm(f => ({ ...f, product_title: t, product_price: match ? Number(match.price) : f.product_price })); }} placeholder="Type or pick a product" />
              <datalist id="co-products">{products.map(p => <option key={p.product_id} value={p.title} />)}</datalist>
            </FormField>
            <div style={{ display: 'flex', gap: '12px' }}>
              <FormField label="Price (৳) *"><input type="number" className="amr-input" value={createForm.product_price || ''} onChange={e => setCreateForm(f => ({ ...f, product_price: parseFloat(e.target.value) || 0 }))} /></FormField>
              <FormField label="Quantity"><input type="number" className="amr-input" value={createForm.quantity} onChange={e => setCreateForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))} /></FormField>
            </div>
            <FormField label="Customer name *"><input className="amr-input" value={createForm.customer_name} onChange={e => setCreateForm(f => ({ ...f, customer_name: e.target.value }))} /></FormField>
            <FormField label="Mobile number *"><input className="amr-input" value={createForm.customer_phone} onChange={e => setCreateForm(f => ({ ...f, customer_phone: e.target.value }))} placeholder="01XXXXXXXXX" /></FormField>
            <FormField label="Address"><textarea className="amr-input" style={{ height: '56px' }} value={createForm.customer_address} onChange={e => setCreateForm(f => ({ ...f, customer_address: e.target.value }))} /></FormField>
            <div style={{ display: 'flex', gap: '12px' }}>
              <FormField label="Payment"><select className="amr-input" value={createForm.payment_method} onChange={e => setCreateForm(f => ({ ...f, payment_method: e.target.value }))}><option value="cod">Cash on Delivery</option><option value="bkash">bKash</option><option value="nagad">Nagad</option><option value="bank">Bank</option></select></FormField>
              <FormField label="Delivery"><select className="amr-input" value={createForm.delivery_location} onChange={e => setCreateForm(f => ({ ...f, delivery_location: e.target.value }))}><option value="inside">Inside Dhaka</option><option value="outside">Outside Dhaka</option></select></FormField>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button onClick={handleCreateOrder} disabled={createSaving} className="amr-btn amr-btn-primary" style={{ flex: 1, color: '#fff' }}>{createSaving ? 'Creating…' : 'Create Order'}</button>
              <button onClick={() => setCreateOrderOpen(false)} className="amr-btn" style={{ flex: 1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ INBOX TAB ════════ */}
      {activeTab === 'inbox' && (
        <div style={{ padding: '32px 24px', maxWidth: '1150px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
            <div>
              <div className="amr-eyebrow">Customer communication</div>
              <h2 style={{ color: '#12284c', margin: '2px 0 2px', fontSize: '1.5rem', letterSpacing: '-0.4px' }}>Unified Inbox</h2>
              <p className="amr-sub" style={{ margin: 0 }}>All customer conversations — Facebook, Messenger, WhatsApp &amp; website chat — in one place.</p>
            </div>
            <span className="amr-btn" style={{ cursor: 'default', flex: 'none' }}>{conversations.length} conversation{conversations.length === 1 ? '' : 's'}</span>
          </div>
          <div className="amr-inbox" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', minHeight: '480px', border: '1px solid #e4eaf3', borderRadius: '14px', overflow: 'hidden', background: '#fff', boxShadow: '0 8px 26px rgba(15,39,83,.06)' }}>
            <div style={{ borderRight: '1px solid #e4eaf3', overflowY: 'auto', maxHeight: '600px' }}>
              {inboxLoading && <div style={{ padding: '24px', color: '#718096', textAlign: 'center', fontSize: '0.88rem' }}>Loading conversations…</div>}
              {inboxError && <div style={{ padding: '16px', color: '#c44d4d', fontSize: '0.88rem' }}>{inboxError}</div>}
              {!inboxLoading && !inboxError && conversations.length === 0 && (
                <div style={{ padding: '28px 18px', color: '#718096', textAlign: 'center', fontSize: '0.88rem' }}>No conversations yet.<br />Connect Facebook or WhatsApp to start.</div>
              )}
              {conversations.map(conv => (
                <div key={conv.id} onClick={() => { setSelectedConversation(conv); setReplyText(''); setReplyError(''); }} style={{ padding: '13px 15px',
                  borderBottom: '1px solid #edf1f6', cursor: 'pointer',
                  background: selectedConversation?.id === conv.id ? '#edf5ff' : 'transparent', transition: 'background 0.15s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#213b5e' }}>{conv.name}</span>
                    <span style={{ color: '#8794a8', fontSize: '0.72rem', flex: 'none' }}>{formatTime(conv.last_time)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <PlatformBadge platform={conv.platform} />
                    <span style={{ color: '#718096', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>{conv.last_message}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', background: '#f8faff', maxHeight: '600px' }}>
              {!selectedConversation ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8794a8', flexDirection: 'column', gap: '10px', padding: '40px', minHeight: '300px' }}>
                  <span style={{ fontSize: '1.8rem' }}>💬</span>
                  <span style={{ fontSize: '0.9rem' }}>Select a conversation to view messages</span>
                </div>
              ) : (
                <>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid #e4eaf3', background: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#12284c' }}>{selectedConversation.name}</div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                        <PlatformBadge platform={selectedConversation.platform} />
                        <span style={{ color: '#8794a8', fontSize: '0.76rem' }}>{selectedConversation.sender_id}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '18px', display: 'flex', flexDirection: 'column', gap: '9px', minHeight: '240px' }}>
                    {selectedConversation.messages.slice().sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                      .map((msg, i) => {
                        const isUser = msg.role === 'user';
                        return (
                          <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-start' : 'flex-end' }}>
                            <div style={{ maxWidth: '72%', padding: '9px 13px', borderRadius: isUser ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                              background: isUser ? '#fff' : '#2563eb', border: isUser ? '1px solid #e4eaf3' : 'none', color: isUser ? '#17243b' : 'white', fontSize: '0.88rem', lineHeight: '1.5' }}>
                              <div>{msg.message}</div>
                              <div style={{ fontSize: '0.68rem', color: isUser ? '#8794a8' : 'rgba(255,255,255,0.65)', marginTop: '4px', textAlign: 'right' }}>{formatTime(msg.timestamp)}</div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  {replyError && (
                    <div style={{ padding: '8px 18px', background: '#ffeded', color: '#c44d4d', fontSize: '0.8rem' }}>❌ {replyError}</div>
                  )}
                  <div style={{ padding: '12px 16px', borderTop: '1px solid #e4eaf3', background: '#fff', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input placeholder="Write a reply…" value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !replySending) handleSendReply(); }}
                      disabled={replySending}
                      style={{ flex: 1, padding: '10px 13px', background: '#fff', border: '1px solid #dbe3f0', borderRadius: '9px', color: '#17243b', fontSize: '0.88rem', outline: 'none' }} />
                    <button onClick={handleSendReply} disabled={replySending || !replyText.trim()}
                      className="amr-btn amr-btn-primary"
                      style={{ color: '#fff', opacity: replySending || !replyText.trim() ? 0.55 : 1, whiteSpace: 'nowrap' }}>
                      {replySending ? '…' : 'Send ↗'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {previewFullscreen && isDraftSite && previewDoc && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#06070a', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '10px 16px',
            background: '#ffffff', borderBottom: '1px solid #e4eaf3', flexWrap: 'wrap' }}>
            <span style={{ color: '#1b4dd1', fontWeight: 700, fontSize: '0.9rem' }}>👀 Preview — not live yet</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {packages.includes('automation') ? (
                <button onClick={handleGoLive} disabled={goingLive}
                  style={{ padding: '8px 14px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                  {goingLive ? '⏳ Going live...' : '🚀 Go Live Now'}
                </button>
              ) : (
                <button onClick={() => { window.location.href = '/buy-package?package=automation'; }}
                  style={{ padding: '8px 14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                  💳 Buy Package to Go Live
                </button>
              )}
              <button onClick={() => setPreviewFullscreen(false)}
                style={{ padding: '8px 14px', background: '#eef4fb', color: '#29405f', border: '1px solid #dbe3f0', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                ✕ Close
              </button>
            </div>
          </div>
          <iframe title="Full page website preview" srcDoc={previewDoc} sandbox="allow-scripts allow-modals"
            style={{ flex: 1, width: '100%', border: 'none', background: '#fff' }} />
        </div>
      )}

      {/* ════════ WEBSITE BUILDER TAB ════════ */}
      {activeTab === 'website' && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 16px' }}>
          <div style={{ width: '100%', maxWidth: '580px' }}>
            <div style={{ marginBottom: '28px' }}>
              <div className="amr-eyebrow">Online storefront</div>
              <h2 style={{ color: '#12284c', margin: '2px 0 6px', fontSize: '1.5rem', letterSpacing: '-0.4px' }}>Website &amp; Store</h2>
              <p style={{ color: '#718096', margin: 0, fontSize: '0.9rem' }}>AI will build a beautiful website for you.</p>
            </div>

            {websiteResult && (
              <div style={{ background: isDraftSite ? '#eef4fb' : '#e4f8ef', border: `1px solid ${isDraftSite ? '#2563eb' : '#16a879'}`, borderRadius: '14px', padding: '24px', marginBottom: '24px' }}>
                {isDraftSite ? (
                  <>
                    <p style={{ color: '#2563eb', fontWeight: 700, margin: '0 0 4px', fontSize: '1rem' }}>👀 Website preview (not live yet)</p>
                    <p style={{ color: '#718096', margin: '0 0 14px', fontSize: '0.85rem' }}>
                      Only you can see this. Add your products and settings now — when you make it live, this exact website goes online for your customers.
                    </p>
                    {packages.includes('automation') ? (
                      <button onClick={handleGoLive} disabled={goingLive} style={btnStyle('#22c55e', 'white')}>
                        {goingLive ? '⏳ Making it live... (30-60 seconds)' : '🚀 Go Live Now'}
                      </button>
                    ) : (
                      <button onClick={() => { window.location.href = '/buy-package?package=automation'; }} style={btnStyle('#2563eb', 'white')}>
                        💳 Buy Package to Go Live
                      </button>
                    )}
                    {goLiveError && <p style={{ fontSize: '0.8rem', color: '#c44d4d', marginTop: '6px', textAlign: 'center' }}>{goLiveError}</p>}
                    {previewDoc && (
                      <button onClick={() => setPreviewFullscreen(true)}
                        style={{ width: '100%', padding: '10px', marginTop: '10px', background: '#2563eb22', color: '#2563eb', border: '1px solid #2563eb', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700 }}>
                        🖥️ Open full page preview
                      </button>
                    )}
                    <div style={{ marginTop: '14px', border: '1px solid #e4eaf3', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
                      {previewDoc ? (
                        <iframe key={previewReloadKey} title="Website preview" srcDoc={previewDoc}
                          sandbox="allow-scripts allow-modals" style={{ width: '100%', height: '560px', border: 'none', display: 'block' }} />
                      ) : (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#718096', fontSize: '0.85rem', background: '#0e0f16' }}>
                          {previewLoading ? '⏳ Loading preview...' : 'Preview not available.'}
                        </div>
                      )}
                    </div>
                    <button onClick={() => (previewDoc ? setPreviewReloadKey(k => k + 1) : currentSiteId && loadDraftPreview(currentSiteId))}
                      style={{ width: '100%', padding: '8px', marginTop: '8px', marginBottom: '10px', background: 'transparent', color: '#718096', border: '1px solid #e4eaf3', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                      🔄 Reload preview (after editing products or settings)
                    </button>
                  </>
                ) : (
                  <>
                    <p style={{ color: '#12284c', fontWeight: 700, margin: '0 0 4px', fontSize: '1rem' }}>✅ Website created successfully!</p>
                    <p style={{ color: '#718096', margin: '0 0 16px', fontSize: '0.85rem' }}>{websiteResult.business_name} 's website is now live.</p>
                    <a href={websiteResult.url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'block', color: '#2563eb', fontWeight: 600, fontSize: '0.95rem', marginBottom: '12px', wordBreak: 'break-all' }}>
                      {websiteResult.url}
                    </a>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <button onClick={() => { navigator.clipboard.writeText(websiteResult.url); setWebsiteUrlCopied(true); setTimeout(() => setWebsiteUrlCopied(false), 2000); }}
                        style={{ flex: 1, padding: '10px', background: websiteUrlCopied ? '#16a879' : '#2563eb',
                          color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem', transition: 'all 0.2s' }}>
                        {websiteUrlCopied ? '✅ Copied!' : '📋 Copy URL'}
                      </button>
                      <a href={websiteResult.url} target="_blank" rel="noopener noreferrer"
                        style={{ flex: 1, padding: '10px', background: '#eef4fb', color: '#29405f', border: '1px solid #dbe3f0',
                          borderRadius: '8px', fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        🔗 View Website
                      </a>
                    </div>
                  </>
                )}
                <button onClick={() => { setActiveTab('products'); }}
                  style={{ width: '100%', padding: '10px', background: '#2563eb22', color: '#2563eb', border: '1px solid #2563eb', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700 }}>
                  📦 Add Products
                </button>
                <button onClick={() => setShowSettings(s => !s)}
                  style={{ width: '100%', padding: '10px', marginTop: '10px', background: 'transparent', color: '#718096', border: '1px solid #e4eaf3', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700 }}>
                  ⚙️ Slider and Footer Settings {showSettings ? '▲' : '▼'}
                </button>
                {!isDraftSite && (
                  <button onClick={handleUpdateWebsite} disabled={websiteUpdating}
                    style={{ width: '100%', padding: '10px', marginTop: '10px', background: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e', borderRadius: '8px', cursor: websiteUpdating ? 'default' : 'pointer', fontSize: '0.88rem', fontWeight: 700 }}>
                    {websiteUpdating ? 'Updating…' : '⬆️ Update to Latest Design'}
                  </button>
                )}
                {websiteUpdateMsg && (
                  <p style={{ fontSize: '0.8rem', color: websiteUpdateMsg.startsWith('Updated') ? '#22c55e' : '#c44d4d', marginTop: '6px', textAlign: 'center' }}>{websiteUpdateMsg}</p>
                )}

                {!isDraftSite && (
                  <button onClick={() => { const n = !showDomain; setShowDomain(n); if (n && !domainInfo) loadDomainStatus(); }}
                    style={{ width: '100%', padding: '10px', marginTop: '10px', background: 'transparent', color: '#718096', border: '1px solid #e4eaf3', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700 }}>
                    🌐 Connect your own domain {showDomain ? '▲' : '▼'}
                  </button>
                )}
                {!isDraftSite && showDomain && (
                  <div style={{ marginTop: '12px', background: '#0e0f16', border: '1px solid #e4eaf3', borderRadius: '12px', padding: '18px' }}>
                    {domainLoading && <p style={{ color: '#718096', fontSize: '0.85rem', textAlign: 'center', margin: 0 }}>Loading…</p>}
                    {!domainLoading && domainInfo?.has_domain ? (
                      <>
                        <p style={{ color: '#12284c', fontWeight: 700, fontSize: '0.9rem', margin: '0 0 4px' }}>Your domain</p>
                        <p style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', margin: '0 0 10px', wordBreak: 'break-all' }}>{domainInfo.domain}</p>
                        {domainInfo.connected ? (
                          <div style={{ background: '#e4f8ef', border: '1px solid #22c55e', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
                            <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.85rem' }}>✅ Live &amp; secured (SSL active)</span>
                          </div>
                        ) : (
                          <div style={{ background: '#1c1708', border: '1px solid #e0a500', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                            <p style={{ color: '#f0b400', fontWeight: 700, fontSize: '0.85rem', margin: '0 0 8px' }}>⏳ Waiting for DNS — not live yet</p>
                            <p style={{ color: '#c9ad6a', fontSize: '0.8rem', margin: '0 0 8px' }}>At your domain provider (GoDaddy, Namecheap, etc.) add this record:</p>
                            <div style={{ background: '#06070a', borderRadius: '6px', padding: '10px', fontSize: '0.8rem', color: '#d7dbe8', fontFamily: 'monospace', lineHeight: 1.7 }}>
                              <div>Type: <b>CNAME</b></div>
                              <div>Name: <b style={{ wordBreak: 'break-all' }}>{domainInfo.domain}</b></div>
                              <div>Target: <b>{domainInfo.cname_target || 'connect.automorai.com'}</b></div>
                            </div>
                            <p style={{ color: '#8b7b4a', fontSize: '0.72rem', margin: '8px 0 0' }}>After adding it, SSL activates automatically within a few minutes. Press “Check again”.</p>
                            {domainInfo.verification ? <p style={{ color: '#ff8a8a', fontSize: '0.72rem', margin: '6px 0 0' }}>{domainInfo.verification}</p> : null}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button onClick={loadDomainStatus} disabled={domainBusy || domainLoading}
                            style={{ flex: 1, padding: '10px', background: '#2563eb22', color: '#2563eb', border: '1px solid #2563eb', borderRadius: '8px', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 700 }}>
                            🔄 Check again
                          </button>
                          <button onClick={handleDisconnectDomain} disabled={domainBusy}
                            style={{ flex: 1, padding: '10px', background: 'transparent', color: '#c44d4d', border: '1px solid #c44d4d44', borderRadius: '8px', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 700 }}>
                            Disconnect
                          </button>
                        </div>
                      </>
                    ) : (!domainLoading && (
                      <>
                        <p style={{ color: '#718096', fontSize: '0.82rem', margin: '0 0 12px' }}>Use your own web address (like <b style={{ color: '#d7dbe8' }}>shop.yourbrand.com</b>) instead of the default link. Enter the domain you own — we recommend a subdomain such as <b>shop.</b> or <b>www.</b></p>
                        <input value={domainInput} onChange={e => setDomainInput(e.target.value)} placeholder="shop.yourbrand.com"
                          style={{ width: '100%', boxSizing: 'border-box', padding: '11px', background: '#06070a', border: '1px solid #e4eaf3', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', marginBottom: '10px' }} />
                        <button onClick={handleConnectDomain} disabled={domainBusy}
                          style={{ width: '100%', padding: '11px', background: '#22c55e', color: '#06070a', border: 'none', borderRadius: '8px', cursor: domainBusy ? 'default' : 'pointer', fontSize: '0.9rem', fontWeight: 800 }}>
                          {domainBusy ? 'Connecting…' : 'Connect domain'}
                        </button>
                        {domainMsg && domainMsg !== 'ok' && (
                          <p style={{ color: '#c44d4d', fontSize: '0.78rem', margin: '8px 0 0', textAlign: 'center' }}>{domainMsg}</p>
                        )}
                      </>
                    ))}
                  </div>
                )}

                {showSettings && (
                  <div style={{ marginTop: '14px', background: '#0e0f16', border: '1px solid #e4eaf3', borderRadius: '12px', padding: '20px' }}>
                    {settingsLoading && <p style={{ color: '#718096', fontSize: '0.85rem', textAlign: 'center' }}>Loading...</p>}
                    {!settingsLoading && (
                      <>
                        <p style={{ color: '#718096', fontSize: '0.8rem', margin: '0 0 16px' }}>Change the homepage slider (3 slides) and footer text here — changes appear on the website immediately after saving, no rebuild needed.</p>

                        <div style={{ marginBottom: '18px', paddingBottom: '18px', borderBottom: '1px solid #eef2f8' }}>
                          <p style={{ color: '#12284c', fontWeight: 700, fontSize: '0.85rem', margin: '0 0 10px' }}>Logo</p>
                          <FormField label="Logo Image">
                            {websiteSettings.logo_img && (
                              <img src={websiteSettings.logo_img} alt="" style={{ height: '48px', objectFit: 'contain', marginBottom: '8px', background: '#f0f4fb', borderRadius: '6px', padding: '6px' }} />
                            )}
                            <input type="file" accept="image/*"
                              onChange={e => handleSettingsImageUpload('logo_img', e.target.files?.[0] || null)}
                              style={{ ...inputStyle, padding: '8px' }} />
                            {settingsUploading === 'logo_img' && <p style={{ color: '#718096', fontSize: '0.78rem', margin: '4px 0 0' }}>Uploading...</p>}
                            <p style={{ color: '#718096', fontSize: '0.75rem', margin: '6px 0 0' }}>If no logo is set, the business name (text) will be shown instead.</p>
                          </FormField>
                        </div>

                        {[1, 2, 3].map(n => {
                          const imgField = `slide${n}_img` as keyof WebsiteSettings;
                          const tagField = `slide${n}_tag` as keyof WebsiteSettings;
                          const titleField = `slide${n}_title` as keyof WebsiteSettings;
                          const descField = `slide${n}_desc` as keyof WebsiteSettings;
                          return (
                            <div key={n} style={{ marginBottom: '18px', paddingBottom: '18px', borderBottom: '1px solid #eef2f8' }}>
                              <p style={{ color: '#12284c', fontWeight: 700, fontSize: '0.85rem', margin: '0 0 10px' }}>Slide {n}</p>
                              <FormField label="Image">
                                {String(websiteSettings[imgField] || '') && (
                                  <img src={String(websiteSettings[imgField] || '')} alt="" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} />
                                )}
                                <input type="file" accept="image/*"
                                  onChange={e => handleSettingsImageUpload(imgField, e.target.files?.[0] || null)}
                                  style={{ ...inputStyle, padding: '8px' }} />
                                {settingsUploading === imgField && <p style={{ color: '#718096', fontSize: '0.78rem', margin: '4px 0 0' }}>Uploading...</p>}
                              </FormField>
                              <FormField label="Tag (short label)">
                                <input type="text" placeholder="e.g. New Collection" value={String(websiteSettings[tagField] || '')}
                                  onChange={e => handleSettingsChange(tagField, e.target.value)} style={inputStyle} />
                              </FormField>
                              <FormField label="Title">
                                <input type="text" placeholder="e.g. Best Quality Products" value={String(websiteSettings[titleField] || '')}
                                  onChange={e => handleSettingsChange(titleField, e.target.value)} style={inputStyle} />
                              </FormField>
                              <FormField label="Description">
                                <input type="text" placeholder="Write a short description" value={String(websiteSettings[descField] || '')}
                                  onChange={e => handleSettingsChange(descField, e.target.value)} style={inputStyle} />
                              </FormField>
                            </div>
                          );
                        })}
                        <FormField label="Footer Description">
                          <textarea value={websiteSettings.footer_desc}
                            onChange={e => handleSettingsChange('footer_desc', e.target.value)}
                            style={{ ...inputStyle, height: '70px' }} placeholder="A short note about your shop..." />
                        </FormField>

                        {/* ── Payment Methods ── */}
                        <div style={{ marginBottom: '18px', paddingBottom: '18px', borderBottom: '1px solid #eef2f8' }}>
                          <p style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.85rem', margin: '0 0 6px' }}>Payment Methods</p>
                          <p style={{ color: '#718096', fontSize: '0.78rem', margin: '0 0 12px' }}>
                            Customers can pay by Cash on Delivery, bKash, Nagad, or Bank Transfer. Fill in the numbers/details below for the ones you accept — leave blank to hide that option's details (customers can still select it, but will not see where to send money).
                          </p>
                          <FormField label="bKash Number">
                            <input type="text" placeholder="e.g. 01712345678" value={websiteSettings.bkash_number}
                              onChange={e => handleSettingsChange('bkash_number', e.target.value)} style={inputStyle} />
                          </FormField>
                          <FormField label="Nagad Number">
                            <input type="text" placeholder="e.g. 01712345678" value={websiteSettings.nagad_number}
                              onChange={e => handleSettingsChange('nagad_number', e.target.value)} style={inputStyle} />
                          </FormField>
                          <FormField label="Bank Details">
                            <textarea value={websiteSettings.bank_details}
                              onChange={e => handleSettingsChange('bank_details', e.target.value)}
                              style={{ ...inputStyle, height: '60px' }} placeholder="Bank name, account number, account name..." />
                          </FormField>
                        </div>

                        {/* ── Delivery Charge ── */}
                        <div style={{ marginBottom: '18px', paddingBottom: '18px', borderBottom: '1px solid #eef2f8' }}>
                          <p style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.85rem', margin: '0 0 6px' }}>Delivery Charge</p>
                          <p style={{ color: '#718096', fontSize: '0.78rem', margin: '0 0 12px' }}>
                            Customers pick Dhaka or Outside Dhaka at checkout and this charge is added to their total automatically. Defaults to ৳60 / ৳120 if left blank.
                          </p>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <FormField label="Dhaka (৳)">
                              <input type="number" placeholder="60" value={websiteSettings.delivery_charge_dhaka}
                                onChange={e => handleSettingsChange('delivery_charge_dhaka', e.target.value)} style={inputStyle} />
                            </FormField>
                            <FormField label="Outside Dhaka (৳)">
                              <input type="number" placeholder="120" value={websiteSettings.delivery_charge_outside}
                                onChange={e => handleSettingsChange('delivery_charge_outside', e.target.value)} style={inputStyle} />
                            </FormField>
                          </div>
                        </div>

                        {/* ── Courier Integration ── */}
                        <div style={{ marginBottom: '18px', paddingBottom: '18px', borderBottom: '1px solid #eef2f8' }}>
                          <p style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.85rem', margin: '0 0 6px' }}>Courier Integration</p>
                          <p style={{ color: '#718096', fontSize: '0.78rem', margin: '0 0 12px' }}>
                            Connect your own Steadfast or Pathao courier account. Each business needs its own courier account (parcels are picked up from your own shop) — your keys are stored encrypted. Used to book parcels from Orders and to check a customer's delivery record next to each order.
                          </p>
                          <FormField label="Courier Provider">
                            <select value={courierProvider} onChange={e => setCourierProvider(e.target.value as 'none' | 'steadfast' | 'pathao')} style={inputStyle}>
                              <option value="none">Not connected</option>
                              <option value="steadfast">Steadfast Courier</option>
                              <option value="pathao">Pathao Courier</option>
                            </select>
                          </FormField>

                          {courierProvider === 'steadfast' && (
                            <>
                              <FormField label={`Steadfast API Key${courierConfigured.steadfast ? ' (✓ saved — leave blank to keep)' : ''}`}>
                                <input type="password" placeholder="API Key" value={courierForm.steadfast_api_key}
                                  onChange={e => handleCourierFormChange('steadfast_api_key', e.target.value)} style={inputStyle} />
                              </FormField>
                              <FormField label="Steadfast Secret Key">
                                <input type="password" placeholder="Secret Key" value={courierForm.steadfast_secret_key}
                                  onChange={e => handleCourierFormChange('steadfast_secret_key', e.target.value)} style={inputStyle} />
                              </FormField>
                            </>
                          )}

                          {courierProvider === 'pathao' && (
                            <>
                              <FormField label={`Pathao Client ID${courierConfigured.pathao ? ' (✓ saved — leave blank to keep)' : ''}`}>
                                <input type="password" placeholder="Client ID" value={courierForm.pathao_client_id}
                                  onChange={e => handleCourierFormChange('pathao_client_id', e.target.value)} style={inputStyle} />
                              </FormField>
                              <FormField label="Pathao Client Secret">
                                <input type="password" placeholder="Client Secret" value={courierForm.pathao_client_secret}
                                  onChange={e => handleCourierFormChange('pathao_client_secret', e.target.value)} style={inputStyle} />
                              </FormField>
                              <FormField label="Pathao Username">
                                <input type="text" placeholder="Merchant panel username/email" value={courierForm.pathao_username}
                                  onChange={e => handleCourierFormChange('pathao_username', e.target.value)} style={inputStyle} />
                              </FormField>
                              <FormField label="Pathao Password">
                                <input type="password" placeholder="Merchant panel password" value={courierForm.pathao_password}
                                  onChange={e => handleCourierFormChange('pathao_password', e.target.value)} style={inputStyle} />
                              </FormField>
                            </>
                          )}

                          {courierProvider !== 'none' && (
                            <button onClick={handleSaveCourierSettings} disabled={courierSaving}
                              style={{ ...btnStyle(courierSaved ? '#16a879' : '#2563eb', courierSaved ? '#06070a' : 'white'), marginTop: '6px' }}>
                              {courierSaving ? '⏳ Saving...' : courierSaved ? '✅ Saved!' : '💾 Save Courier Settings'}
                            </button>
                          )}
                          {courierError && <p style={{ fontSize: '0.8rem', color: '#c44d4d', marginTop: '6px', textAlign: 'center' }}>{courierError}</p>}
                        </div>

                        {/* ── Marketing tracking (Meta Pixel / GA4 / GTM) ── */}
                        <div id="amr-tracking" style={{ marginBottom: '18px', paddingBottom: '18px', borderBottom: '1px solid #eef2f8' }}>
                          <p style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.85rem', margin: '0 0 6px' }}>Pixel &amp; Analytics</p>
                          <p style={{ color: '#718096', fontSize: '0.78rem', margin: '0 0 12px' }}>
                            Paste only the ID. Your website then sends page views, product views, add-to-cart, checkout and purchases automatically. Works right after you save — no rebuild needed. Leave blank if you don't use it.
                          </p>
                          <FormField label="Meta (Facebook) Pixel ID">
                            <input type="text" inputMode="numeric" placeholder="e.g. 123456789012345" value={websiteSettings.fb_pixel_id}
                              onChange={e => handleSettingsChange('fb_pixel_id', e.target.value.replace(/[^0-9]/g, ''))} style={inputStyle} />
                          </FormField>
                          <FormField label="Google Analytics 4 Measurement ID">
                            <input type="text" placeholder="e.g. G-AB12CD34EF" value={websiteSettings.ga_id}
                              onChange={e => handleSettingsChange('ga_id', e.target.value.trim().toUpperCase())} style={inputStyle} />
                          </FormField>
                          <FormField label="Google Tag Manager Container ID">
                            <input type="text" placeholder="e.g. GTM-AB12CD3" value={websiteSettings.gtm_id}
                              onChange={e => handleSettingsChange('gtm_id', e.target.value.trim().toUpperCase())} style={inputStyle} />
                          </FormField>
                          {((websiteSettings.fb_pixel_id && !/^[0-9]{6,20}$/.test(websiteSettings.fb_pixel_id)) ||
                            (websiteSettings.ga_id && !/^G-[A-Z0-9]{4,15}$/.test(websiteSettings.ga_id)) ||
                            (websiteSettings.gtm_id && !/^GTM-[A-Z0-9]{4,12}$/.test(websiteSettings.gtm_id))) && (
                            <p style={{ fontSize: '0.78rem', color: '#c44d4d', margin: '4px 0 0' }}>
                              One of the IDs doesn't look right. Pixel ID = numbers only, GA4 starts with G-, GTM starts with GTM-. Wrong IDs are ignored.
                            </p>
                          )}
                          <p style={{ fontSize: '0.76rem', color: '#718096', margin: '8px 0 0' }}>Tip: if you use GTM, add Pixel/GA4 inside GTM and leave those two fields blank, so events are not counted twice.</p>
                        </div>

                        {/* ── Shop Info (used by the chat assistant) ── */}
                        <div style={{ marginBottom: '18px', paddingBottom: '18px', borderBottom: '1px solid #eef2f8' }}>
                          <p style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.85rem', margin: '0 0 6px' }}>Shop Info</p>
                          <p style={{ color: '#718096', fontSize: '0.78rem', margin: '0 0 12px' }}>
                            Your chat assistant uses this to answer customer questions about your shop. Leave any field blank if it doesn't apply — the assistant will then honestly say it doesn't have that info instead of guessing.
                          </p>
                          <FormField label="Shop Address">
                            <input type="text" placeholder="e.g. House 12, Road 5, Dhanmondi, Dhaka" value={websiteSettings.shop_address}
                              onChange={e => handleSettingsChange('shop_address', e.target.value)} style={inputStyle} />
                          </FormField>
                          <FormField label="Shop Hours">
                            <input type="text" placeholder="e.g. Everyday 10am - 9pm" value={websiteSettings.shop_hours}
                              onChange={e => handleSettingsChange('shop_hours', e.target.value)} style={inputStyle} />
                          </FormField>
                          <FormField label="Return / Exchange / Warranty Policy">
                            <textarea value={websiteSettings.return_policy}
                              onChange={e => handleSettingsChange('return_policy', e.target.value)}
                              style={{ ...inputStyle, height: '70px' }} placeholder="e.g. Exchange within 3 days with original tag. No cash refund, store credit only." />
                          </FormField>
                        </div>

                        {/* ── Navigation Menu ── */}
                        <div style={{ marginBottom: '18px', paddingBottom: '18px', borderBottom: '1px solid #eef2f8' }}>
                          <p style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.85rem', margin: '0 0 6px' }}>Navigation Menu</p>
                          <p style={{ color: '#718096', fontSize: '0.78rem', margin: '0 0 12px' }}>Top menu items — you can also add sub-items (e.g. Men → Shirt, Pant).</p>
                          {websiteSettings.nav_menu.map((item, idx) => (
                            <div key={idx} style={{ background: '#f0f4fb', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
                              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                <input type="text" placeholder="Menu label" value={item.label} onChange={e => updateNavItem(idx, 'label', e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                                <input type="text" placeholder="Link (optional)" value={item.link} onChange={e => updateNavItem(idx, 'link', e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                                <button onClick={() => removeNavItem(idx)} style={{ padding: '0 10px', background: '#ffeded', color: '#c44d4d', border: '1px solid #c44d4d44', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem' }}>Remove</button>
                              </div>
                              {(item.children || []).map((sub, subIdx) => (
                                <div key={subIdx} style={{ display: 'flex', gap: '8px', marginBottom: '6px', paddingLeft: '16px' }}>
                                  <input type="text" placeholder="Sub-item label" value={sub.label} onChange={e => updateSubItem(idx, subIdx, 'label', e.target.value)} style={{ ...inputStyle, flex: 1, padding: '7px 10px' }} />
                                  <input type="text" placeholder="Link (optional)" value={sub.link} onChange={e => updateSubItem(idx, subIdx, 'link', e.target.value)} style={{ ...inputStyle, flex: 1, padding: '7px 10px' }} />
                                  <button onClick={() => removeSubItem(idx, subIdx)} style={{ padding: '0 8px', background: 'transparent', color: '#c44d4d', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>
                                </div>
                              ))}
                              <button onClick={() => addSubItem(idx)} style={{ marginLeft: '16px', padding: '4px 10px', background: 'transparent', color: '#2563eb', border: '1px dashed #2563eb44', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}>+ Sub-item</button>
                            </div>
                          ))}
                          <button onClick={addNavItem} style={{ padding: '6px 14px', background: '#2563eb22', color: '#2563eb', border: '1px solid #2563eb', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>+ Add menu item</button>
                        </div>

                        {/* ── Testimonials ── */}
                        <div style={{ marginBottom: '18px', paddingBottom: '18px', borderBottom: '1px solid #eef2f8' }}>
                          <p style={{ color: '#12284c', fontWeight: 700, fontSize: '0.85rem', margin: '0 0 10px' }}>Testimonials</p>
                          <Toggle label="Show this section" desc="Turn the testimonials section on the site on/off" value={getTestimonialBlock().enabled} onChange={v => setBlock({ ...getTestimonialBlock(), enabled: v })} />
                          <div style={{ height: '12px' }} />
                          <FormField label="Section Title">
                            <input type="text" placeholder="What Our Customers Say" value={getTestimonialBlock().title} onChange={e => setBlock({ ...getTestimonialBlock(), title: e.target.value })} style={inputStyle} />
                          </FormField>
                          {getTestimonialBlock().items.map((it, idx) => (
                            <div key={idx} style={{ background: '#f0f4fb', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
                              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                <input type="text" placeholder="Customer's name" value={it.name} onChange={e => updateTestimonialItem(idx, 'name', e.target.value)} style={{ ...inputStyle, flex: 2 }} />
                                <input type="number" placeholder="Rating" min={1} max={5} value={it.rating} onChange={e => updateTestimonialItem(idx, 'rating', e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                              </div>
                              <textarea placeholder="Write the testimonial" value={it.text} onChange={e => updateTestimonialItem(idx, 'text', e.target.value)} style={{ ...inputStyle, height: '50px', marginBottom: '8px' }} />
                              <button onClick={() => removeTestimonialItem(idx)} style={{ padding: '4px 10px', background: '#ffeded', color: '#c44d4d', border: '1px solid #c44d4d44', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}>Remove</button>
                            </div>
                          ))}
                          <button onClick={addTestimonialItem} style={{ padding: '6px 14px', background: '#2563eb22', color: '#2563eb', border: '1px solid #2563eb', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>+ Add testimonial</button>
                        </div>

                        {/* ── About / Our Story ── */}
                        <div style={{ marginBottom: '18px', paddingBottom: '18px', borderBottom: '1px solid #eef2f8' }}>
                          <p style={{ color: '#12284c', fontWeight: 700, fontSize: '0.85rem', margin: '0 0 10px' }}>About</p>
                          <Toggle label="Show this section" desc="Turn the 'About' section on the site on/off" value={getAboutBlock().enabled} onChange={v => setBlock({ ...getAboutBlock(), enabled: v })} />
                          <div style={{ height: '12px' }} />
                          <FormField label="Title">
                            <input type="text" value={getAboutBlock().title} onChange={e => setBlock({ ...getAboutBlock(), title: e.target.value })} style={inputStyle} />
                          </FormField>
                          <FormField label="Body Text">
                            <textarea value={getAboutBlock().body} onChange={e => setBlock({ ...getAboutBlock(), body: e.target.value })} style={{ ...inputStyle, height: '70px' }} />
                          </FormField>
                          <FormField label="Image Link">
                            <input type="text" value={getAboutBlock().img} onChange={e => setBlock({ ...getAboutBlock(), img: e.target.value })} style={inputStyle} />
                          </FormField>
                        </div>

                        <button onClick={handleSaveSettings} disabled={settingsSaving}
                          style={btnStyle(settingsSaved ? '#16a879' : '#2563eb', settingsSaved ? '#06070a' : 'white')}>
                          {settingsSaving ? '⏳ Saving...' : settingsSaved ? '✅ Saved!' : '💾 Save'}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {!websiteResult && (
              <div style={{ background: '#ffffff', border: '1px solid #e4eaf3', borderRadius: '16px', padding: '28px' }}>
                {websiteError && (
                  <div style={{ background: '#ffeded', border: '1px solid #c44d4d', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#c44d4d', fontSize: '0.88rem' }}>❌ {websiteError}</div>
                )}

                <FormField label="Business Name *">
                  <input type="text" placeholder="e.g. Dhaka Fashion House" value={websiteForm.business_name}
                    onChange={e => handleWebsiteFormChange('business_name', e.target.value)} style={inputStyle} />
                </FormField>

                <FormField label="Business Type (Niche) *">
                  <select value={websiteForm.niche} onChange={e => handleWebsiteFormChange('niche', e.target.value)}
                    style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                    {niches.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </FormField>

                <FormField label="WhatsApp Number *">
                  <input type="text" placeholder="8801XXXXXXXXX" value={websiteForm.whatsapp_number}
                    onChange={e => handleWebsiteFormChange('whatsapp_number', e.target.value)} style={inputStyle} />
                </FormField>

                <FormField label="Theme Color (Accent Color)">
                  <input type="color" value={websiteForm.accent_color}
                    onChange={e => handleWebsiteFormChange('accent_color', e.target.value)}
                    style={{ width: '100%', height: '42px', padding: '4px', background: '#eef2f8', border: '1px solid #e4eaf3', borderRadius: '8px', cursor: 'pointer' }} />
                </FormField>

                {!packages.includes('automation') && (
                  <p style={{ color: '#718096', fontSize: '0.8rem', margin: '0 0 12px' }}>
                    Free: you'll get a private preview of your website. Buy the Automation package anytime to make this same website live. One website per account.
                  </p>
                )}
                <button onClick={handleBuildWebsite} disabled={websiteBuilding} style={btnStyle('#2563eb', 'white')}>
                  {websiteBuilding ? '⏳ Creating website... (30-60 seconds)' : '🚀 Create Website'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════ PRODUCTS TAB ════════ */}
      {activeTab === 'builder' && (
        <BuilderBeta slug={currentSiteId} siteName={wsName} isDraft={isDraftSite} liveUrl={websiteResult?.url || ''} />
      )}

      {activeTab === 'products' && (
        <div style={{ padding: '32px 24px', maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <div className="amr-eyebrow">Catalog management</div>
              <h2 style={{ color: '#12284c', margin: '2px 0', fontSize: '1.5rem', letterSpacing: '-0.4px' }}>Products</h2>
              <p style={{ color: '#718096', margin: '4px 0 0', fontSize: '0.85rem' }}>Manage your catalog, pricing and product visibility.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {products.some(isSampleProduct) && (
                <button onClick={handleDeleteAllSamples} style={{ padding: '10px 18px', background: '#ffeded', color: '#c44d4d',
                  border: '1px solid #c44d4d44', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem' }}>
                  🗑️ Remove all sample products
                </button>
              )}
              <button onClick={() => { setEditingProductId(null); setProductForm({ business_slug: currentSiteId, title: '', description: '', category: '', price: 0, original_price: 0, images: [], sizes: [], colors: [], stock: 10 }); setShowAddProduct(true); }} style={{ ...btnStyle('#2563eb', 'white'), width: 'auto', padding: '10px 20px', margin: 0 }}>
                + Add Product
              </button>
            </div>
          </div>

          {/* Add/Edit Product Modal */}
          {showAddProduct && (
            <div style={{ fixed: 'inset-0', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99, padding: '20px' }}>
              <div style={{ background: '#ffffff', border: '1px solid #e4eaf3', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto' }}>
                <h3 style={{ margin: '0 0 16px', color: '#2563eb' }}>{editingProductId ? 'Edit Product' : 'Add New Product'}</h3>
                {productError && <div style={{ color: '#c44d4d', marginBottom: '12px', fontSize: '0.85rem' }}>{productError}</div>}
                
                <FormField label="Title *">
                  <input type="text" value={productForm.title} onChange={e => setProductForm({ ...productForm, title: e.target.value })} style={inputStyle} placeholder="e.g. Premium Cotton Shirt" />
                </FormField>

                <FormField label="Category">
                  <input type="text" value={productForm.category || ''} onChange={e => setProductForm({ ...productForm, category: e.target.value })} style={inputStyle} placeholder="e.g. Women, Men — match your website's category names" />
                </FormField>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <FormField label="Sale Price (৳) *">
                    <input type="number" value={productForm.price || ''} onChange={e => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })} style={inputStyle} placeholder="1200" />
                  </FormField>
                  <FormField label="Original Price (৳)">
                    <input type="number" value={productForm.original_price || ''} onChange={e => setProductForm({ ...productForm, original_price: parseFloat(e.target.value) || 0 })} style={inputStyle} placeholder="1500" />
                  </FormField>
                </div>

                <FormField label="Description">
                  <textarea value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} style={{ ...inputStyle, height: '70px' }} placeholder="Product description..." />
                </FormField>

                {/* Multi Image Upload */}
                <FormField label="Product Images">
                  <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={e => handleImageUpload(e.target.files)} style={{ display: 'none' }} />
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {productForm.images.map((img, i) => (
                      <div key={i} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e4eaf3' }}>
                        <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button onClick={() => setProductForm(p => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))}
                          style={{ position: 'absolute', top: 2, right: 2, background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '16px', height: '16px', cursor: 'pointer', fontSize: '10px' }}>✕</button>
                      </div>
                    ))}
                    <button onClick={() => fileInputRef.current?.click()} disabled={imageUploading}
                      style={{ width: '60px', height: '60px', borderRadius: '6px', border: '1px dashed #2563eb', background: '#f0f4fb', color: '#2563eb', cursor: 'pointer', fontSize: '1.2rem' }}>
                      {imageUploading ? '⏳' : '+'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input type="text" value={imageInput} onChange={e => setImageInput(e.target.value)} placeholder="Or enter image URL" style={inputStyle} />
                    <button onClick={() => { if(imageInput){ setProductForm(p => ({ ...p, images: [...p.images, imageInput] })); setImageInput(''); } }} style={{ padding: '0 14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Add</button>
                  </div>
                </FormField>

                {/* Sizes & Colors */}
                <FormField label="Sizes">
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    {commonSizes.map(s => (
                      <button key={s} onClick={() => setProductForm(p => ({ ...p, sizes: p.sizes.includes(s) ? p.sizes.filter(x => x !== s) : [...p.sizes, s] }))}
                        style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid #e4eaf3', background: productForm.sizes.includes(s) ? '#2563eb' : '#eef2f8', color: productForm.sizes.includes(s) ? 'white' : '#29405f', cursor: 'pointer' }}>{s}</button>
                    ))}
                  </div>
                </FormField>

                <FormField label="Colors (optional)">
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    {productForm.colors.map(c => (
                      <span key={c} style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', background: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {c}
                        <span onClick={() => setProductForm(p => ({ ...p, colors: p.colors.filter(x => x !== c) }))} style={{ cursor: 'pointer', fontWeight: 700 }}>×</span>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" value={colorInput} onChange={e => setColorInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && colorInput.trim()) { setProductForm(p => ({ ...p, colors: [...p.colors, colorInput.trim()] })); setColorInput(''); } }}
                      placeholder="e.g. Red, Blue, Black" style={inputStyle} />
                    <button onClick={() => { if (colorInput.trim()) { setProductForm(p => ({ ...p, colors: [...p.colors, colorInput.trim()] })); setColorInput(''); } }}
                      style={{ padding: '0 14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Add</button>
                  </div>
                </FormField>

                <FormField label="Stock Quantity">
                  <input type="number" value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })} style={inputStyle} />
                </FormField>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button onClick={handleSaveProduct} disabled={productSaving} style={{ ...btnStyle('#2563eb', 'white'), flex: 1, margin: 0 }}>
                    {productSaving ? 'Saving...' : (editingProductId ? 'Update Product' : 'Save Product')}
                  </button>
                  <button onClick={() => { setShowAddProduct(false); setEditingProductId(null); }} style={{ ...btnStyle('#e4eaf3', '#718096'), flex: 1, margin: 0 }}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {!productsLoading && products.length > 0 && (
            <div style={{ display: 'flex', gap: '9px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search products…" className="amr-input" style={{ maxWidth: '260px' }} />
              <select value={productCatFilter} onChange={e => setProductCatFilter(e.target.value)} className="amr-input" style={{ maxWidth: '200px' }}>
                <option value="">All categories</option>
                {[...new Set(products.map(p => (p.category || '').trim()).filter(Boolean))].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button className="amr-btn" onClick={() => {
                const rows = products.map(p => [p.title, p.category || '', p.price, p.stock].map(x => `"${String(x).replace(/"/g, '""')}"`).join(','));
                const csv = 'Product,Category,Price,Stock\n' + rows.join('\n');
                const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'products.csv'; a.click();
              }}>↓ Export</button>
            </div>
          )}
          {productsLoading ? <div style={{ color: '#718096' }}>Products loading...</div> : products.length === 0 ? (
            <div className="amr-card" style={{ color: '#718096', textAlign: 'center', padding: '28px' }}>No products yet. Click “＋ Add Product” to add your first item.</div>
          ) : (
            <div className="amr-card" style={{ overflowX: 'auto' }}>
              <table className="amr-table" style={{ minWidth: '680px' }}>
                <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {products.filter(p => {
                    const q = productSearch.trim().toLowerCase();
                    const matchQ = !q || (p.title || '').toLowerCase().includes(q);
                    const matchC = !productCatFilter || (p.category || '').trim() === productCatFilter;
                    return matchQ && matchC;
                  }).map(p => {
                    const st = Number(p.stock);
                    const status = st === 0 ? { t: 'Out of stock', c: 'cancelled' } : st <= 5 ? { t: 'Low stock', c: 'pending' } : { t: 'Active', c: 'delivered' };
                    return (
                      <tr key={p.product_id}>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ width: '38px', height: '38px', borderRadius: '9px', background: 'linear-gradient(135deg,#eaf2ff,#d4f6ff)', overflow: 'hidden', display: 'grid', placeItems: 'center', fontSize: '18px', flex: 'none' }}>
                              {p.images && p.images[0] ? <img src={p.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🛍️'}
                            </span>
                            <span>
                              <b style={{ color: '#213b5e' }}>{p.title}</b>
                              {isSampleProduct(p) && <span style={{ marginLeft: '7px', background: '#fff4df', color: '#b87914', fontSize: '0.6rem', fontWeight: 800, padding: '1px 6px', borderRadius: '20px' }}>Sample</span>}
                            </span>
                          </span>
                        </td>
                        <td>{p.category || '—'}</td>
                        <td><b>৳{p.price}</b>{p.original_price ? <span style={{ color: '#8794a8', textDecoration: 'line-through', fontSize: '0.78rem', marginLeft: '5px' }}>৳{p.original_price}</span> : null}</td>
                        <td>{p.stock}</td>
                        <td><span className={`amr-pill ${status.c}`}>{status.t}</span></td>
                        <td>
                          <span style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => handleEditProduct(p)} className="amr-btn" style={{ padding: '6px 12px' }}>Edit</button>
                            <button onClick={() => p.product_id && handleDeleteProduct(p.product_id)} className="amr-btn" style={{ padding: '6px 10px', color: '#c44d4d', borderColor: '#f3c4c4' }}>Delete</button>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ════════ ORDERS TAB ════════ */}
      {activeTab === 'reports' && (
        <div style={{ padding: '32px 24px', maxWidth: '1100px', margin: '0 auto' }}>
          {currentSiteId ? <SalesReport orders={orders} loading={ordersLoading} /> : <div style={{ color: '#718096' }}>Build your website first — your sales report will show here.</div>}
        </div>
      )}

      {/* ════════ CUSTOMERS TAB ════════ */}
      {activeTab === 'customers' && (
        <div style={{ padding: '32px 24px', maxWidth: '1100px', margin: '0 auto' }}>
          <div className="amr-eyebrow">Customer relationships</div>
          <h2 style={{ color: '#12284c', margin: '2px 0 18px', fontSize: '1.5rem', letterSpacing: '-0.4px' }}>Customers</h2>
          {!currentSiteId ? <div className="amr-card" style={{ color: '#718096' }}>Build your website first — your customers will show here.</div> :
            ordersLoading ? <div className="amr-card" style={{ color: '#718096' }}>Loading customers…</div> : (() => {
            const amt = (o: Order) => (Number(o.product_price) || 0) * (Number(o.quantity) || 1);
            const map: Record<string, { name: string; phone: string; orders: number; spent: number; last: string }> = {};
            orders.forEach(o => {
              const key = (o.customer_phone || '').trim() || (o.customer_name || '').trim();
              if (!key) return;
              if (!map[key]) map[key] = { name: o.customer_name || '—', phone: o.customer_phone || '', orders: 0, spent: 0, last: o.created_at };
              map[key].orders++; map[key].spent += amt(o);
              if (new Date(o.created_at).getTime() > new Date(map[key].last).getTime()) { map[key].last = o.created_at; if (o.customer_name) map[key].name = o.customer_name; }
            });
            const list = Object.values(map).sort((a, b) => b.spent - a.spent);
            const repeat = list.filter(c => c.orders > 1).length;
            const avg = list.length ? Math.round(list.reduce((s, c) => s + c.spent, 0) / list.length) : 0;
            const fd = (d: string) => { try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }); } catch { return '—'; } };
            const initials = (n: string) => (n.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2) || '?').toUpperCase();
            const S = ({ l, v }: { l: string; v: string }) => (<div className="amr-card"><div style={{ color: '#718096', fontSize: '0.78rem', fontWeight: 600 }}>{l}</div><div className="amr-stat-num" style={{ fontSize: '1.5rem' }}>{v}</div></div>);
            return (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '16px', marginBottom: '18px' }}>
                  <S l="Total Customers" v={String(list.length)} />
                  <S l="Repeat Customers" v={String(repeat)} />
                  <S l="Avg. Spend" v={`৳${avg.toLocaleString()}`} />
                </div>
                <div className="amr-card" style={{ overflowX: 'auto' }}>
                  {list.length === 0 ? <div style={{ padding: '24px', textAlign: 'center', color: '#8794a8', fontSize: '0.88rem' }}>No customers yet. They appear here after your first order.</div> : (
                    <table className="amr-table" style={{ minWidth: '560px' }}>
                      <thead><tr><th>Customer</th><th>Phone</th><th>Orders</th><th>Total Spent</th><th>Last Order</th></tr></thead>
                      <tbody>
                        {list.map((c, i) => (
                          <tr key={i}>
                            <td><span style={{ display: 'flex', alignItems: 'center', gap: '9px', fontWeight: 650, color: '#213b5e' }}><span style={{ width: '28px', height: '28px', borderRadius: '9px', background: '#e7f1ff', color: '#2563eb', display: 'grid', placeItems: 'center', fontSize: '0.68rem', fontWeight: 800, flex: 'none' }}>{initials(c.name)}</span>{c.name}</span></td>
                            <td>{c.phone || '—'}</td>
                            <td>{c.orders}{c.orders > 1 && <span className="amr-pill processing" style={{ marginLeft: '6px' }}>repeat</span>}</td>
                            <td><b>৳{c.spent.toLocaleString()}</b></td>
                            <td>{fd(c.last)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ════════ AI ASSISTANT TAB ════════ */}
      {activeTab === 'assistant' && (
        <div style={{ padding: '32px 24px', maxWidth: '820px', margin: '0 auto' }}>
          <div className="amr-eyebrow">AI powered</div>
          <h2 style={{ color: '#12284c', margin: '2px 0 4px', fontSize: '1.5rem', letterSpacing: '-0.4px' }}>AI Business Assistant</h2>
          <p className="amr-sub" style={{ margin: '0 0 18px' }}>Ask about your store. Answers use your real orders and products — nothing is invented.</p>
          <div className="amr-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '220px' }}>
              {aiMessages.length === 0 && <div style={{ color: '#8794a8', fontSize: '0.88rem', textAlign: 'center', padding: '34px 0' }}>👋 Hi! Ask me something about {wsName}.</div>}
              {aiMessages.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '82%', padding: '10px 14px', borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px', background: m.role === 'user' ? '#2563eb' : '#eef4fb', color: m.role === 'user' ? '#fff' : '#17243b', fontSize: '0.9rem', lineHeight: 1.5 }}>{m.text}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {["Today's sales", 'Best selling products', 'Low stock items', 'Pending orders', 'How many customers?'].map(s => (
                <button key={s} onClick={() => askAI(s)} style={{ border: '1px solid #dbe3f0', background: '#f6f9ff', color: '#2563eb', borderRadius: '999px', padding: '6px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>{s}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') askAI(); }} placeholder="Ask about sales, products, orders…" className="amr-input" />
              <button className="amr-btn amr-btn-primary" style={{ color: '#fff', whiteSpace: 'nowrap' }} onClick={() => askAI()}>Ask</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ COURIER & DELIVERY TAB ════════ */}
      {activeTab === 'courier' && (
        <div style={{ padding: '32px 24px', maxWidth: '1100px', margin: '0 auto' }}>
          <div className="amr-eyebrow">Fulfilment</div>
          <h2 style={{ color: '#12284c', margin: '2px 0 4px', fontSize: '1.5rem', letterSpacing: '-0.4px' }}>Courier &amp; Delivery</h2>
          <p className="amr-sub" style={{ margin: '0 0 18px' }}>Parcels booked from your orders, with tracking and status.</p>
          {!currentSiteId ? <div className="amr-card" style={{ color: '#718096' }}>Build your website first.</div> :
            ordersLoading ? <div className="amr-card" style={{ color: '#718096' }}>Loading shipments…</div> : (() => {
            const list = Object.entries(bookings).map(([oid, b]) => ({ oid, ...b }));
            const has = (s: string, kw: string[]) => kw.some(k => (s || '').toLowerCase().includes(k));
            const delivered = list.filter(b => has(b.courier_status, ['deliver'])).length;
            const transit = list.filter(b => has(b.courier_status, ['transit', 'pickup', 'ship', 'hold'])).length;
            const returned = list.filter(b => has(b.courier_status, ['return', 'cancel'])).length;
            const orderOf = (oid: string) => orders.find(o => o.id === oid);
            const S = ({ l, v, c }: { l: string; v: string; c?: string }) => (<div className="amr-card"><div style={{ color: '#718096', fontSize: '0.78rem', fontWeight: 600 }}>{l}</div><div className="amr-stat-num" style={{ fontSize: '1.5rem', color: c || '#10264b' }}>{v}</div></div>);
            return (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '16px', marginBottom: '18px' }}>
                  <S l="Total Booked" v={String(list.length)} />
                  <S l="In Transit" v={String(transit)} c="#2563eb" />
                  <S l="Delivered" v={String(delivered)} c="#159768" />
                  <S l="Returned" v={String(returned)} c="#c44d4d" />
                </div>
                <div className="amr-card" style={{ overflowX: 'auto' }}>
                  <div style={{ fontWeight: 700, color: '#183052', marginBottom: '10px' }}>Shipments</div>
                  {list.length === 0 ? <div style={{ padding: '22px', textAlign: 'center', color: '#8794a8', fontSize: '0.88rem' }}>No parcels booked yet. Open an order and click “Send to Steadfast / Pathao”.</div> : (
                    <table className="amr-table" style={{ minWidth: '560px' }}>
                      <thead><tr><th>Order</th><th>Customer</th><th>Tracking</th><th>Status</th></tr></thead>
                      <tbody>
                        {list.map((b, i) => { const o = orderOf(b.oid); return (
                          <tr key={i}>
                            <td>{o?.product_title || b.oid}</td>
                            <td>{o?.customer_name || '—'}</td>
                            <td style={{ fontWeight: 650, color: '#213b5e' }}>{b.tracking_code || '—'}</td>
                            <td><span className={`amr-pill ${has(b.courier_status, ['deliver']) ? 'delivered' : has(b.courier_status, ['return', 'cancel']) ? 'cancelled' : 'processing'}`}>{b.courier_status || 'booked'}</span></td>
                          </tr>
                        ); })}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ════════ MARKETING & PIXEL TAB ════════ */}
      {activeTab === 'marketing' && (
        <div style={{ padding: '32px 24px', maxWidth: '900px', margin: '0 auto' }}>
          <div className="amr-eyebrow">Growth &amp; attribution</div>
          <h2 style={{ color: '#12284c', margin: '2px 0 4px', fontSize: '1.5rem', letterSpacing: '-0.4px' }}>Marketing &amp; Pixel</h2>
          <p className="amr-sub" style={{ margin: '0 0 18px' }}>Connect tracking and measure how your campaigns perform.</p>
          {(() => {
            const hasPkg = packages.includes('automation');
            const rows = [
              { icon: '📊', name: 'Meta Pixel', desc: 'Track page views, add-to-cart and purchases on Facebook.', soon: false },
              { icon: 'G', name: 'Google Analytics 4', desc: 'Measure website traffic and conversions.', soon: false },
              { icon: '◉', name: 'Meta Conversions API', desc: 'Server-side purchase tracking (deduplicated).', soon: true },
              { icon: '🏷️', name: 'Google Tag Manager', desc: 'Manage all your marketing tags in one place (Business & Big).', soon: false },
            ];
            return (
              <div style={{ display: 'grid', gap: '12px' }}>
                {rows.map(r => (
                  <div key={r.name} className="amr-card" style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#edf4ff', color: '#2563eb', display: 'grid', placeItems: 'center', fontSize: '18px', fontWeight: 800, flex: 'none' }}>{r.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#12284c' }}>{r.name}</div>
                      <div style={{ color: '#718096', fontSize: '0.76rem' }}>{r.desc}</div>
                    </div>
                    {r.soon ? <span className="amr-pill pending" style={{ flex: 'none' }}>Coming soon</span>
                      : <button className="amr-btn" style={{ flex: 'none', whiteSpace: 'nowrap' }} onClick={hasPkg ? handlePixelGAConnect : () => { window.location.href = '/buy-package?package=automation'; }}>{hasPkg ? 'Set up' : 'Buy Package'}</button>}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ════════ AI & AUTOMATIONS TAB ════════ */}
      {activeTab === 'automations' && (
        <div style={{ padding: '32px 24px', maxWidth: '900px', margin: '0 auto' }}>
          <div className="amr-eyebrow">AI powered operations</div>
          <h2 style={{ color: '#12284c', margin: '2px 0 4px', fontSize: '1.5rem', letterSpacing: '-0.4px' }}>AI &amp; Automations</h2>
          <p className="amr-sub" style={{ margin: '0 0 18px' }}>Automate replies and routine work while keeping control of your business.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: '14px' }}>
            {[
              { name: 'AI Website Chat Reply', on: true, toggle: null as null | (() => void), desc: 'Your storefront AI answers customer questions and shows products, 24/7.' },
              { name: 'Facebook Comment Auto-Reply', on: commentReply, toggle: () => handleToggleChange('comment', !commentReply), desc: 'Automatically reply to comments on your Facebook posts.' },
              { name: 'Messenger Auto-Reply', on: messengerReply, toggle: () => handleToggleChange('messenger', !messengerReply), desc: 'Automatically answer Messenger messages with AI.' },
              { name: 'Low Stock Alerts', on: true, toggle: null, desc: 'Products at or below reorder level are flagged on your Overview and Inventory.' },
            ].map(a => (
              <div key={a.name} className="amr-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#12284c' }}>{a.name}</h3>
                  <span className={`amr-pill ${a.on ? 'delivered' : 'pending'}`} style={{ flex: 'none' }}>{a.on ? 'Active' : 'Off'}</span>
                </div>
                <p style={{ color: '#718096', fontSize: '0.82rem', margin: '0 0 14px', lineHeight: 1.6 }}>{a.desc}</p>
                {a.toggle
                  ? <button className="amr-btn" onClick={a.toggle}>{a.on ? 'Turn off' : 'Turn on'}</button>
                  : <span style={{ color: '#159768', fontWeight: 700, fontSize: '0.8rem' }}>✓ Always on</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════ SETTINGS TAB ════════ */}
      {activeTab === 'settings' && (
        <div style={{ padding: '32px 24px', maxWidth: '900px', margin: '0 auto' }}>
          <div className="amr-eyebrow">Workspace configuration</div>
          <h2 style={{ color: '#12284c', margin: '2px 0 18px', fontSize: '1.5rem', letterSpacing: '-0.4px' }}>Settings</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: '16px' }}>
            <div className="amr-card">
              <h3 style={{ margin: '0 0 12px', fontSize: '0.98rem', color: '#12284c' }}>Store Profile</h3>
              <div style={{ display: 'grid', gap: '10px', fontSize: '0.86rem' }}>
                <div><div style={{ color: '#52647d', fontWeight: 650, fontSize: '0.76rem', marginBottom: '3px' }}>Store name</div><div style={{ color: '#17243b', fontWeight: 600 }}>{wsName}</div></div>
                <div><div style={{ color: '#52647d', fontWeight: 650, fontSize: '0.76rem', marginBottom: '3px' }}>Store link</div><div style={{ color: '#17243b', wordBreak: 'break-all' }}>{websiteResult?.url || '—'}</div></div>
                <div><div style={{ color: '#52647d', fontWeight: 650, fontSize: '0.76rem', marginBottom: '3px' }}>Account email</div><div style={{ color: '#17243b' }}>{user.email}</div></div>
              </div>
              <button className="amr-btn" style={{ marginTop: '16px' }} onClick={() => { setActiveTab('website'); setShowSettings(true); }}>Edit store content &amp; settings</button>
            </div>
            <div className="amr-card">
              <h3 style={{ margin: '0 0 12px', fontSize: '0.98rem', color: '#12284c' }}>Team &amp; Access</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#dcecff', color: '#0a1f5c', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '0.78rem' }}>{wsInitials}</span>
                <div><div style={{ fontWeight: 700, color: '#12284c', fontSize: '0.88rem' }}>Store Admin</div><div style={{ color: '#718096', fontSize: '0.76rem' }}>Full access · You</div></div>
              </div>
              <p style={{ color: '#718096', fontSize: '0.78rem', margin: '16px 0 0' }}>Inviting team members with limited roles is coming soon.</p>
            </div>
            <div className="amr-card">
              <h3 style={{ margin: '0 0 12px', fontSize: '0.98rem', color: '#12284c' }}>Subscription</h3>
              <p style={{ color: '#718096', fontSize: '0.82rem', margin: '0 0 12px' }}>Your current plan and payments.</p>
              <button className="amr-btn" onClick={() => setActiveTab('billing')}>Open Billing →</button>
            </div>
            <div className="amr-card">
              <h3 style={{ margin: '0 0 12px', fontSize: '0.98rem', color: '#12284c' }}>Account</h3>
              <p style={{ color: '#718096', fontSize: '0.82rem', margin: '0 0 12px' }}>{user.email}</p>
              <button className="amr-btn" style={{ color: '#c44d4d', borderColor: '#f3c4c4' }} onClick={logout}>Log out</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ INTEGRATIONS TAB ════════ */}
      {activeTab === 'integrations' && (
        <div style={{ padding: '32px 24px', maxWidth: '900px', margin: '0 auto' }}>
          <div className="amr-eyebrow">Connected services</div>
          <h2 style={{ color: '#12284c', margin: '2px 0 4px', fontSize: '1.5rem', letterSpacing: '-0.4px' }}>Integrations</h2>
          <p className="amr-sub" style={{ margin: '0 0 18px' }}>Connect your store to messaging, marketing and delivery platforms.</p>
          <WooCommerceCard siteId={currentSiteId} hasPkg={packages.includes('automation')} isBig={planTier === 'big'} onOpenWebsite={() => setActiveTab('website')} onOpenOrders={() => setActiveTab('orders')} />
          {(() => {
            const hasPkg = packages.includes('automation');
            const proOk = hasPkg && planTier !== 'starter'; // AI replies + courier API start from Business
            const upgrade = () => { window.location.href = '/buy-package?package=automation&plan=business'; };
            const rows = [
              { icon: '📘', name: 'Facebook & Messenger', desc: 'Auto-reply to page comments and Messenger.', connected: !!connectedPage, action: proOk ? handleFacebookConnect : hasPkg ? upgrade : () => { window.location.href = '/buy-package?package=automation'; }, label: proOk ? 'Connect' : hasPkg ? 'Upgrade to Business' : 'Buy Package' },
              { icon: '💬', name: 'WhatsApp Business', desc: 'Chat with customers and show products on WhatsApp.', connected: !!waPageId, action: proOk ? handleWhatsAppConnect : hasPkg ? upgrade : () => { window.location.href = '/buy-package?package=automation'; }, label: proOk ? 'Connect' : hasPkg ? 'Upgrade to Business' : 'Buy Package' },
              { icon: '📊', name: 'Meta Pixel & Google Analytics', desc: 'Track visitors, add-to-cart and purchases.', connected: false, action: hasPkg ? handlePixelGAConnect : () => { window.location.href = '/buy-package?package=automation'; }, label: hasPkg ? 'Set up' : 'Buy Package' },
              { icon: '🚚', name: 'Steadfast Courier', desc: 'Book parcels and check delivery / fraud history.', connected: courierConfigured.steadfast, action: (proOk || !hasPkg) ? () => { setActiveTab('website'); setShowSettings(true); } : upgrade, label: (proOk || !hasPkg) ? 'Configure' : 'Upgrade to Business' },
              { icon: '➤', name: 'Pathao Courier (beta)', desc: 'Book Pathao parcels from your orders with your own Pathao merchant API keys.', connected: courierConfigured.pathao, action: (proOk || !hasPkg) ? () => { setActiveTab('website'); setShowSettings(true); } : upgrade, label: (proOk || !hasPkg) ? 'Configure' : 'Upgrade to Business' },
            ];
            return (
              <div style={{ display: 'grid', gap: '12px' }}>
                {rows.map(r => (
                  <div key={r.name} className="amr-card" style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#edf4ff', display: 'grid', placeItems: 'center', fontSize: '20px', flex: 'none' }}>{r.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#12284c' }}>{r.name}</div>
                      <div style={{ color: '#718096', fontSize: '0.76rem' }}>{r.desc}</div>
                    </div>
                    {r.connected
                      ? <span className="amr-pill delivered" style={{ flex: 'none' }}>✓ Connected</span>
                      : (r as any).soon ? <span className="amr-pill pending" style={{ flex: 'none' }}>Coming soon</span>
                      : <button className="amr-btn" style={{ flex: 'none', whiteSpace: 'nowrap' }} onClick={r.action}>{r.label}</button>}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ════════ BILLING TAB ════════ */}
      {activeTab === 'billing' && (
        <div style={{ padding: '32px 24px', maxWidth: '1100px', margin: '0 auto' }}>
          <div className="amr-eyebrow">Subscription &amp; billing</div>
          <h2 style={{ color: '#12284c', margin: '2px 0 18px', fontSize: '1.5rem', letterSpacing: '-0.4px' }}>Billing</h2>
          {(() => {
            const plans = [
              { key: 'starter', name: 'Starter', price: '৳990 / month', items: ['1 online shop website (up to 100 products)', 'Checkout, orders, stock & sales reports', 'Meta Pixel + Google Analytics 4', 'Order alerts by email', 'No AI replies / inbox'] },
              { key: 'business', name: 'Business', price: '৳2,490 / month', items: ['Everything in Starter, up to 500 products', 'AI replies on Messenger, WhatsApp & website chat — 1,000 / month', 'Unified inbox + order alerts on WhatsApp', 'Steadfast / Pathao booking + fake-order check', 'Pixel + GA4 + Google Tag Manager'] },
              { key: 'big', name: 'Big', price: '৳4,990 / month', items: ['Everything in Business, up to 2,000 products', 'AI replies — 5,000 / month', 'Up to 3 websites', 'WooCommerce store connection', 'Abandoned-cart WhatsApp reminders'] },
            ];
            const rank: Record<string, number> = { starter: 1, business: 2, big: 3 };
            const until = paidUntil ? new Date(paidUntil) : null;
            const daysLeft = until && !isNaN(until.getTime()) ? Math.ceil((until.getTime() - Date.now()) / 86400000) : null;
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: '16px' }}>
                {planTier && (
                  <div className="amr-card" style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <div style={{ fontWeight: 800, color: '#12284c' }}>Your plan: {planTier.charAt(0).toUpperCase() + planTier.slice(1)}</div>
                      <div style={{ color: daysLeft !== null && daysLeft <= 3 ? '#c44d4d' : '#718096', fontSize: '0.85rem' }}>
                        {daysLeft === null ? 'Monthly plan' : daysLeft >= 0 ? `Active until ${until!.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} (${daysLeft} day${daysLeft === 1 ? '' : 's'} left)` : `Ended on ${until!.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} — please renew`}
                      </div>
                    </div>
                    <button className="amr-btn-primary amr-btn" style={{ color: '#fff' }} onClick={() => { window.location.href = `/buy-package?package=automation&plan=${planTier}`; }}>Renew →</button>
                  </div>
                )}
                {plans.map(p => {
                  const active = planTier === p.key;
                  const lower = !!planTier && rank[p.key] < rank[planTier];
                  return (
                    <div key={p.key} className="amr-card" style={active ? { border: '1.5px solid #2563eb' } : undefined}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#12284c' }}>{p.name}</h3>
                        {active && <span className="amr-pill delivered">Current plan</span>}
                      </div>
                      <div style={{ color: '#2563eb', fontWeight: 800, fontSize: '1.05rem', marginBottom: '8px' }}>{p.price}</div>
                      <ul style={{ color: '#4a5568', fontSize: '0.82rem', margin: '0 0 16px', paddingLeft: '18px', lineHeight: 1.7 }}>
                        {p.items.map(it => <li key={it}>{it}</li>)}
                      </ul>
                      {active ? (
                        <div style={{ color: '#159768', fontWeight: 700, fontSize: '0.85rem' }}>✓ You are on this plan</div>
                      ) : (
                        <button className={lower ? 'amr-btn' : 'amr-btn-primary amr-btn'} style={lower ? undefined : { color: '#fff' }} onClick={() => { window.location.href = `/buy-package?package=automation&plan=${p.key}`; }}>{!planTier ? `Choose ${p.name} →` : lower ? `Switch to ${p.name}` : `Upgrade to ${p.name} →`}</button>
                      )}
                    </div>
                  );
                })}
                <div className="amr-card" style={{ gridColumn: '1 / -1' }}>
                  <h3 style={{ margin: '0 0 6px', fontSize: '0.98rem', color: '#12284c' }}>Payment method</h3>
                  <p style={{ color: '#718096', fontSize: '0.85rem', margin: 0 }}>Payments are made manually via bKash/Nagad (01674610578) and verified by the Automorai team. After you submit a payment on the Buy Package page, your plan is activated once approved.</p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === 'stock' && (
        <div style={{ padding: '32px 24px', maxWidth: '1100px', margin: '0 auto' }}>
          <div className="amr-eyebrow">Inventory control</div>
          <h2 style={{ color: '#12284c', margin: '2px 0 4px', fontSize: '1.5rem', letterSpacing: '-0.4px' }}>Inventory</h2>
          <p style={{ color: '#718096', margin: '0 0 20px', fontSize: '0.9rem' }}>Keep an eye on what's in stock and what's running low. Update any product's stock right here.</p>
          {!currentSiteId ? (
            <div style={{ color: '#718096' }}>Build your website and add products first — your stock will show here.</div>
          ) : productsLoading ? (
            <div style={{ color: '#718096' }}>Loading stock...</div>
          ) : products.length === 0 ? (
            <div style={{ color: '#718096' }}>No products yet. Add products in the Products tab to track stock.</div>
          ) : (() => {
            const inStock = products.filter(p => (p.stock || 0) > LOW_STOCK).length;
            const low = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= LOW_STOCK);
            const out = products.filter(p => (p.stock || 0) <= 0);
            const totalUnits = products.reduce((s, p) => s + (p.stock || 0), 0);
            const sum = [
              { label: 'Total products', value: products.length, color: '#c3c7d4' },
              { label: 'Healthy stock', value: inStock, color: '#4ade80' },
              { label: `Low stock (≤${LOW_STOCK})`, value: low.length, color: '#fbbf24' },
              { label: 'Out of stock', value: out.length, color: '#f87171' },
            ];
            const stockCell = (p: Product) => {
              const id = p.product_id || '';
              const cur = p.stock || 0;
              const edited = stockEdit[id];
              const changed = edited !== undefined && String(cur) !== edited;
              const badge = cur <= 0 ? { t: 'Out', c: '#f87171' } : cur <= LOW_STOCK ? { t: 'Low', c: '#fbbf24' } : { t: 'OK', c: '#4ade80' };
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: badge.c, border: `1px solid ${badge.c}55`, borderRadius: 999, padding: '1px 8px' }}>{badge.t}</span>
                  <input type="number" min={0} value={edited !== undefined ? edited : String(cur)}
                    onChange={e => setStockEdit(prev => ({ ...prev, [id]: e.target.value }))}
                    style={{ width: 70, background: '#fff', color: '#17243b', border: '1px solid #dbe3f0', borderRadius: 8, padding: '6px 8px', fontSize: '0.85rem', textAlign: 'center' }} />
                  <button onClick={() => handleSaveStock(p)} disabled={!changed || stockSavingId === id}
                    style={{ background: changed ? '#2563eb' : '#eef2f8', color: changed ? 'white' : '#718096', border: '1px solid #e4eaf3', borderRadius: 8, padding: '6px 10px', fontSize: '0.8rem', fontWeight: 600, cursor: changed ? 'pointer' : 'default', whiteSpace: 'nowrap' }}>
                    {stockSavingId === id ? '…' : 'Save'}
                  </button>
                </div>
              );
            };
            return (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 22 }}>
                  {sum.map(s => (
                    <div key={s.label} style={{ background: '#ffffff', border: '1px solid #e4eaf3', borderRadius: 14, padding: 18 }}>
                      <div style={{ fontSize: '0.8rem', color: '#718096' }}>{s.label}</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#718096', marginBottom: 22 }}>Total units in stock: <b style={{ color: '#c3c7d4' }}>{totalUnits.toLocaleString('en-IN')}</b></div>

                {(low.length > 0 || out.length > 0) && (
                  <div style={{ background: '#1c1710', border: '1px solid #4a3a12', borderRadius: 14, padding: 18, marginBottom: 24 }}>
                    <h3 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#fbbf24' }}>⚠️ Needs restock ({low.length + out.length})</h3>
                    {[...out, ...low].map(p => (
                      <div key={p.product_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #2a2415', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 140 }}>
                          <div style={{ fontWeight: 600 }}>{p.title}</div>
                          <div style={{ fontSize: '0.75rem', color: '#718096' }}>{(p.stock || 0) <= 0 ? 'Out of stock' : `Only ${p.stock} left`}</div>
                        </div>
                        {stockCell(p)}
                      </div>
                    ))}
                  </div>
                )}

                <h3 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#c3c7d4' }}>All products</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ background: '#ffffff', borderBottom: '1px solid #e4eaf3', color: '#718096' }}>
                        <th style={{ padding: '12px' }}>Product</th>
                        <th style={{ padding: '12px' }}>Price</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.slice().sort((a, b) => (a.stock || 0) - (b.stock || 0)).map(p => (
                        <tr key={p.product_id} style={{ borderBottom: '1px solid #edf1f6' }}>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 600 }}>{p.title}</div>
                            {p.category && <div style={{ fontSize: '0.72rem', color: '#718096' }}>{p.category}</div>}
                          </td>
                          <td style={{ padding: '12px', color: '#c3c7d4' }}>৳{p.price}</td>
                          <td style={{ padding: '12px' }}>{stockCell(p)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {activeTab === 'orders' && (
        <div style={{ padding: '32px 24px', maxWidth: '1100px', margin: '0 auto' }}>
          <div className="amr-eyebrow">Sales operations</div>
          <h2 style={{ color: '#12284c', margin: '2px 0 2px', fontSize: '1.5rem', letterSpacing: '-0.4px' }}>Orders</h2>
          <p className="amr-sub" style={{ margin: '0 0 18px' }}>Manage orders from all your sales channels.</p>
          {(() => {
            const st = (s: string) => (s || '').toLowerCase();
            const pending = orders.filter(o => st(o.status) === 'pending').length;
            const processing = orders.filter(o => ['confirmed', 'processing', 'shipped'].includes(st(o.status))).length;
            const delivered = orders.filter(o => st(o.status) === 'delivered').length;
            const comp = orders.length ? Math.round((delivered / orders.length) * 100) : 0;
            const Stat = ({ l, v, c, s }: { l: string; v: string; c?: string; s?: string }) => (<div className="amr-card"><div style={{ color: '#718096', fontSize: '0.78rem', fontWeight: 600 }}>{l}</div><div className="amr-stat-num" style={{ fontSize: '1.4rem', color: c || '#10264b' }}>{v}</div>{s && <div style={{ fontSize: '0.7rem', color: '#8794a8' }}>{s}</div>}</div>);
            return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: '14px', marginBottom: '16px' }}>
              <Stat l="All Orders" v={String(orders.length)} s="All time" />
              <Stat l="Pending" v={String(pending)} c="#b87914" s="Needs action" />
              <Stat l="Processing" v={String(processing)} c="#2563eb" s="Being prepared" />
              <Stat l="Delivered" v={String(delivered)} c="#159768" s={`${comp}% completion`} />
            </div>;
          })()}
          <div className="amr-card" style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: '9px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <input value={orderSearch} onChange={e => setOrderSearch(e.target.value)} placeholder="Search order or customer…" className="amr-input" style={{ maxWidth: '260px' }} />
            <select value={orderStatusFilter} onChange={e => setOrderStatusFilter(e.target.value)} className="amr-input" style={{ maxWidth: '180px' }}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button className="amr-btn" onClick={() => {
              const rows = orders.map(o => [String(o.id || '').slice(-5), o.customer_name || '', o.customer_phone || '', o.product_title || '', o.product_price * o.quantity + (o.delivery_charge || 0), o.status || ''].map(x => `"${String(x).replace(/"/g, '""')}"`).join(','));
              const csv = 'Order,Customer,Phone,Product,Total,Status\n' + rows.join('\n');
              const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'orders.csv'; a.click();
            }}>↓ Export</button>
          </div>
          {ordersLoading ? <div style={{ color: '#718096' }}>Loading orders...</div> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#ffffff', borderBottom: '1px solid #e4eaf3', color: '#718096' }}>
                    <th style={{ padding: '12px' }}>Order</th>
                    <th style={{ padding: '12px' }}>Product</th>
                    <th style={{ padding: '12px' }}>Customer</th>
                    <th style={{ padding: '12px' }}>Payment</th>
                    <th style={{ padding: '12px' }}>Total</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px' }}>Courier</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.filter(o => {
                    const q = orderSearch.trim().toLowerCase();
                    const matchQ = !q || (o.product_title || '').toLowerCase().includes(q) || (o.customer_name || '').toLowerCase().includes(q) || (o.customer_phone || '').includes(q);
                    const matchS = !orderStatusFilter || (o.status || '').toLowerCase() === orderStatusFilter;
                    return matchQ && matchS;
                  }).map(o => (
                    <tr key={o.id} style={{ borderBottom: '1px solid #edf1f6' }}>
                      <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700, color: '#2563eb' }}>#{String(o.id || '').slice(-5).toUpperCase()}</div>
                        <div style={{ fontSize: '0.72rem', color: '#8794a8' }}>{(() => { try { return new Date(o.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); } catch { return ''; } })()}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600 }}>{o.product_title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#718096' }}>{o.selected_size} {o.selected_color} (x{o.quantity})
                          {o.source === 'woocommerce' && <span title={o.woo_order_id ? `WooCommerce order #${o.woo_order_id}` : 'WooCommerce order'} style={{ marginLeft: '6px', background: '#f3e8ff', color: '#7c3aed', borderRadius: '6px', padding: '1px 6px', fontSize: '0.68rem', fontWeight: 700 }}>WooCommerce{o.woo_order_id ? ` #${o.woo_order_id}` : ''}</span>}
                          {o.source === 'manual' && <span style={{ marginLeft: '6px', background: '#eef2f8', color: '#5e6d88', borderRadius: '6px', padding: '1px 6px', fontSize: '0.68rem', fontWeight: 700 }}>Manual</span>}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div>{o.customer_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#718096' }}>
                          {o.customer_phone}
                          {(() => {
                            const r = phoneRisk[(o.customer_phone || '').trim()];
                            if (!r) return null;
                            // live answers from the merchant's own courier accounts (Pathao rating, Steadfast numbers)
                            const chip = (bg: string, fg: string, t: string, title: string, k: string) => (
                              <span key={k} title={title} style={{ marginLeft: '6px', padding: '1px 7px', borderRadius: '999px', background: bg, color: fg, fontSize: '0.68rem', fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-block', marginTop: '3px' }}>{t}</span>);
                            const live: React.ReactElement[] = [];
                            const pa = r.courier?.pathao;
                            if (pa?.status === 'ok' && pa.rating) {
                              const g = pa.rating.toLowerCase();
                              const tone = /excellent|good/.test(g) ? ['#16301c', '#8fe388'] : /moderate|average|medium/.test(g) ? ['#3a2e14', '#ffcf5c'] : /risk|bad|fraud|poor|fake/.test(g) ? ['#3a1416', '#c44d4d'] : ['#eef2f8', '#718096'];
                              live.push(chip(tone[0], tone[1], 'Pathao: ' + pa.rating.replace(/_/g, ' '), 'Customer rating from Pathao (all Pathao merchants), checked with your Pathao account', 'pa'));
                            } else if (pa?.status === 'unavailable') live.push(chip('#eef2f8', '#718096', 'Pathao: n/a', pa.note || 'Pathao did not answer', 'pa'));
                            const sfc = r.courier?.steadfast;
                            if (sfc?.status === 'ok' && sfc.numbers) {
                              const n = sfc.numbers; const find = (re: RegExp) => { const k = Object.keys(n).find(x => re.test(x)); return k ? n[k] : undefined; };
                              const del = find(/deliver/i), can = find(/cancel|return/i), tot = find(/total/i);
                              live.push(chip('#e8f1fb', '#1d4ed8', `Steadfast: ${del ?? '?'}✓ ${can ?? '?'}✗${tot !== undefined ? ' / ' + tot : ''}`,
                                'Delivered / cancelled from Steadfast (all Steadfast merchants): ' + Object.entries(n).map(([k, v]) => `${k} ${v}`).join(', '), 'sf'));
                            } else if (sfc?.status === 'unavailable') live.push(chip('#eef2f8', '#718096', 'Steadfast: n/a', sfc.note || 'Steadfast did not answer', 'sf'));
                            if (!r.found) return live.length ? <>{live}</> : null;
                            const m = {
                              high:   { bg: '#3a1416', fg: '#c44d4d', t: `⚠️ ${r.returned}/${r.total} returned` },
                              medium: { bg: '#3a2e14', fg: '#ffcf5c', t: `${r.returned}/${r.total} returned` },
                              good:   { bg: '#16301c', fg: '#8fe388', t: `✓ ${r.delivered}/${r.total} delivered` },
                              low_data: { bg: '#eef2f8', fg: '#718096', t: `${r.delivered}✓ ${r.returned}✗ (new)` },
                            }[r.risk] || { bg: '#eef2f8', fg: '#718096', t: `${r.delivered}✓ ${r.returned}✗` };
                            return <>{chip(m.bg, m.fg, m.t, `Automorai history: ${r.delivered} delivered, ${r.returned} returned (${r.return_rate}% return rate)`, 'own')}{live}</>;
                          })()}
                        </div>
                        {o.customer_email && <div style={{ fontSize: '0.72rem', color: '#718096' }}>{o.customer_email}</div>}
                        <div style={{ fontSize: '0.7rem', color: '#666' }}>{o.customer_address}</div>
                        <div style={{ fontSize: '0.7rem', color: '#718096' }}>{o.delivery_location === 'outside' ? '🚴 Outside Dhaka' : '🚴 Dhaka'}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div>{paymentLabels[o.payment_method] || o.payment_method}</div>
                        {o.transaction_id && <div style={{ fontSize: '0.72rem', color: '#12284c' }}>TrxID: {o.transaction_id}</div>}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 700, color: '#2563eb' }}>
                        ৳{o.product_price * o.quantity + (o.delivery_charge || 0)}
                        <div style={{ fontSize: '0.68rem', color: '#718096', fontWeight: 400 }}>incl. ৳{o.delivery_charge || 0} delivery</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <select value={o.status} onChange={e => handleUpdateOrderStatus(o.id, e.target.value)}
                          style={{ background: '#eef2f8', color: statusColors[o.status] || 'white', border: '1px solid #e4eaf3', borderRadius: '6px', padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer' }}>
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {bookings[o.id] ? (
                          <div style={{ fontSize: '0.75rem' }}>
                            <div style={{ color: '#8fe388', fontWeight: 600 }}>🚚 Booked</div>
                            <div style={{ color: '#12284c' }}>{bookings[o.id].tracking_code}</div>
                            <div style={{ color: '#718096', fontSize: '0.68rem' }}>{bookings[o.id].courier_status}</div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {courierConfigured.steadfast && (
                              <button onClick={() => handleSendToCourier(o)} disabled={bookingOrderId === o.id}
                                style={{ background: '#eef2f8', color: '#12284c', border: '1px solid #39405c', borderRadius: '6px', padding: '6px 10px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                {bookingOrderId === o.id ? '⏳ Booking…' : '🚚 Steadfast'}
                              </button>
                            )}
                            {courierConfigured.pathao && (
                              <button onClick={() => openPathaoBooking(o)}
                                style={{ background: '#eef2f8', color: '#ff9e6d', border: '1px solid #39405c', borderRadius: '6px', padding: '6px 10px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                🚚 Pathao
                              </button>
                            )}
                            {!courierConfigured.steadfast && !courierConfigured.pathao && (
                              <span style={{ color: '#718096', fontSize: '0.7rem' }}>Set courier keys in Settings</span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </div>
        </div>
      )}
      </div>

      {pathaoOrder && (
        <div onClick={() => !pathaoBooking && setPathaoOrder(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#13161f', border: '1px solid #2a2f45', borderRadius: '14px', padding: '22px', width: '100%', maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '4px', color: '#fff' }}>🚚 Book with Pathao</div>
            <div style={{ color: '#718096', fontSize: '0.8rem', marginBottom: '16px' }}>
              {pathaoOrder.customer_name} · {pathaoOrder.customer_phone} · COD ৳{pathaoOrder.product_price * pathaoOrder.quantity + (pathaoOrder.delivery_charge || 0)}
            </div>
            {geoLoading === 'loading' ? (
              <div style={{ color: '#718096', padding: '20px 0' }}>Loading Pathao locations…</div>
            ) : (
              <>
                {[
                  { label: 'Pickup Store', val: geoSel.store, items: geoStores, on: (v: string) => setGeoSel(s => ({ ...s, store: v })), ph: 'Select store' },
                  { label: 'Recipient City', val: geoSel.city, items: geoCities, on: onGeoCity, ph: 'Select city' },
                  { label: `Zone${geoLoading === 'zone' ? ' (loading…)' : ''}`, val: geoSel.zone, items: geoZones, on: onGeoZone, ph: 'Select zone', dis: !geoSel.city || geoLoading === 'zone' },
                  { label: `Area (optional)${geoLoading === 'area' ? ' (loading…)' : ''}`, val: geoSel.area, items: geoAreas, on: (v: string) => setGeoSel(s => ({ ...s, area: v })), ph: 'Select area', dis: !geoSel.zone || geoLoading === 'area' },
                ].map(row => (
                  <div key={row.label} style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#718096', marginBottom: '4px' }}>{row.label}</label>
                    <select value={row.val} disabled={(row as { dis?: boolean }).dis}
                      onChange={e => row.on(e.target.value)}
                      style={{ width: '100%', background: '#eef2f8', color: '#fff', border: '1px solid #39405c', borderRadius: '8px', padding: '9px 10px', fontSize: '0.85rem' }}>
                      <option value="">{row.ph}</option>
                      {row.items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                    </select>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
                  <button onClick={() => setPathaoOrder(null)} disabled={pathaoBooking}
                    style={{ flex: 1, background: '#eef2f8', color: '#718096', border: '1px solid #39405c', borderRadius: '8px', padding: '10px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={confirmPathaoBooking} disabled={pathaoBooking || !geoSel.store || !geoSel.city || !geoSel.zone}
                    style={{ flex: 2, background: '#ff7a3c', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 700, cursor: 'pointer', opacity: (pathaoBooking || !geoSel.store || !geoSel.city || !geoSel.zone) ? 0.6 : 1 }}>
                    {pathaoBooking ? '⏳ Booking…' : 'Book Parcel'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
