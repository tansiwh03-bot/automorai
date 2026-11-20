import { useState, useEffect, useRef, Fragment } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import SalesReport from '../components/SalesReport';
import { LayoutDashboard, Inbox as InboxIcon, Globe, Package, Boxes, ShoppingBag, BarChart3, Bell, ChevronDown, Users, CreditCard, Sparkles, Plug, Truck, Megaphone, Workflow, Settings as SettingsIcon } from 'lucide-react';

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
const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'inbox' | 'website' | 'products' | 'stock' | 'orders' | 'courier' | 'customers' | 'assistant' | 'marketing' | 'automations' | 'integrations' | 'settings' | 'billing' | 'reports'>('home');
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [packages, setPackages] = useState<string[]>([]);

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
  // Courier delivery-history check per phone (fraud/return risk), keyed by phone
  const [phoneRisk, setPhoneRisk] = useState<Record<string, { found: boolean; delivered: number; returned: number; total: number; return_rate: number; risk: string }>>({});

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
      .then(data => { if (Array.isArray(data.packages)) setPackages(data.packages); })
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
  const handleTenderConnect   = () => { window.location.href = '/connect-tender'; };
    const handlePixelGAConnect  = () => { window.location.href = '/connect-pixel-ga'; };

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
  const PREVIEW_GUARD = '<script>(function(){var f=window.fetch;window.fetch=function(u,o){var s=String(u||"");'
    + 'if(s.indexOf("/new-order")>-1){alert("Preview mode: orders start working once your website is live.");'
    + 'return Promise.resolve(new Response(JSON.stringify({success:false}),{headers:{"Content-Type":"application/json"}}));}'
    + 'if(s.indexOf("/storefront-chat")>-1){return Promise.resolve(new Response(JSON.stringify({reply:"Preview mode: chat works once the website is live."}),{headers:{"Content-Type":"application/json"}}));}'
    + 'return f.apply(this,arguments);};})();</' + 'script>';
  const previewDoc = previewHtml ? previewHtml.replace(/<head[^>]*>/i, m => m + PREVIEW_GUARD) : '';

  const handleUpdateWebsite = async () => {
    if (!currentSiteId) return;
    if (!confirm('Update this website to the latest design and features? Your products and settings stay exactly as they are — only the site’s look and features get refreshed.')) return;
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
            Automor<span style={{ color: '#26c9ef' }}>ai</span>
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
            </button>
            </Fragment>
          );})}
        </div>
        <div style={{ padding: '14px 18px', borderTop: '1px solid #ffffff20' }}>
          <div style={{ color: '#26c9ef', fontSize: '0.72rem', fontWeight: 600, marginBottom: '8px' }}>● All systems operational</div>
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
            Automor<span style={{ color: '#2563eb' }}>ai</span>
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
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'grid', placeItems: 'center', background: '#dcecff', color: '#0a1f5c', fontWeight: 800, fontSize: '0.8rem' }}>{wsInitials}</div>
            <div style={{ fontSize: '0.78rem', lineHeight: 1.2 }}>
              <div style={{ fontWeight: 700, color: '#17243b' }}>{wsName}</div>
              <div style={{ color: '#8290a4' }}>Store Admin</div>
            </div>
          </div>
        </div>

      {/* ════════ HOME TAB ════════ */}
      {activeTab === 'home' && (
        <div style={{ padding: '40px 32px', maxWidth: '1000px', margin: '0 auto' }}>
          <div className="amr-eyebrow">Business command center</div>
          <h1 className="amr-pagehead" style={{ fontSize: '1.55rem', margin: '4px 0 2px', color: '#12284c', letterSpacing: '-0.4px' }}>Welcome back 👋</h1>
          <p className="amr-sub" style={{ margin: '0 0 26px' }}>{user.email}</p>

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
            const recent = [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
            const pillClass = (s: string) => {
              const v = (s || '').toLowerCase();
              if (v === 'delivered') return 'delivered';
              if (v === 'cancelled' || v === 'canceled' || v === 'returned') return 'cancelled';
              if (v === 'pending' || v === '') return 'pending';
              return 'processing';
            };
            const fmtDate = (d: string) => { try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); } catch { return d; } };
            const Stat = ({ label, value, ico, foot }: { label: string; value: string; ico: string; foot?: React.ReactNode }) => (
              <div className="amr-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#718096', fontSize: '0.75rem', fontWeight: 600 }}>{label}<span className="amr-stat-ico">{ico}</span></div>
                <div className="amr-stat-num">{value}</div>
                {foot && <div style={{ fontSize: '0.7rem', color: '#718096' }}>{foot}</div>}
              </div>
            );
            return (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '18px' }}>
                  <Stat label="Today's Revenue" ico="৳" value={`৳${todayRev.toLocaleString()}`} foot={`${todayOrders.length} orders today`} />
                  <Stat label="Total Orders" ico="🛍️" value={String(orders.length)} foot={ordersLoading ? 'Loading…' : 'All time'} />
                  <Stat label="Pending Orders" ico="⏳" value={String(pending)} foot={pending ? <span style={{ color: '#b87914' }}>Needs action</span> : 'All clear'} />
                  <Stat label="Products" ico="📦" value={String(products.length)} foot={lowStock + outStock > 0 ? <span style={{ color: '#d98a20' }}>⚠ {lowStock + outStock} need restock</span> : 'In stock'} />
                </div>

                {(() => {
                  const DAY = 86400000; const n = Date.now();
                  const days: { key: string; sales: number }[] = [];
                  for (let i = 13; i >= 0; i--) { const d = new Date(n - i * DAY); days.push({ key: d.toDateString(), sales: 0 }); }
                  const idx: Record<string, number> = {}; days.forEach((d, i) => { idx[d.key] = i; });
                  orders.forEach(o => { if ((o.status || '').toLowerCase() === 'cancelled') return; const k = (() => { try { return new Date(o.created_at).toDateString(); } catch { return ''; } })(); if (idx[k] !== undefined) days[idx[k]].sales += amt(o); });
                  const max = Math.max(1, ...days.map(d => d.sales));
                  const W = 640, H = 120;
                  const pts = days.map((d, i) => [days.length === 1 ? 0 : (i / (days.length - 1)) * W, H - (d.sales / max) * (H - 12)]);
                  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
                  const total14 = days.reduce((s, d) => s + d.sales, 0);
                  return (
                    <div className="amr-card" style={{ marginBottom: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                        <div><h3 style={{ margin: 0, fontSize: '0.95rem', color: '#183052' }}>Sales Performance</h3><span style={{ fontSize: '0.72rem', color: '#718096' }}>Last 14 days</span></div>
                        <div style={{ fontWeight: 800, color: '#2563eb', fontSize: '1.05rem' }}>৳{Math.round(total14).toLocaleString()}</div>
                      </div>
                      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: '130px' }}>
                        <defs><linearGradient id="ovFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#2563eb" stopOpacity="0.22" /><stop offset="1" stopColor="#2563eb" stopOpacity="0" /></linearGradient></defs>
                        <path d={`${line} L${W} ${H} L0 ${H} Z`} fill="url(#ovFill)" />
                        <path d={line} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  );
                })()}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(168px,1fr))', gap: '14px', marginBottom: '18px' }}>
                  {[
                    { ico: '📦', t: 'Add Product', s: 'Publish a new item', go: () => setActiveTab('products') },
                    { ico: '🛍️', t: 'View Orders', s: 'Manage your orders', go: () => setActiveTab('orders') },
                    { ico: '🌐', t: 'Edit Website', s: 'Update your storefront', go: () => setActiveTab('website') },
                    { ico: '📈', t: 'Sales Report', s: 'See your analytics', go: () => setActiveTab('reports') },
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
                      <table className="amr-table" style={{ minWidth: '460px' }}>
                        <thead><tr><th>Customer</th><th>Product</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
                        <tbody>
                          {recent.map((o, i) => (
                            <tr key={o.id || i}>
                              <td style={{ fontWeight: 650, color: '#213b5e' }}>{o.customer_name || '—'}</td>
                              <td>{o.product_title || '—'}</td>
                              <td>{fmtDate(o.created_at)}</td>
                              <td><b>৳{amt(o).toLocaleString()}</b></td>
                              <td><span className={`amr-pill ${pillClass(o.status)}`}>{o.status || 'pending'}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div className="amr-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#183052' }}>Needs Your Attention</h3>
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
            {packages.includes('tender') ? (
              <TaskCard icon="📋" title="Connect Tender Automation"
                desc="Enable automatic tender-related notifications."
                action={{ label: 'Connect', onClick: handleTenderConnect }} />
            ) : (
              <TaskCard icon="📋" title="Tender Automation"
                desc="Separate package — ৳20,000 installation (covers 1st month), then ৳5,000/month."
                action={{ label: 'Buy Package', onClick: () => { window.location.href = '/buy-package?package=tender'; } }} />
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

      {/* ════════ INBOX TAB ════════ */}
      {activeTab === 'inbox' && (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
          <div style={{ width: '320px', minWidth: '320px', borderRight: '1px solid #e4eaf3', overflowY: 'auto', background: '#ffffff' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #e4eaf3', fontWeight: 700, fontSize: '1rem', color: '#2563eb' }}>💬 Unified Inbox</div>
            {inboxLoading && <div style={{ padding: '24px', color: '#718096', textAlign: 'center' }}>Loading conversations...</div>}
            {inboxError && <div style={{ padding: '16px', color: '#c44d4d', fontSize: '0.9rem' }}>{inboxError}</div>}
            {!inboxLoading && !inboxError && conversations.length === 0 && (
              <div style={{ padding: '24px', color: '#718096', textAlign: 'center', fontSize: '0.9rem' }}>No conversations yet.<br />Connect Facebook or WhatsApp to start.</div>
            )}
            {conversations.map(conv => (
              <div key={conv.id} onClick={() => { setSelectedConversation(conv); setReplyText(''); setReplyError(''); }} style={{ padding: '14px 16px',
                borderBottom: '1px solid #edf1f6', cursor: 'pointer',
                background: selectedConversation?.id === conv.id ? '#f0f4fb' : 'transparent', transition: 'background 0.15s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{conv.name}</span>
                  <span style={{ color: '#718096', fontSize: '0.75rem' }}>{formatTime(conv.last_time)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <PlatformBadge platform={conv.platform} />
                  <span style={{ color: '#718096', fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{conv.last_message}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {!selectedConversation ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#718096', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '2rem' }}>💬</span>
                <span>Select a conversation to view messages</span>
              </div>
            ) : (
              <>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #e4eaf3', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{selectedConversation.name}</div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                      <PlatformBadge platform={selectedConversation.platform} />
                      <span style={{ color: '#718096', fontSize: '0.78rem' }}>{selectedConversation.sender_id}</span>
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedConversation.messages.slice().sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                    .map((msg, i) => {
                      const isUser = msg.role === 'user';
                      return (
                        <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-start' : 'flex-end' }}>
                          <div style={{ maxWidth: '65%', padding: '10px 14px', borderRadius: isUser ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                            background: isUser ? '#eef4fb' : '#2563eb', color: isUser ? '#17243b' : 'white', fontSize: '0.9rem', lineHeight: '1.5' }}>
                            <div>{msg.message}</div>
                            <div style={{ fontSize: '0.72rem', color: isUser ? '#718096' : 'rgba(255,255,255,0.6)', marginTop: '4px', textAlign: 'right' }}>{formatTime(msg.timestamp)}</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
                {replyError && (
                  <div style={{ padding: '8px 20px', background: '#ffeded', color: '#c44d4d', fontSize: '0.8rem' }}>❌ {replyError}</div>
                )}
                <div style={{ padding: '14px 20px', borderTop: '1px solid #e4eaf3', background: '#ffffff', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input placeholder="Type your reply..." value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !replySending) handleSendReply(); }}
                    disabled={replySending}
                    style={{ flex: 1, padding: '10px 14px', background: '#fff', border: '1px solid #dbe3f0', borderRadius: '10px', color: '#17243b', fontSize: '0.9rem', outline: 'none' }} />
                  <button onClick={handleSendReply} disabled={replySending || !replyText.trim()}
                    style={{ padding: '10px 18px', background: replySending || !replyText.trim() ? '#2563eb44' : '#2563eb',
                      color: replySending || !replyText.trim() ? '#2563eb' : 'white', border: 'none', borderRadius: '10px',
                      cursor: replySending || !replyText.trim() ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                    {replySending ? '...' : 'Send'}
                  </button>
                </div>
              </>
            )}
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
                          <p style={{ color: '#12284c', fontWeight: 700, fontSize: '0.85rem', margin: '0 0 6px' }}>Payment Methods</p>
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
                          <p style={{ color: '#12284c', fontWeight: 700, fontSize: '0.85rem', margin: '0 0 6px' }}>Delivery Charge</p>
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
                          <p style={{ color: '#12284c', fontWeight: 700, fontSize: '0.85rem', margin: '0 0 6px' }}>Courier Integration</p>
                          <p style={{ color: '#718096', fontSize: '0.78rem', margin: '0 0 12px' }}>
                            Connect your own Steadfast or Pathao courier account. Each business needs its own courier account (parcels are picked up from your own shop) — this just saves your credentials securely for now; automatic booking is coming soon.
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

                        {/* ── Shop Info (used by the chat assistant) ── */}
                        <div style={{ marginBottom: '18px', paddingBottom: '18px', borderBottom: '1px solid #eef2f8' }}>
                          <p style={{ color: '#12284c', fontWeight: 700, fontSize: '0.85rem', margin: '0 0 6px' }}>Shop Info</p>
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
                          <p style={{ color: '#12284c', fontWeight: 700, fontSize: '0.85rem', margin: '0 0 6px' }}>Navigation Menu</p>
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
      {activeTab === 'products' && (
        <div style={{ padding: '32px 24px', maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <div className="amr-eyebrow">Catalog management</div>
              <h2 style={{ color: '#12284c', margin: '2px 0', fontSize: '1.5rem', letterSpacing: '-0.4px' }}>Products</h2>
              <p style={{ color: '#718096', margin: '4px 0 0', fontSize: '0.85rem' }}>Website: {currentSiteId || 'Not created yet'}</p>
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
            <div style={{ display: 'flex', gap: '9px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search products…" className="amr-input" style={{ maxWidth: '260px' }} />
              <select value={productCatFilter} onChange={e => setProductCatFilter(e.target.value)} className="amr-input" style={{ maxWidth: '200px' }}>
                <option value="">All categories</option>
                {[...new Set(products.map(p => (p.category || '').trim()).filter(Boolean))].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
          {/* Product Grid */}
          {productsLoading ? <div style={{ color: '#718096' }}>Products loading...</div> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              {products.filter(p => {
                const q = productSearch.trim().toLowerCase();
                const matchQ = !q || (p.title || '').toLowerCase().includes(q);
                const matchC = !productCatFilter || (p.category || '').trim() === productCatFilter;
                return matchQ && matchC;
              }).map(p => (
                <div key={p.product_id} style={{ background: '#ffffff', border: '1px solid #e4eaf3', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ height: '160px', background: '#f0f4fb', position: 'relative' }}>
                    {isSampleProduct(p) && (
                      <span style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 2, background: '#ffb84c', color: '#1a1200',
                        fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '20px' }}>Sample</span>
                    )}
                    {p.images && p.images[0] ? (
                      <img src={p.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '2rem' }}>🛍️</div>}
                  </div>
                  <div style={{ padding: '14px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>{p.title}</div>
                    <div style={{ color: '#2563eb', fontWeight: 800 }}>৳{p.price} {p.original_price ? <span style={{ color: '#718096', textDecoration: 'line-through', fontSize: '0.8rem' }}>৳{p.original_price}</span> : null}</div>
                    <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: '6px' }}>Stock: {p.stock} pcs</div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button onClick={() => handleEditProduct(p)} style={{ flex: 1, padding: '6px', background: '#2563eb22', color: '#2563eb', border: '1px solid #2563eb', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Edit</button>
                      <button onClick={() => p.product_id && handleDeleteProduct(p.product_id)} style={{ flex: 1, padding: '6px', background: '#ffeded', color: '#c44d4d', border: '1px solid #c44d4d44', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
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
              { icon: '🏷️', name: 'Google Tag Manager', desc: 'Manage all your marketing tags in one place.', soon: true },
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
          {(() => {
            const hasPkg = packages.includes('automation');
            const rows = [
              { icon: '📘', name: 'Facebook & Messenger', desc: 'Auto-reply to page comments and Messenger.', connected: !!connectedPage, action: hasPkg ? handleFacebookConnect : () => { window.location.href = '/buy-package?package=automation'; }, label: hasPkg ? 'Connect' : 'Buy Package' },
              { icon: '💬', name: 'WhatsApp Business', desc: 'Chat with customers and show products on WhatsApp.', connected: !!waPageId, action: hasPkg ? handleWhatsAppConnect : () => { window.location.href = '/buy-package?package=automation'; }, label: hasPkg ? 'Connect' : 'Buy Package' },
              { icon: '📊', name: 'Meta Pixel & Google Analytics', desc: 'Track visitors, add-to-cart and purchases.', connected: false, action: hasPkg ? handlePixelGAConnect : () => { window.location.href = '/buy-package?package=automation'; }, label: hasPkg ? 'Set up' : 'Buy Package' },
              { icon: '🚚', name: 'Steadfast Courier', desc: 'Book parcels and check delivery / fraud history.', connected: courierConfigured.steadfast, action: () => { setActiveTab('website'); setShowSettings(true); }, label: 'Configure' },
              { icon: '➤', name: 'Pathao Courier', desc: 'Book parcels across 64 districts.', connected: courierConfigured.pathao, action: () => { setActiveTab('website'); setShowSettings(true); }, label: 'Configure' },
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
              { key: 'automation', name: 'Automation', price: '৳2,490 / month', desc: 'Website, Facebook, Messenger, WhatsApp, Inbox, Orders, Courier, Analytics.' },
              { key: 'tender', name: 'Tender', price: '৳20,000 setup + ৳5,000 / month', desc: 'Automatic tender alerts & setup (separate package).' },
            ];
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: '16px' }}>
                {plans.map(p => {
                  const active = packages.includes(p.key);
                  return (
                    <div key={p.key} className="amr-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#12284c' }}>{p.name}</h3>
                        <span className={`amr-pill ${active ? 'delivered' : 'pending'}`}>{active ? 'Active' : 'Not active'}</span>
                      </div>
                      <div style={{ color: '#2563eb', fontWeight: 800, fontSize: '1.05rem', marginBottom: '8px' }}>{p.price}</div>
                      <p style={{ color: '#718096', fontSize: '0.85rem', margin: '0 0 16px', lineHeight: 1.6 }}>{p.desc}</p>
                      {active ? (
                        <div style={{ color: '#159768', fontWeight: 700, fontSize: '0.85rem' }}>✓ You are subscribed</div>
                      ) : (
                        <button className="amr-btn-primary amr-btn" style={{ color: '#fff' }} onClick={() => { window.location.href = `/buy-package?package=${p.key}`; }}>Buy {p.name} →</button>
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
          <h2 style={{ color: '#12284c', margin: '2px 0 16px', fontSize: '1.5rem', letterSpacing: '-0.4px' }}>Orders</h2>
          {(() => {
            const st = (s: string) => (s || '').toLowerCase();
            const pending = orders.filter(o => st(o.status) === 'pending').length;
            const processing = orders.filter(o => ['confirmed', 'processing', 'shipped'].includes(st(o.status))).length;
            const delivered = orders.filter(o => st(o.status) === 'delivered').length;
            const Stat = ({ l, v, c }: { l: string; v: string; c?: string }) => (<div className="amr-card"><div style={{ color: '#718096', fontSize: '0.78rem', fontWeight: 600 }}>{l}</div><div className="amr-stat-num" style={{ fontSize: '1.4rem', color: c || '#10264b' }}>{v}</div></div>);
            return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: '14px', marginBottom: '16px' }}>
              <Stat l="All Orders" v={String(orders.length)} />
              <Stat l="Pending" v={String(pending)} c="#b87914" />
              <Stat l="Processing" v={String(processing)} c="#2563eb" />
              <Stat l="Delivered" v={String(delivered)} c="#159768" />
            </div>;
          })()}
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
          </div>
          {ordersLoading ? <div style={{ color: '#718096' }}>Loading orders...</div> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#ffffff', borderBottom: '1px solid #e4eaf3', color: '#718096' }}>
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
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600 }}>{o.product_title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#718096' }}>{o.selected_size} {o.selected_color} (x{o.quantity})</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div>{o.customer_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#718096' }}>
                          {o.customer_phone}
                          {(() => {
                            const r = phoneRisk[(o.customer_phone || '').trim()];
                            if (!r || !r.found) return null;
                            const m = {
                              high:   { bg: '#3a1416', fg: '#c44d4d', t: `⚠️ ${r.returned}/${r.total} returned` },
                              medium: { bg: '#3a2e14', fg: '#ffcf5c', t: `${r.returned}/${r.total} returned` },
                              good:   { bg: '#16301c', fg: '#8fe388', t: `✓ ${r.delivered}/${r.total} delivered` },
                              low_data: { bg: '#eef2f8', fg: '#718096', t: `${r.delivered}✓ ${r.returned}✗ (new)` },
                            }[r.risk] || { bg: '#eef2f8', fg: '#718096', t: `${r.delivered}✓ ${r.returned}✗` };
                            return <span title={`Courier history: ${r.delivered} delivered, ${r.returned} returned (${r.return_rate}% return rate)`}
                              style={{ marginLeft: '6px', padding: '1px 7px', borderRadius: '999px', background: m.bg, color: m.fg, fontSize: '0.68rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{m.t}</span>;
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
