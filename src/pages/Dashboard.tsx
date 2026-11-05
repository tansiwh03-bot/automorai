import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

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
  width: '100%', padding: '10px 14px', background: '#1e2130',
  border: '1px solid #262a38', borderRadius: '8px', color: 'white',
  fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box'
};

const btnStyle = (bg: string, fg: string): React.CSSProperties => ({
  width: '100%', padding: '12px', background: bg, color: fg,
  border: 'none', borderRadius: '8px', fontWeight: 700,
  cursor: 'pointer', marginBottom: '12px', fontSize: '0.9rem', transition: 'all 0.2s'
});

const taskCardStyle: React.CSSProperties = {
  background: '#12141c', border: '1px solid #262a38', borderRadius: '14px',
  padding: '22px', display: 'flex', flexDirection: 'column',
};
const taskCardIconStyle: React.CSSProperties = {
  fontSize: '1.6rem', marginBottom: '12px',
};
const taskCardTitleStyle: React.CSSProperties = {
  fontWeight: 700, fontSize: '0.98rem', marginBottom: '6px',
};
const taskCardDescStyle: React.CSSProperties = {
  color: '#8b90a3', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: '16px', flex: 1,
};
const taskCardBtnStyle: React.CSSProperties = {
  padding: '9px 16px', background: '#7c5cff', color: 'white', border: 'none',
  borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', alignSelf: 'flex-start',
};

const TaskCard = ({ icon, title, desc, action, done }: { icon: string; title: string; desc: string; action?: { label: string; onClick: () => void }; done?: boolean }) => (
  <div style={taskCardStyle}>
    <div style={taskCardIconStyle}>{icon}</div>
    <div style={{ ...taskCardTitleStyle, color: done ? '#c8ff5c' : 'white' }}>{done ? `✅ ${title}` : title}</div>
    <div style={taskCardDescStyle}>{desc}</div>
    {action && <button onClick={action.onClick} style={taskCardBtnStyle}>{action.label}</button>}
  </div>
);

const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => {
  const isRequired = label.endsWith(' *');
  const labelText = isRequired ? label.slice(0, -2) : label;
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', color: '#aab0c0', fontWeight: 600 }}>
        {labelText}{isRequired && <span style={{ color: '#e5484d' }}> *</span>}
      </label>
      {children}
    </div>
  );
};

const Toggle = ({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContents: 'space-between', background: '#181b26', padding: '12px 16px', borderRadius: '10px' }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{label}</div>
      <div style={{ fontSize: '0.78rem', color: '#8b90a3' }}>{desc}</div>
    </div>
    <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} style={{ cursor: 'pointer', width: '18px', height: '18px' }} />
  </div>
);

const PlatformBadge = ({ platform }: { platform: string }) => {
  const config: Record<string, { label: string; color: string }> = {
    whatsapp:  { label: 'WhatsApp',  color: '#25D366' },
    messenger: { label: 'Messenger', color: '#0099FF' },
    facebook:  { label: 'Facebook',  color: '#1877F2' },
    website:   { label: 'Website',   color: '#7c5cff' },
  };
  const c = config[platform] ?? { label: platform, color: '#8b90a3' };
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
  const [activeTab, setActiveTab] = useState<'home' | 'inbox' | 'website' | 'products' | 'orders'>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    business_name: '', niche: 'kids_wear', whatsapp_number: '', accent_color: '#7c5cff',
  });
  const [websiteBuilding,  setWebsiteBuilding]  = useState(false);
  const [websiteResult,    setWebsiteResult]    = useState<{ url: string; business_name: string; site_id?: string } | null>(null);
  const [websiteError,     setWebsiteError]     = useState('');
  const [websiteUpdating,  setWebsiteUpdating]  = useState(false);
  const [websiteUpdateMsg, setWebsiteUpdateMsg] = useState('');
  const [websiteUrlCopied, setWebsiteUrlCopied] = useState(false);

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
  };
  const [showSettings,     setShowSettings]     = useState(false);
  const [websiteSettings,  setWebsiteSettings]  = useState<WebsiteSettings>(emptySettings);
  const [settingsLoading,  setSettingsLoading]  = useState(false);
  const [settingsSaving,   setSettingsSaving]   = useState(false);
  const [settingsSaved,    setSettingsSaved]    = useState(false);
  const [settingsUploading, setSettingsUploading] = useState<string>(''); // holds which field is uploading, e.g. 'slide1_img'

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

  // ── Facebook OAuth ──
  const urlParams = new URLSearchParams(window.location.search);
  const fbCode    = urlParams.get('code');

  // The site switch (?set_site=slug) itself already happened in currentSiteId's initializer above,
  // so this just tidies the URL afterward.
  useEffect(() => {
    if (urlParams.get('set_site')) window.history.replaceState({}, '', '/dashboard');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore the "website already built" view on reload/re-login using the slug saved in
  // localStorage, since websiteResult itself is only ever set in-memory when a site is built.
  useEffect(() => {
    if (websiteResult || !currentSiteId) return;
    const displayName = currentSiteId.replace(/-\d{6}$/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    setWebsiteResult({
      url: `https://${currentSiteId}.tansiwh03.workers.dev`,
      business_name: displayName || currentSiteId,
      site_id: currentSiteId,
    });
  }, [currentSiteId, websiteResult]);

  // localStorage only remembers a site on the browser/device that built it. If this browser
  // has no site reference but the account does (on the backend, keyed by user_id), look it up
  // instead of showing "Build Your Website" to someone who already has one.
  const [mySites, setMySites] = useState<{ business_slug: string; business_name: string; website_url: string }[]>([]);
  useEffect(() => {
    if (!user?.email) return;
    fetch(`${MY_WEBSITES_API}?user_id=${encodeURIComponent(user.email)}`)
      .then(res => res.json())
      .then(data => {
        const sites = data.sites || [];
        setMySites(sites);
        if (!currentSiteId && sites.length === 1) {
          const s = sites[0];
          setCurrentSiteId(s.business_slug);
          try { localStorage.setItem('automorai_site_id', s.business_slug); } catch {}
          setWebsiteResult({ url: s.website_url, business_name: s.business_name, site_id: s.business_slug });
        }
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
          return fetch(WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.email, email: user.email, page_id: 'pending',
              page_access_token: tokenData.access_token, comment_reply_enabled: true,
              messenger_reply_enabled: true, timestamp: new Date().toISOString() }) })
            .then(r => r.json())
            .then(webhookData => {
              setConnectedPage(webhookData.page_name || 'Facebook Page');
              setStatus('✅ Connected successfully!');
              window.history.replaceState({}, '', '/dashboard');
            });
        })
        .catch(() => setStatus('❌ Connection failed. Please try again.'));
    }
  }, [fbCode, connectedPage, user]);

  useEffect(() => {
    if (!user) return;
    fetch(`https://n8n2.kingpurefood.com/webhook/automorai/inbox?user_id=${encodeURIComponent(user.email)}`)
      .then(r => r.json()).then(data => { if (data.wa_page_ids?.length > 0) setWaPageId(data.wa_page_ids[0]); })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (activeTab !== 'inbox' || !user) return;
    setInboxLoading(true); setInboxError('');
    fetch(`${INBOX_API}?user_id=${encodeURIComponent(user.email)}`)
      .then(r => r.json()).then(data => { setConversations(data.conversations || []); setInboxLoading(false); })
      .catch(() => { setInboxError('Could not load conversations. Please try again.'); setInboxLoading(false); });
  }, [activeTab, user]);

  useEffect(() => {
    if (activeTab !== 'products' || !currentSiteId) return;
    loadProducts();
  }, [activeTab, currentSiteId]);

  useEffect(() => {
    if (activeTab !== 'website' || !currentSiteId || !showSettings) return;
    loadWebsiteSettings();
  }, [activeTab, currentSiteId, showSettings]);

  useEffect(() => {
    if (activeTab !== 'orders' || !currentSiteId) return;
    loadOrders();
  }, [activeTab, currentSiteId]);

  if (!user) return <p style={{ color: 'white' }}>Please login</p>;

  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await fetch(`${PRODUCTS_API}?business_slug=${encodeURIComponent(currentSiteId)}`);
      const data = await res.json();
      setProducts(data.success && Array.isArray(data.products) ? data.products : []);
    } catch { setProducts([]); }
    setProductsLoading(false);
  };

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch(`${ORDERS_API}?business_slug=${encodeURIComponent(currentSiteId)}`);
      const data = await res.json();
      setOrders(data.success && Array.isArray(data.orders) ? data.orders : []);
    } catch { setOrders([]); }
    setOrdersLoading(false);
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`${SETTINGS_API}?business_slug=${encodeURIComponent(currentSiteId)}`);
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

  const handleSaveSettings = async () => {
    if (!currentSiteId) return;
    setSettingsSaving(true); setSettingsSaved(false);
    try {
      const res = await fetch(`${SETTINGS_API}/save`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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
      await fetch(`${PRODUCTS_API}/delete?product_id=${encodeURIComponent(productId)}`, { method: 'DELETE' });
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
      try { await fetch(`${PRODUCTS_API}/delete?product_id=${encodeURIComponent(p.product_id)}`, { method: 'DELETE' }); } catch {}
    }
    loadProducts();
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await fetch(ORDER_STATUS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status }),
      });
      loadOrders();
    } catch {}
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: websiteForm.business_name,
          niche: websiteForm.niche,
          whatsapp_number: websiteForm.whatsapp_number,
          accent_color: websiteForm.accent_color,
          user_id: user.email,
        }),
      });
      const data = await res.json();
      if (data.success && data.website_url) {
        setWebsiteResult({ url: data.website_url, business_name: websiteForm.business_name, site_id: data.slug });
        if (data.slug) {
          setCurrentSiteId(data.slug);
          try { localStorage.setItem('automorai_site_id', data.slug); } catch {}
          setProductForm(prev => ({ ...prev, business_slug: data.slug }));
        }
      } else { setWebsiteError('Could not create website. Please try again.'); }
    } catch { setWebsiteError('Connection error. Please try again.'); }
    setWebsiteBuilding(false);
  };

  const handleUpdateWebsite = async () => {
    if (!currentSiteId) return;
    if (!confirm('Update this website to the latest design and features? Your products and settings stay exactly as they are — only the site’s look and features get refreshed.')) return;
    setWebsiteUpdating(true); setWebsiteUpdateMsg('');
    try {
      const res = await fetch(WEBSITE_UPDATE_API, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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
    pending: '#ffb84c', confirmed: '#7c5cff', shipped: '#0099FF', delivered: '#25D366', cancelled: '#ff5c5c'
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
    { key: 'home' as const, label: 'Home', icon: '🏠' },
    { key: 'inbox' as const, label: 'Inbox', icon: '💬' },
    { key: 'website' as const, label: 'Website', icon: '🌐' },
    { key: 'products' as const, label: 'Products', icon: '📦' },
    { key: 'orders' as const, label: 'Orders', icon: '🛍️' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#06070a', fontFamily: 'sans-serif', color: 'white', display: 'flex' }}>

      <style>{`
        .amr-sidebar { width: 220px; min-width: 220px; position: sticky; top: 0; left: auto; }
        .amr-sidebar-overlay { display: none; }
        .amr-mobile-topbar { display: none; }
        @media (max-width: 768px) {
          .amr-sidebar {
            position: fixed !important; left: -240px; top: 0; z-index: 210; width: 240px; min-width: 240px;
            box-shadow: 8px 0 24px rgba(0,0,0,0.5); transition: left 0.25s;
          }
          .amr-sidebar.open { left: 0 !important; }
          .amr-sidebar-overlay.open {
            display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 205;
          }
          .amr-mobile-topbar { display: flex !important; }
          .amr-sidebar-close { display: inline-flex !important; }
        }
      `}</style>

      {/* ── Sidebar ── */}
      <div className={`amr-sidebar${sidebarOpen ? ' open' : ''}`} style={{ background: '#0d0e14', borderRight: '1px solid #1e2130',
        display: 'flex', flexDirection: 'column', height: '100dvh', maxHeight: '100dvh', overflowY: 'auto' }}>
        <div style={{ padding: '22px 20px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#7c5cff', fontWeight: 800, fontSize: '1.2rem' }}>Automorai</span>
          <button className="amr-sidebar-close" onClick={() => setSidebarOpen(false)} style={{
            display: 'none', background: 'transparent', border: 'none', color: '#8b90a3', fontSize: '1.3rem', cursor: 'pointer',
          }}>✕</button>
        </div>
        <div style={{ flex: '1 0 auto', padding: '0 12px' }}>
          {navTabs.map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSidebarOpen(false); }} style={{
              display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left',
              padding: '10px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', marginBottom: '2px',
              fontWeight: 600, fontSize: '0.88rem',
              background: activeTab === tab.key ? '#7c5cff22' : 'transparent',
              color: activeTab === tab.key ? '#7c5cff' : '#8b90a3', transition: 'all 0.15s',
            }}>
              <span>{tab.icon}</span><span>{tab.label}</span>
            </button>
          ))}
        </div>
        <div style={{ padding: '16px 20px', borderTop: '1px solid #1e2130' }}>
          <div style={{ color: '#8b90a3', fontSize: '0.76rem', marginBottom: '10px', wordBreak: 'break-all' }}>{user.email}</div>
          <button onClick={logout} style={{ width: '100%', padding: '8px', background: 'transparent',
            color: '#8b90a3', border: '1px solid #262a38', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      <div className={`amr-sidebar-overlay${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* ── Main content ── */}
      <div style={{ flex: 1, minWidth: 0, height: '100vh', overflowY: 'auto' }}>
        <div className="amr-mobile-topbar" style={{
          alignItems: 'center', gap: '14px', padding: '14px 18px', background: '#0d0e14',
          borderBottom: '1px solid #1e2130', position: 'sticky', top: 0, zIndex: 100,
        }}>
          <button onClick={() => setSidebarOpen(true)} style={{
            background: 'transparent', border: 'none', color: 'white', fontSize: '1.4rem', cursor: 'pointer', padding: 0,
          }}>☰</button>
          <span style={{ color: '#7c5cff', fontWeight: 800, fontSize: '1.1rem' }}>Automorai</span>
        </div>

      {/* ════════ HOME TAB ════════ */}
      {activeTab === 'home' && (
        <div style={{ padding: '40px 32px', maxWidth: '1000px', margin: '0 auto' }}>
          <h1 style={{ margin: '0 0 6px', fontSize: '1.6rem' }}>Welcome to Automorai</h1>
          <p style={{ color: '#8b90a3', margin: '0 0 28px' }}>Hello, {user.email}!</p>

          {status && (
            <div style={{ background: '#181b26', border: '1px solid #7c5cff', borderRadius: '8px',
              padding: '12px', marginBottom: '20px', fontSize: '0.9rem', color: '#c8ff5c' }}>{status}</div>
          )}

          <div onClick={() => setActiveTab('website')} style={{
            background: 'linear-gradient(135deg,#7c5cff,#5b3ff0)', borderRadius: '16px', padding: '28px',
            marginBottom: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontSize: '1.7rem', marginBottom: '8px' }}>🚀</div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'white', marginBottom: '6px' }}>
                {websiteResult ? 'View & Edit Your Website' : 'Build Your Website'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.88rem' }}>
                {websiteResult ? 'Manage slider, products, menu — all from here.' : 'Create a beautiful website with AI in minutes, for free.'}
              </div>
            </div>
            <button onClick={e => { e.stopPropagation(); setActiveTab('website'); }} style={{
              padding: '12px 24px', background: 'white', color: '#5b3ff0', border: 'none', borderRadius: '8px',
              fontWeight: 800, fontSize: '0.92rem', cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              {websiteResult ? 'View →' : 'Get Started →'}
            </button>
          </div>

          {mySites.length > 1 && (
            <div style={{ background: '#0e1018', border: '1px solid #7c5cff44', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: '0.9rem', color: '#7c5cff' }}>
                {websiteResult ? `You have ${mySites.length} websites — switch between them:` : `You have ${mySites.length} websites — which one do you want to manage?`}
              </p>
              {mySites.map(s => {
                const isActive = s.business_slug === currentSiteId;
                return (
                  <div key={s.business_slug} onClick={() => {
                    setCurrentSiteId(s.business_slug);
                    try { localStorage.setItem('automorai_site_id', s.business_slug); } catch {}
                    setWebsiteResult({ url: s.website_url, business_name: s.business_name, site_id: s.business_slug });
                  }} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
                    width: '100%', textAlign: 'left', padding: '10px 14px', marginBottom: '8px',
                    background: isActive ? '#7c5cff22' : '#181b26', color: 'white',
                    border: isActive ? '1px solid #7c5cff' : '1px solid #262a38', borderRadius: '8px',
                    cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
                  }}>
                    <span>{isActive ? '✓ ' : ''}{s.business_name}</span>
                    <a href={s.website_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                      style={{ color: '#7c5cff', fontWeight: 400, fontSize: '0.8rem', whiteSpace: 'nowrap', textDecoration: 'underline' }}>
                      Open ↗
                    </a>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <TaskCard icon="📘" title="Connect Facebook Page" done={!!connectedPage}
              desc={connectedPage ? `${connectedPage} is connected.` : 'Connect your Facebook Page to auto-reply to comments and Messenger.'}
              action={connectedPage ? undefined : { label: 'Connect', onClick: handleFacebookConnect }} />
            <TaskCard icon="💬" title="Connect WhatsApp Business"
              desc="Automatically chat with customers and show products on WhatsApp."
              action={{ label: 'Connect', onClick: handleWhatsAppConnect }} />
            <TaskCard icon="📋" title="Connect Tender Automation"
              desc="Enable automatic tender-related notifications."
              action={{ label: 'Connect', onClick: handleTenderConnect }} />
            <TaskCard icon="📊" title="Pixel and Analytics Setup"
              desc="Track visitor behavior with Facebook Pixel and Google Analytics."
              action={{ label: 'Setup', onClick: handlePixelGAConnect }} />
          </div>

          {waPageId && (
            <div style={{ background: '#0e1018', border: '1px solid #7c5cff44', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '0.9rem', color: '#7c5cff' }}>🌐 Your Website Widget Code</p>
              <p style={{ margin: '0 0 10px', fontSize: '0.8rem', color: '#8b90a3' }}>Paste this code into your website</p>
              <pre style={{ background: '#06070a', border: '1px solid #262a38', borderRadius: '8px', padding: '12px',
                fontSize: '0.72rem', color: '#c8ff5c', overflowX: 'auto', margin: '0 0 10px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {`<script\n  src="https://automorai.com/automorai-widget.js"\n  data-page-id="${waPageId}"\n  data-business="Your Business Name"\n  data-color="#7c5cff">\n</script>`}
              </pre>
              <button onClick={() => { navigator.clipboard.writeText(`<script\n  src="https://automorai.com/automorai-widget.js"\n  data-page-id="${waPageId}"\n  data-business="Your Business Name"\n  data-color="#7c5cff">\n</script>`); setWidgetCopied(true); setTimeout(() => setWidgetCopied(false), 2000); }}
                style={{ width: '100%', padding: '10px', background: widgetCopied ? '#c8ff5c' : '#7c5cff',
                  color: widgetCopied ? '#06070a' : 'white', border: 'none', borderRadius: '8px',
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
          <div style={{ width: '320px', minWidth: '320px', borderRight: '1px solid #262a38', overflowY: 'auto', background: '#0e1018' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #262a38', fontWeight: 700, fontSize: '1rem', color: '#7c5cff' }}>💬 Unified Inbox</div>
            {inboxLoading && <div style={{ padding: '24px', color: '#8b90a3', textAlign: 'center' }}>Loading conversations...</div>}
            {inboxError && <div style={{ padding: '16px', color: '#ff5c5c', fontSize: '0.9rem' }}>{inboxError}</div>}
            {!inboxLoading && !inboxError && conversations.length === 0 && (
              <div style={{ padding: '24px', color: '#8b90a3', textAlign: 'center', fontSize: '0.9rem' }}>No conversations yet.<br />Connect Facebook or WhatsApp to start.</div>
            )}
            {conversations.map(conv => (
              <div key={conv.id} onClick={() => { setSelectedConversation(conv); setReplyText(''); setReplyError(''); }} style={{ padding: '14px 16px',
                borderBottom: '1px solid #1a1d27', cursor: 'pointer',
                background: selectedConversation?.id === conv.id ? '#181b26' : 'transparent', transition: 'background 0.15s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{conv.name}</span>
                  <span style={{ color: '#8b90a3', fontSize: '0.75rem' }}>{formatTime(conv.last_time)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <PlatformBadge platform={conv.platform} />
                  <span style={{ color: '#8b90a3', fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{conv.last_message}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {!selectedConversation ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b90a3', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '2rem' }}>💬</span>
                <span>Select a conversation to view messages</span>
              </div>
            ) : (
              <>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #262a38', background: '#12141c', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{selectedConversation.name}</div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                      <PlatformBadge platform={selectedConversation.platform} />
                      <span style={{ color: '#8b90a3', fontSize: '0.78rem' }}>{selectedConversation.sender_id}</span>
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
                            background: isUser ? '#1e2130' : '#7c5cff', color: 'white', fontSize: '0.9rem', lineHeight: '1.5' }}>
                            <div>{msg.message}</div>
                            <div style={{ fontSize: '0.72rem', color: isUser ? '#8b90a3' : 'rgba(255,255,255,0.6)', marginTop: '4px', textAlign: 'right' }}>{formatTime(msg.timestamp)}</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
                {replyError && (
                  <div style={{ padding: '8px 20px', background: '#1f0e0e', color: '#ff5c5c', fontSize: '0.8rem' }}>❌ {replyError}</div>
                )}
                <div style={{ padding: '14px 20px', borderTop: '1px solid #262a38', background: '#12141c', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input placeholder="Type your reply..." value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !replySending) handleSendReply(); }}
                    disabled={replySending}
                    style={{ flex: 1, padding: '10px 14px', background: '#1e2130', border: '1px solid #262a38', borderRadius: '10px', color: 'white', fontSize: '0.9rem', outline: 'none' }} />
                  <button onClick={handleSendReply} disabled={replySending || !replyText.trim()}
                    style={{ padding: '10px 18px', background: replySending || !replyText.trim() ? '#7c5cff44' : '#7c5cff',
                      color: replySending || !replyText.trim() ? '#7c5cff' : 'white', border: 'none', borderRadius: '10px',
                      cursor: replySending || !replyText.trim() ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                    {replySending ? '...' : 'Send'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ════════ WEBSITE BUILDER TAB ════════ */}
      {activeTab === 'website' && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 16px' }}>
          <div style={{ width: '100%', maxWidth: '580px' }}>
            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ color: '#7c5cff', margin: '0 0 6px', fontSize: '1.4rem' }}>🌐 Website Builder</h2>
              <p style={{ color: '#8b90a3', margin: 0, fontSize: '0.9rem' }}>AI will build a beautiful website for you.</p>
            </div>

            {websiteResult && (
              <div style={{ background: '#0d1f12', border: '1px solid #c8ff5c', borderRadius: '14px', padding: '24px', marginBottom: '24px' }}>
                <p style={{ color: '#c8ff5c', fontWeight: 700, margin: '0 0 4px', fontSize: '1rem' }}>✅ Website created successfully!</p>
                <p style={{ color: '#8b90a3', margin: '0 0 16px', fontSize: '0.85rem' }}>{websiteResult.business_name} 's website is now live.</p>
                <a href={websiteResult.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', color: '#7c5cff', fontWeight: 600, fontSize: '0.95rem', marginBottom: '12px', wordBreak: 'break-all' }}>
                  {websiteResult.url}
                </a>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <button onClick={() => { navigator.clipboard.writeText(websiteResult.url); setWebsiteUrlCopied(true); setTimeout(() => setWebsiteUrlCopied(false), 2000); }}
                    style={{ flex: 1, padding: '10px', background: websiteUrlCopied ? '#c8ff5c' : '#7c5cff',
                      color: websiteUrlCopied ? '#06070a' : 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem', transition: 'all 0.2s' }}>
                    {websiteUrlCopied ? '✅ Copied!' : '📋 Copy URL'}
                  </button>
                  <a href={websiteResult.url} target="_blank" rel="noopener noreferrer"
                    style={{ flex: 1, padding: '10px', background: '#1e2130', color: 'white', border: '1px solid #262a38',
                      borderRadius: '8px', fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    🔗 View Website
                  </a>
                </div>
                <button onClick={() => { setActiveTab('products'); }}
                  style={{ width: '100%', padding: '10px', background: '#7c5cff22', color: '#7c5cff', border: '1px solid #7c5cff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700 }}>
                  📦 Add Products
                </button>
                <button onClick={() => setShowSettings(s => !s)}
                  style={{ width: '100%', padding: '10px', marginTop: '10px', background: 'transparent', color: '#8b90a3', border: '1px solid #262a38', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700 }}>
                  ⚙️ Slider and Footer Settings {showSettings ? '▲' : '▼'}
                </button>
                <button onClick={handleUpdateWebsite} disabled={websiteUpdating}
                  style={{ width: '100%', padding: '10px', marginTop: '10px', background: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e', borderRadius: '8px', cursor: websiteUpdating ? 'default' : 'pointer', fontSize: '0.88rem', fontWeight: 700 }}>
                  {websiteUpdating ? 'Updating…' : '⬆️ Update to Latest Design'}
                </button>
                {websiteUpdateMsg && (
                  <p style={{ fontSize: '0.8rem', color: websiteUpdateMsg.startsWith('Updated') ? '#22c55e' : '#ff6b6b', marginTop: '6px', textAlign: 'center' }}>{websiteUpdateMsg}</p>
                )}
                <button onClick={() => {
                  if (!confirm('Build a new website? This switches the dashboard to a new site (your current site and its data stay as they are, you just won’t be managing it from here anymore).')) return;
                  try { localStorage.removeItem('automorai_site_id'); } catch {}
                  setCurrentSiteId('');
                  setWebsiteResult(null);
                  setShowSettings(false);
                }}
                  style={{ width: '100%', padding: '10px', marginTop: '10px', background: 'transparent', color: '#8b90a3', border: '1px dashed #262a38', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                  + Build a new website
                </button>

                {showSettings && (
                  <div style={{ marginTop: '14px', background: '#0e0f16', border: '1px solid #262a38', borderRadius: '12px', padding: '20px' }}>
                    {settingsLoading && <p style={{ color: '#8b90a3', fontSize: '0.85rem', textAlign: 'center' }}>Loading...</p>}
                    {!settingsLoading && (
                      <>
                        <p style={{ color: '#8b90a3', fontSize: '0.8rem', margin: '0 0 16px' }}>Change the homepage slider (3 slides) and footer text here — changes appear on the website immediately after saving, no rebuild needed.</p>

                        <div style={{ marginBottom: '18px', paddingBottom: '18px', borderBottom: '1px solid #1e2130' }}>
                          <p style={{ color: '#c8ff5c', fontWeight: 700, fontSize: '0.85rem', margin: '0 0 10px' }}>Logo</p>
                          <FormField label="Logo Image">
                            {websiteSettings.logo_img && (
                              <img src={websiteSettings.logo_img} alt="" style={{ height: '48px', objectFit: 'contain', marginBottom: '8px', background: '#181b26', borderRadius: '6px', padding: '6px' }} />
                            )}
                            <input type="file" accept="image/*"
                              onChange={e => handleSettingsImageUpload('logo_img', e.target.files?.[0] || null)}
                              style={{ ...inputStyle, padding: '8px' }} />
                            {settingsUploading === 'logo_img' && <p style={{ color: '#8b90a3', fontSize: '0.78rem', margin: '4px 0 0' }}>Uploading...</p>}
                            <p style={{ color: '#8b90a3', fontSize: '0.75rem', margin: '6px 0 0' }}>If no logo is set, the business name (text) will be shown instead.</p>
                          </FormField>
                        </div>

                        {[1, 2, 3].map(n => {
                          const imgField = `slide${n}_img` as keyof WebsiteSettings;
                          const tagField = `slide${n}_tag` as keyof WebsiteSettings;
                          const titleField = `slide${n}_title` as keyof WebsiteSettings;
                          const descField = `slide${n}_desc` as keyof WebsiteSettings;
                          return (
                            <div key={n} style={{ marginBottom: '18px', paddingBottom: '18px', borderBottom: '1px solid #1e2130' }}>
                              <p style={{ color: '#c8ff5c', fontWeight: 700, fontSize: '0.85rem', margin: '0 0 10px' }}>Slide {n}</p>
                              <FormField label="Image">
                                {String(websiteSettings[imgField] || '') && (
                                  <img src={String(websiteSettings[imgField] || '')} alt="" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} />
                                )}
                                <input type="file" accept="image/*"
                                  onChange={e => handleSettingsImageUpload(imgField, e.target.files?.[0] || null)}
                                  style={{ ...inputStyle, padding: '8px' }} />
                                {settingsUploading === imgField && <p style={{ color: '#8b90a3', fontSize: '0.78rem', margin: '4px 0 0' }}>Uploading...</p>}
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
                        <div style={{ marginBottom: '18px', paddingBottom: '18px', borderBottom: '1px solid #1e2130' }}>
                          <p style={{ color: '#c8ff5c', fontWeight: 700, fontSize: '0.85rem', margin: '0 0 6px' }}>Payment Methods</p>
                          <p style={{ color: '#8b90a3', fontSize: '0.78rem', margin: '0 0 12px' }}>
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
                        <div style={{ marginBottom: '18px', paddingBottom: '18px', borderBottom: '1px solid #1e2130' }}>
                          <p style={{ color: '#c8ff5c', fontWeight: 700, fontSize: '0.85rem', margin: '0 0 6px' }}>Delivery Charge</p>
                          <p style={{ color: '#8b90a3', fontSize: '0.78rem', margin: '0 0 12px' }}>
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

                        {/* ── Navigation Menu ── */}
                        <div style={{ marginBottom: '18px', paddingBottom: '18px', borderBottom: '1px solid #1e2130' }}>
                          <p style={{ color: '#c8ff5c', fontWeight: 700, fontSize: '0.85rem', margin: '0 0 6px' }}>Navigation Menu</p>
                          <p style={{ color: '#8b90a3', fontSize: '0.78rem', margin: '0 0 12px' }}>Top menu items — you can also add sub-items (e.g. Men → Shirt, Pant).</p>
                          {websiteSettings.nav_menu.map((item, idx) => (
                            <div key={idx} style={{ background: '#181b26', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
                              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                <input type="text" placeholder="Menu label" value={item.label} onChange={e => updateNavItem(idx, 'label', e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                                <input type="text" placeholder="Link (optional)" value={item.link} onChange={e => updateNavItem(idx, 'link', e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                                <button onClick={() => removeNavItem(idx)} style={{ padding: '0 10px', background: '#1f0e0e', color: '#ff5c5c', border: '1px solid #ff5c5c44', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem' }}>Remove</button>
                              </div>
                              {(item.children || []).map((sub, subIdx) => (
                                <div key={subIdx} style={{ display: 'flex', gap: '8px', marginBottom: '6px', paddingLeft: '16px' }}>
                                  <input type="text" placeholder="Sub-item label" value={sub.label} onChange={e => updateSubItem(idx, subIdx, 'label', e.target.value)} style={{ ...inputStyle, flex: 1, padding: '7px 10px' }} />
                                  <input type="text" placeholder="Link (optional)" value={sub.link} onChange={e => updateSubItem(idx, subIdx, 'link', e.target.value)} style={{ ...inputStyle, flex: 1, padding: '7px 10px' }} />
                                  <button onClick={() => removeSubItem(idx, subIdx)} style={{ padding: '0 8px', background: 'transparent', color: '#ff5c5c', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>
                                </div>
                              ))}
                              <button onClick={() => addSubItem(idx)} style={{ marginLeft: '16px', padding: '4px 10px', background: 'transparent', color: '#7c5cff', border: '1px dashed #7c5cff44', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}>+ Sub-item</button>
                            </div>
                          ))}
                          <button onClick={addNavItem} style={{ padding: '6px 14px', background: '#7c5cff22', color: '#7c5cff', border: '1px solid #7c5cff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>+ Add menu item</button>
                        </div>

                        {/* ── Testimonials ── */}
                        <div style={{ marginBottom: '18px', paddingBottom: '18px', borderBottom: '1px solid #1e2130' }}>
                          <p style={{ color: '#c8ff5c', fontWeight: 700, fontSize: '0.85rem', margin: '0 0 10px' }}>Testimonials</p>
                          <Toggle label="Show this section" desc="Turn the testimonials section on the site on/off" value={getTestimonialBlock().enabled} onChange={v => setBlock({ ...getTestimonialBlock(), enabled: v })} />
                          <div style={{ height: '12px' }} />
                          <FormField label="Section Title">
                            <input type="text" placeholder="What Our Customers Say" value={getTestimonialBlock().title} onChange={e => setBlock({ ...getTestimonialBlock(), title: e.target.value })} style={inputStyle} />
                          </FormField>
                          {getTestimonialBlock().items.map((it, idx) => (
                            <div key={idx} style={{ background: '#181b26', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
                              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                <input type="text" placeholder="Customer's name" value={it.name} onChange={e => updateTestimonialItem(idx, 'name', e.target.value)} style={{ ...inputStyle, flex: 2 }} />
                                <input type="number" placeholder="Rating" min={1} max={5} value={it.rating} onChange={e => updateTestimonialItem(idx, 'rating', e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                              </div>
                              <textarea placeholder="Write the testimonial" value={it.text} onChange={e => updateTestimonialItem(idx, 'text', e.target.value)} style={{ ...inputStyle, height: '50px', marginBottom: '8px' }} />
                              <button onClick={() => removeTestimonialItem(idx)} style={{ padding: '4px 10px', background: '#1f0e0e', color: '#ff5c5c', border: '1px solid #ff5c5c44', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}>Remove</button>
                            </div>
                          ))}
                          <button onClick={addTestimonialItem} style={{ padding: '6px 14px', background: '#7c5cff22', color: '#7c5cff', border: '1px solid #7c5cff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>+ Add testimonial</button>
                        </div>

                        {/* ── About / Our Story ── */}
                        <div style={{ marginBottom: '18px', paddingBottom: '18px', borderBottom: '1px solid #1e2130' }}>
                          <p style={{ color: '#c8ff5c', fontWeight: 700, fontSize: '0.85rem', margin: '0 0 10px' }}>About</p>
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
                          style={btnStyle(settingsSaved ? '#c8ff5c' : '#7c5cff', settingsSaved ? '#06070a' : 'white')}>
                          {settingsSaving ? '⏳ Saving...' : settingsSaved ? '✅ Saved!' : '💾 Save'}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {!websiteResult && (
              <div style={{ background: '#12141c', border: '1px solid #262a38', borderRadius: '16px', padding: '28px' }}>
                {websiteError && (
                  <div style={{ background: '#1f0e0e', border: '1px solid #ff5c5c', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#ff5c5c', fontSize: '0.88rem' }}>❌ {websiteError}</div>
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
                    style={{ width: '100%', height: '42px', padding: '4px', background: '#1e2130', border: '1px solid #262a38', borderRadius: '8px', cursor: 'pointer' }} />
                </FormField>

                <button onClick={handleBuildWebsite} disabled={websiteBuilding} style={btnStyle('#7c5cff', 'white')}>
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
              <h2 style={{ color: '#7c5cff', margin: 0 }}>📦 Product Management</h2>
              <p style={{ color: '#8b90a3', margin: '4px 0 0', fontSize: '0.85rem' }}>Website: {currentSiteId || 'Not created yet'}</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {products.some(isSampleProduct) && (
                <button onClick={handleDeleteAllSamples} style={{ padding: '10px 18px', background: '#1f0e0e', color: '#ff5c5c',
                  border: '1px solid #ff5c5c44', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem' }}>
                  🗑️ Remove all sample products
                </button>
              )}
              <button onClick={() => { setEditingProductId(null); setProductForm({ business_slug: currentSiteId, title: '', description: '', category: '', price: 0, original_price: 0, images: [], sizes: [], colors: [], stock: 10 }); setShowAddProduct(true); }} style={{ ...btnStyle('#7c5cff', 'white'), width: 'auto', padding: '10px 20px', margin: 0 }}>
                + Add Product
              </button>
            </div>
          </div>

          {/* Add/Edit Product Modal */}
          {showAddProduct && (
            <div style={{ fixed: 'inset-0', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99, padding: '20px' }}>
              <div style={{ background: '#12141c', border: '1px solid #262a38', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto' }}>
                <h3 style={{ margin: '0 0 16px', color: '#7c5cff' }}>{editingProductId ? 'Edit Product' : 'Add New Product'}</h3>
                {productError && <div style={{ color: '#ff5c5c', marginBottom: '12px', fontSize: '0.85rem' }}>{productError}</div>}
                
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
                      <div key={i} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #262a38' }}>
                        <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button onClick={() => setProductForm(p => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))}
                          style={{ position: 'absolute', top: 2, right: 2, background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '16px', height: '16px', cursor: 'pointer', fontSize: '10px' }}>✕</button>
                      </div>
                    ))}
                    <button onClick={() => fileInputRef.current?.click()} disabled={imageUploading}
                      style={{ width: '60px', height: '60px', borderRadius: '6px', border: '1px dashed #7c5cff', background: '#181b26', color: '#7c5cff', cursor: 'pointer', fontSize: '1.2rem' }}>
                      {imageUploading ? '⏳' : '+'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input type="text" value={imageInput} onChange={e => setImageInput(e.target.value)} placeholder="Or enter image URL" style={inputStyle} />
                    <button onClick={() => { if(imageInput){ setProductForm(p => ({ ...p, images: [...p.images, imageInput] })); setImageInput(''); } }} style={{ padding: '0 12px', background: '#262a38', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Add</button>
                  </div>
                </FormField>

                {/* Sizes & Colors */}
                <FormField label="Sizes">
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    {commonSizes.map(s => (
                      <button key={s} onClick={() => setProductForm(p => ({ ...p, sizes: p.sizes.includes(s) ? p.sizes.filter(x => x !== s) : [...p.sizes, s] }))}
                        style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid #262a38', background: productForm.sizes.includes(s) ? '#7c5cff' : '#1e2130', color: 'white', cursor: 'pointer' }}>{s}</button>
                    ))}
                  </div>
                </FormField>

                <FormField label="Colors (optional)">
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    {productForm.colors.map(c => (
                      <span key={c} style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', background: '#7c5cff', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                      style={{ padding: '0 12px', background: '#262a38', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Add</button>
                  </div>
                </FormField>

                <FormField label="Stock Quantity">
                  <input type="number" value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })} style={inputStyle} />
                </FormField>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button onClick={handleSaveProduct} disabled={productSaving} style={{ ...btnStyle('#7c5cff', 'white'), flex: 1, margin: 0 }}>
                    {productSaving ? 'Saving...' : (editingProductId ? 'Update Product' : 'Save Product')}
                  </button>
                  <button onClick={() => { setShowAddProduct(false); setEditingProductId(null); }} style={{ ...btnStyle('#262a38', '#8b90a3'), flex: 1, margin: 0 }}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Product Grid */}
          {productsLoading ? <div style={{ color: '#8b90a3' }}>Products loading...</div> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              {products.map(p => (
                <div key={p.product_id} style={{ background: '#12141c', border: '1px solid #262a38', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ height: '160px', background: '#181b26', position: 'relative' }}>
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
                    <div style={{ color: '#7c5cff', fontWeight: 800 }}>৳{p.price} {p.original_price ? <span style={{ color: '#8b90a3', textDecoration: 'line-through', fontSize: '0.8rem' }}>৳{p.original_price}</span> : null}</div>
                    <div style={{ fontSize: '0.75rem', color: '#8b90a3', marginTop: '6px' }}>Stock: {p.stock} pcs</div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button onClick={() => handleEditProduct(p)} style={{ flex: 1, padding: '6px', background: '#7c5cff22', color: '#7c5cff', border: '1px solid #7c5cff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Edit</button>
                      <button onClick={() => p.product_id && handleDeleteProduct(p.product_id)} style={{ flex: 1, padding: '6px', background: '#1f0e0e', color: '#ff5c5c', border: '1px solid #ff5c5c44', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════ ORDERS TAB ════════ */}
      {activeTab === 'orders' && (
        <div style={{ padding: '32px 24px', maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{ color: '#7c5cff', margin: '0 0 16px' }}>🛍️ Customer Orders</h2>
          {ordersLoading ? <div style={{ color: '#8b90a3' }}>Loading orders...</div> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#12141c', borderBottom: '1px solid #262a38', color: '#8b90a3' }}>
                    <th style={{ padding: '12px' }}>Product</th>
                    <th style={{ padding: '12px' }}>Customer</th>
                    <th style={{ padding: '12px' }}>Payment</th>
                    <th style={{ padding: '12px' }}>Total</th>
                    <th style={{ padding: '12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} style={{ borderBottom: '1px solid #1a1d27' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600 }}>{o.product_title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#8b90a3' }}>{o.selected_size} {o.selected_color} (x{o.quantity})</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div>{o.customer_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#8b90a3' }}>{o.customer_phone}</div>
                        {o.customer_email && <div style={{ fontSize: '0.72rem', color: '#8b90a3' }}>{o.customer_email}</div>}
                        <div style={{ fontSize: '0.7rem', color: '#666' }}>{o.customer_address}</div>
                        <div style={{ fontSize: '0.7rem', color: '#8b90a3' }}>{o.delivery_location === 'outside' ? '🚴 Outside Dhaka' : '🚴 Dhaka'}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div>{paymentLabels[o.payment_method] || o.payment_method}</div>
                        {o.transaction_id && <div style={{ fontSize: '0.72rem', color: '#c8ff5c' }}>TrxID: {o.transaction_id}</div>}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 700, color: '#7c5cff' }}>
                        ৳{o.product_price * o.quantity + (o.delivery_charge || 0)}
                        <div style={{ fontSize: '0.68rem', color: '#8b90a3', fontWeight: 400 }}>incl. ৳{o.delivery_charge || 0} delivery</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <select value={o.status} onChange={e => handleUpdateOrderStatus(o.id, e.target.value)}
                          style={{ background: '#1e2130', color: statusColors[o.status] || 'white', border: '1px solid #262a38', borderRadius: '6px', padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer' }}>
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
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
    </div>
  );
};

export default Dashboard;
