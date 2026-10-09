import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const FACEBOOK_APP_ID = '1458889719428985';
const REDIRECT_URI = 'https://automorai.com/dashboard';
const WEBHOOK_URL = 'https://n8n2.kingpurefood.com/webhook/automorai/new-customer';
const CONFIG_ID = '1766373457898596';
const INBOX_API = 'https://n8n2.kingpurefood.com/webhook/automorai/inbox';
const WEBSITE_BUILDER_API = 'https://n8n2.kingpurefood.com/webhook/automorai/build-website';
const PRODUCTS_API = 'https://n8n2.kingpurefood.com/webhook/automorai/products';
const SUPABASE_URL = 'https://wwettpkioulkofohfdxl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ul461fEnojpr4GxdJv-P8Q_hySiflQt';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Message { role: string; message: string; timestamp: string; }
interface Conversation {
  id: string; sender_id: string; name: string;
  platform: 'whatsapp' | 'messenger' | 'facebook' | 'website' | string;
  page_id: string; messages: Message[]; last_message: string; last_time: string;
}
interface WebsiteForm {
  business_name: string; business_type: string; phone: string;
  address: string; color: string; services: string; description: string;
  whatsapp: string; bkash: string; nagad: string; website_type: 'ecommerce' | 'service';
}
interface Product {
  id?: string; site_id: string; title: string; description: string;
  price: number; original_price?: number; images: string[]; sizes: string[]; colors: string[];
  stock: number; is_active: boolean;
}
interface Order {
  id: string; site_id: string; product_title: string; product_price: number;
  selected_size: string; selected_color: string; quantity: number;
  customer_name: string; customer_phone: string; customer_address: string;
  payment_method: string; transaction_id: string; status: string;
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

const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', color: '#aab0c0', fontWeight: 600 }}>{label}</label>
    {children}
  </div>
);

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

  // Website Builder state
  const [websiteForm, setWebsiteForm] = useState<WebsiteForm>({
    business_name: '', business_type: 'retail', phone: '', address: '',
    color: '#7c5cff', services: '', description: '',
    whatsapp: '', bkash: '', nagad: '', website_type: 'ecommerce',
  });
  const [websiteBuilding,  setWebsiteBuilding]  = useState(false);
  const [websiteResult,    setWebsiteResult]    = useState<{ url: string; business_name: string; site_id?: string } | null>(null);
  const [websiteError,     setWebsiteError]     = useState('');
  const [websiteUrlCopied, setWebsiteUrlCopied] = useState(false);

  // Current site_id (from websiteResult or localStorage)
  const [currentSiteId, setCurrentSiteId] = useState<string>(() => {
    try { return localStorage.getItem('automorai_site_id') || ''; } catch { return ''; }
  });

  // Products state
  const [products,        setProducts]        = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [showAddProduct,  setShowAddProduct]  = useState(false);
  const [productForm,     setProductForm]     = useState<Omit<Product, 'id' | 'is_active'>>({
    site_id: currentSiteId, title: '', description: '', price: 0, original_price: 0,
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
    if (activeTab !== 'orders' || !currentSiteId) return;
    loadOrders();
  }, [activeTab, currentSiteId]);

  if (!user) return <p style={{ color: 'white' }}>Please login</p>;

  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/products?site_id=eq.${currentSiteId}&order=created_at.desc`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
      });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch { setProducts([]); }
    setProductsLoading(false);
  };

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?site_id=eq.${currentSiteId}&order=created_at.desc`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
      });
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch { setOrders([]); }
    setOrdersLoading(false);
  };

  const handleSaveProduct = async () => {
    if (!productForm.title.trim()) { setProductError('Product title দিন'); return; }
    if (!productForm.price) { setProductError('Price দিন'); return; }
    if (!currentSiteId) { setProductError('আগে Website তৈরি করুন'); return; }
    setProductSaving(true); setProductError('');
    try {
      const res = await fetch(`${PRODUCTS_API}/add`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...productForm, site_id: currentSiteId }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddProduct(false);
        setProductForm({ site_id: currentSiteId, title: '', description: '', price: 0, original_price: 0, images: [], sizes: [], colors: [], stock: 10 });
        setSizeInput(''); setColorInput(''); setImageInput('');
        loadProducts();
      } else { setProductError('Save করতে পারেনি। আবার চেষ্টা করুন।'); }
    } catch { setProductError('Connection error।'); }
    setProductSaving(false);
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

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('এই product টা delete করবেন?')) return;
    try {
      await fetch(`${PRODUCTS_API}/delete?id=${id}`, { method: 'DELETE' });
      loadProducts();
    } catch {}
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
        method: 'PATCH',
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ status }),
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
    if (!websiteForm.business_name.trim()) { setWebsiteError('Business name দিন'); return; }
    if (!websiteForm.phone.trim()) { setWebsiteError('Phone number দিন'); return; }
    setWebsiteBuilding(true); setWebsiteError(''); setWebsiteResult(null);
    try {
      const res = await fetch(WEBSITE_BUILDER_API, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...websiteForm, email: user.email, user_id: user.email }),
      });
      const data = await res.json();
      if (data.success && data.url) {
        setWebsiteResult({ url: data.url, business_name: data.business_name || websiteForm.business_name, site_id: data.site_id });
        if (data.site_id) {
          setCurrentSiteId(data.site_id);
          try { localStorage.setItem('automorai_site_id', data.site_id); } catch {}
          setProductForm(prev => ({ ...prev, site_id: data.site_id }));
        }
      } else { setWebsiteError('Website তৈরি করতে পারেনি। আবার চেষ্টা করুন।'); }
    } catch { setWebsiteError('Connection error। আবার চেষ্টা করুন।'); }
    setWebsiteBuilding(false);
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
  const paymentLabels: Record<string, string> = { cod: '🚚 Cash on Delivery', bkash: '📱 bKash', nagad: '💵 Nagad' };

  const businessTypes = [
    { value: 'retail', label: 'Retail / Shop' }, { value: 'restaurant', label: 'Restaurant / Food' },
    { value: 'fashion', label: 'Fashion / Clothing' }, { value: 'electronics', label: 'Electronics' },
    { value: 'pharmacy', label: 'Pharmacy / Health' }, { value: 'beauty', label: 'Beauty / Salon' },
    { value: 'education', label: 'Education / Coaching' }, { value: 'service', label: 'Service Business' },
    { value: 'other', label: 'Other' },
  ];

  const commonSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
  const commonColors = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Gray', 'Navy', 'Brown'];

  return (
    <div style={{ minHeight: '100vh', background: '#06070a', fontFamily: 'sans-serif', color: 'white' }}>

      {/* ── Top Nav ── */}
      <div style={{ background: '#12141c', borderBottom: '1px solid #262a38', padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}>
        <span style={{ color: '#7c5cff', fontWeight: 700, fontSize: '1.1rem' }}>Automorai</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {([
            { key: 'home', label: '🏠 Home' },
            { key: 'inbox', label: '💬 Inbox' },
            { key: 'website', label: '🌐 Website' },
            { key: 'products', label: '📦 Products' },
            { key: 'orders', label: '🛍️ Orders' },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.85rem',
              background: activeTab === tab.key ? '#7c5cff' : 'transparent',
              color: activeTab === tab.key ? 'white' : '#8b90a3', transition: 'all 0.2s',
            }}>{tab.label}</button>
          ))}
        </div>
        <span style={{ color: '#8b90a3', fontSize: '0.85rem' }}>{user.email}</span>
      </div>

      {/* ════════ HOME TAB ════════ */}
      {activeTab === 'home' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
          <div style={{ background: '#12141c', border: '1px solid #262a38', borderRadius: '16px',
            padding: '40px', width: '100%', maxWidth: '480px' }}>
            <h1 style={{ color: '#7c5cff', marginBottom: '8px' }}>Welcome to Automorai</h1>
            <p style={{ color: '#8b90a3', marginBottom: '24px' }}>Hello, {user.email}!</p>
            {status && (
              <div style={{ background: '#181b26', border: '1px solid #7c5cff', borderRadius: '8px',
                padding: '12px', marginBottom: '16px', fontSize: '0.9rem', color: '#c8ff5c' }}>{status}</div>
            )}
            {connectedPage ? (
              <div style={{ background: '#181b26', border: '1px solid #c8ff5c', borderRadius: '10px',
                padding: '14px', marginBottom: '16px', color: '#c8ff5c', fontWeight: 600 }}>
                ✅ {connectedPage} Connected
              </div>
            ) : (
              <button onClick={handleFacebookConnect} style={btnStyle('#7c5cff', 'white')}>Connect Facebook Page</button>
            )}
            <button onClick={handleWhatsAppConnect} style={btnStyle('#25D366', 'white')}>Connect WhatsApp Business</button>
            <button onClick={handleTenderConnect} style={btnStyle('#ffb84c', '#1a1200')}>Connect Tender Automation</button>
            {waPageId && (
              <div style={{ background: '#0e1018', border: '1px solid #7c5cff44', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '0.9rem', color: '#7c5cff' }}>🌐 Your Website Widget Code</p>
                <p style={{ margin: '0 0 10px', fontSize: '0.8rem', color: '#8b90a3' }}>এই code টা আপনার website এ paste করুন</p>
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
            <Toggle label="Comment Auto-Reply" desc="Auto-reply to Facebook comments" value={commentReply} onChange={v => handleToggleChange('comment', v)} />
            <div style={{ marginBottom: '12px' }} />
            <Toggle label="Messenger Auto-Reply" desc="Auto-reply to Messenger messages" value={messengerReply} onChange={v => handleToggleChange('messenger', v)} />
            <div style={{ height: '24px' }} />
            <button onClick={logout} style={{ width: '100%', padding: '14px', background: 'transparent',
              color: '#8b90a3', border: '1px solid #262a38', borderRadius: '10px', fontSize: '1rem', cursor: 'pointer' }}>
              Logout
            </button>
          </div>
        </div>
      )}

      {/* ════════ INBOX TAB ════════ */}
      {activeTab === 'inbox' && (
        <div style={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
          <div style={{ width: '320px', minWidth: '320px', borderRight: '1px solid #262a38', overflowY: 'auto', background: '#0e1018' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #262a38', fontWeight: 700, fontSize: '1rem', color: '#7c5cff' }}>💬 Unified Inbox</div>
            {inboxLoading && <div style={{ padding: '24px', color: '#8b90a3', textAlign: 'center' }}>Loading conversations...</div>}
            {inboxError && <div style={{ padding: '16px', color: '#ff5c5c', fontSize: '0.9rem' }}>{inboxError}</div>}
            {!inboxLoading && !inboxError && conversations.length === 0 && (
              <div style={{ padding: '24px', color: '#8b90a3', textAlign: 'center', fontSize: '0.9rem' }}>No conversations yet.<br />Connect Facebook or WhatsApp to start.</div>
            )}
            {conversations.map(conv => (
              <div key={conv.id} onClick={() => setSelectedConversation(conv)} style={{ padding: '14px 16px',
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
                <div style={{ padding: '14px 20px', borderTop: '1px solid #262a38', background: '#12141c', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input placeholder="Reply coming soon..." disabled style={{ flex: 1, padding: '10px 14px', background: '#1e2130', border: '1px solid #262a38', borderRadius: '10px', color: '#8b90a3', fontSize: '0.9rem', outline: 'none' }} />
                  <button disabled style={{ padding: '10px 18px', background: '#7c5cff44', color: '#7c5cff', border: 'none', borderRadius: '10px', cursor: 'not-allowed', fontWeight: 600 }}>Send</button>
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
              <p style={{ color: '#8b90a3', margin: 0, fontSize: '0.9rem' }}>AI আপনার জন্য একটি সুন্দর website তৈরি করে দেবে।</p>
            </div>

            {websiteResult && (
              <div style={{ background: '#0d1f12', border: '1px solid #c8ff5c', borderRadius: '14px', padding: '24px', marginBottom: '24px' }}>
                <p style={{ color: '#c8ff5c', fontWeight: 700, margin: '0 0 4px', fontSize: '1rem' }}>✅ Website তৈরি হয়ে গেছে!</p>
                <p style={{ color: '#8b90a3', margin: '0 0 16px', fontSize: '0.85rem' }}>{websiteResult.business_name} এর website live আছে।</p>
                <a href={websiteResult.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', color: '#7c5cff', fontWeight: 600, fontSize: '0.95rem', marginBottom: '12px', wordBreak: 'break-all' }}>
                  {websiteResult.url}
                </a>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <button onClick={() => { navigator.clipboard.writeText(websiteResult.url); setWebsiteUrlCopied(true); setTimeout(() => setWebsiteUrlCopied(false), 2000); }}
                    style={{ flex: 1, padding: '10px', background: websiteUrlCopied ? '#c8ff5c' : '#7c5cff',
                      color: websiteUrlCopied ? '#06070a' : 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem', transition: 'all 0.2s' }}>
                    {websiteUrlCopied ? '✅ Copied!' : '📋 URL Copy করুন'}
                  </button>
                  <a href={websiteResult.url} target="_blank" rel="noopener noreferrer"
                    style={{ flex: 1, padding: '10px', background: '#1e2130', color: 'white', border: '1px solid #262a38',
                      borderRadius: '8px', fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    🔗 Website দেখুন
                  </a>
                </div>
                <button onClick={() => { setActiveTab('products'); }}
                  style={{ width: '100%', padding: '10px', background: '#7c5cff22', color: '#7c5cff', border: '1px solid #7c5cff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700 }}>
                  📦 Products Add করুন
                </button>
              </div>
            )}

            {!websiteResult && (
              <div style={{ background: '#12141c', border: '1px solid #262a38', borderRadius: '16px', padding: '28px' }}>
                {websiteError && (
                  <div style={{ background: '#1f0e0e', border: '1px solid #ff5c5c', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#ff5c5c', fontSize: '0.88rem' }}>❌ {websiteError}</div>
                )}

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#aab0c0', fontWeight: 600 }}>Website Type *</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[{ v: 'ecommerce', l: '🛍️ E-commerce', d: 'Products বিক্রি' }, { v: 'service', l: '🏢 Service', d: 'Service দেওয়া' }].map(opt => (
                      <button key={opt.v} onClick={() => handleWebsiteFormChange('website_type', opt.v as any)}
                        style={{ flex: 1, padding: '12px', borderRadius: '10px', border: `2px solid ${websiteForm.website_type === opt.v ? '#7c5cff' : '#262a38'}`,
                          background: websiteForm.website_type === opt.v ? '#7c5cff22' : '#1e2130', color: websiteForm.website_type === opt.v ? '#7c5cff' : '#8b90a3',
                          cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s' }}>
                        <div>{opt.l}</div>
                        <div style={{ fontSize: '0.75rem', marginTop: '2px', opacity: 0.8 }}>{opt.d}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <FormField label="Business Name *">
                  <input type="text" placeholder="যেমন: Dhaka Fashion House" value={websiteForm.business_name}
                    onChange={e => handleWebsiteFormChange('business_name', e.target.value)} style={inputStyle} />
                </FormField>

                <FormField label="Business Type *">
                  <select value={websiteForm.business_type} onChange={e => handleWebsiteFormChange('business_type', e.target.value)}
                    style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                    {businessTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </FormField>

                <FormField label="Phone Number *">
                  <input type="text" placeholder="01XXXXXXXXX" value={websiteForm.phone}
                    onChange={e => handleWebsiteFormChange('phone', e.target.value)} style={inputStyle} />
                </FormField>

                <FormField label="WhatsApp Number">
                  <input type="text" placeholder="01XXXXXXXXX" value={websiteForm.whatsapp}
                    onChange={e => handleWebsiteFormChange('whatsapp', e.target.value)} style={inputStyle} />
                </FormField>

                <FormField label="bKash Number">
                  <input type="text" placeholder="01XXXXXXXXX" value={websiteForm.bkash}
                    onChange={e => handleWebsiteFormChange('bkash', e.target.value)} style={inputStyle} />
                </FormField>

                <FormField label="Nagad Number">
                  <input type="text" placeholder="01XXXXXXXXX" value={websiteForm.nagad}
                    onChange={e => handleWebsiteFormChange('nagad', e.target.value)} style={inputStyle} />
                </FormField>

                <FormField label="Address">
                  <input type="text" placeholder="যেমন: Mirpur, Dhaka" value={websiteForm.address}
                    onChange={e => handleWebsiteFormChange('address', e.target.value)} style={inputStyle} />
                </FormField>

                <FormField label="Products / Services List">
                  <textarea placeholder="কী কী বিক্রি বা সার্ভিস দেন লিখুন..." value={websiteForm.services}
                    onChange={e => handleWebsiteFormChange('services', e.target.value)} style={{ ...inputStyle, height: '80px' }} />
                </FormField>

                <FormField label="Business Description">
                  <textarea placeholder="ব্যবসা সম্পর্কে সংক্ষেপে লিখুন..." value={websiteForm.description}
                    onChange={e => handleWebsiteFormChange('description', e.target.value)} style={{ ...inputStyle, height: '80px' }} />
                </FormField>

                <button onClick={handleBuildWebsite} disabled={websiteBuilding} style={btnStyle('#7c5cff', 'white')}>
                  {websiteBuilding ? '⏳ Website তৈরি হচ্ছে... (৩০-৬০ সেকেণ্ড)' : '🚀 Website তৈরি করুন'}
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
              <p style={{ color: '#8b90a3', margin: '4px 0 0', fontSize: '0.85rem' }}>Site ID: {currentSiteId || 'Not connected'}</p>
            </div>
            <button onClick={() => setShowAddProduct(true)} style={{ ...btnStyle('#7c5cff', 'white'), width: 'auto', padding: '10px 20px', margin: 0 }}>
              + Add Product
            </button>
          </div>

          {/* Add Product Modal */}
          {showAddProduct && (
            <div style={{ fixed: 'inset-0', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99, padding: '20px' }}>
              <div style={{ background: '#12141c', border: '1px solid #262a38', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto' }}>
                <h3 style={{ margin: '0 0 16px', color: '#7c5cff' }}>Add New Product</h3>
                {productError && <div style={{ color: '#ff5c5c', marginBottom: '12px', fontSize: '0.85rem' }}>{productError}</div>}
                
                <FormField label="Title *">
                  <input type="text" value={productForm.title} onChange={e => setProductForm({ ...productForm, title: e.target.value })} style={inputStyle} placeholder="যেমন: Premium Cotton Shirt" />
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
                  <textarea value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} style={{ ...inputStyle, height: '70px' }} placeholder="পণ্যের বিবরণ..." />
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
                    <input type="text" value={imageInput} onChange={e => setImageInput(e.target.value)} placeholder="অথবা Image URL দিন" style={inputStyle} />
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

                <FormField label="Stock Quantity">
                  <input type="number" value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })} style={inputStyle} />
                </FormField>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button onClick={handleSaveProduct} disabled={productSaving} style={{ ...btnStyle('#7c5cff', 'white'), flex: 1, margin: 0 }}>
                    {productSaving ? 'Saving...' : 'Save Product'}
                  </button>
                  <button onClick={() => setShowAddProduct(false)} style={{ ...btnStyle('#262a38', '#8b90a3'), flex: 1, margin: 0 }}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Product Grid */}
          {productsLoading ? <div style={{ color: '#8b90a3' }}>Products loading...</div> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              {products.map(p => (
                <div key={p.id} style={{ background: '#12141c', border: '1px solid #262a38', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ height: '160px', background: '#181b26', position: 'relative' }}>
                    {p.images && p.images[0] ? (
                      <img src={p.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '2rem' }}>🛍️</div>}
                  </div>
                  <div style={{ padding: '14px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>{p.title}</div>
                    <div style={{ color: '#7c5cff', fontWeight: 800 }}>৳{p.price} {p.original_price ? <span style={{ color: '#8b90a3', textDecoration: 'line-through', fontSize: '0.8rem' }}>৳{p.original_price}</span> : null}</div>
                    <div style={{ fontSize: '0.75rem', color: '#8b90a3', marginTop: '6px' }}>Stock: {p.stock} pcs</div>
                    <button onClick={() => p.id && handleDeleteProduct(p.id)} style={{ width: '100%', marginTop: '10px', padding: '6px', background: '#1f0e0e', color: '#ff5c5c', border: '1px solid #ff5c5c44', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
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
                        <div style={{ fontSize: '0.7rem', color: '#666' }}>{o.customer_address}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div>{paymentLabels[o.payment_method] || o.payment_method}</div>
                        {o.transaction_id && <div style={{ fontSize: '0.72rem', color: '#c8ff5c' }}>TrxID: {o.transaction_id}</div>}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 700, color: '#7c5cff' }}>৳{o.product_price * o.quantity}</td>
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
  );
};

export default Dashboard;
