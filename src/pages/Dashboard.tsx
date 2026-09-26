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
  price: number; images: string[]; sizes: string[]; colors: string[];
  stock: number; is_active: boolean;
}
interface Order {
  id: string; site_id: string; product_title: string; product_price: number;
  selected_size: string; selected_color: string; quantity: number;
  customer_name: string; customer_phone: string; customer_address: string;
  payment_method: string; transaction_id: string; status: string;
  created_at: string;
}

// ─── Platform badge ───────────────────────────────────────────────────────────
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

  // Products state
  const [products,        setProducts]        = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [showAddProduct,  setShowAddProduct]  = useState(false);
  const [productForm,     setProductForm]     = useState<Omit<Product, 'id' | 'is_active'>>({
    site_id: '', title: '', description: '', price: 0,
    images: [], sizes: [], colors: [], stock: 0,
  });
  const [productSaving,   setProductSaving]   = useState(false);
  const [productError,    setProductError]    = useState('');
  const [sizeInput,       setSizeInput]       = useState('');
  const [colorInput,      setColorInput]      = useState('');
  const [imageInput,      setImageInput]      = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Orders state
  const [orders,        setOrders]        = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Current site_id (from websiteResult or localStorage)
  const [currentSiteId, setCurrentSiteId] = useState<string>(() => {
    try { return localStorage.getItem('automorai_site_id') || ''; } catch { return ''; }
  });

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

  // Load products when tab opens
  useEffect(() => {
    if (activeTab !== 'products' || !currentSiteId) return;
    loadProducts();
  }, [activeTab, currentSiteId]);

  // Load orders when tab opens
  useEffect(() => {
    if (activeTab !== 'orders' || !currentSiteId) return;
    loadOrders();
  }, [activeTab, currentSiteId]);

  if (!user) return <p style={{ color: 'white' }}>Please login</p>;

  // ── Load products ──
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

  // ── Load orders ──
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

  // ── Save product ──
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
        setProductForm({ site_id: currentSiteId, title: '', description: '', price: 0, images: [], sizes: [], colors: [], stock: 0 });
        setSizeInput(''); setColorInput(''); setImageInput('');
        loadProducts();
      } else { setProductError('Save করতে পারেনি। আবার চেষ্টা করুন।'); }
    } catch { setProductError('Connection error।'); }
    setProductSaving(false);
  };

  // ── Delete product ──
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('এই product টা delete করবেন?')) return;
    try {
      await fetch(`${PRODUCTS_API}/delete?id=${id}`, { method: 'DELETE' });
      loadProducts();
    } catch {}
  };

  // ── Update order status ──
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
  const statusLabels: Record<string, string> = {
    pending: 'Pending', confirmed: 'Confirmed', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled'
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

  // ─────────────────────────────────────────────────────────────────────────
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
                <button onClick={() => { setWebsiteResult(null); setWebsiteForm({ business_name: '', business_type: 'retail', phone: '', address: '', color: '#7c5cff', services: '', description: '', whatsapp: '', bkash: '', nagad: '', website_type: 'ecommerce' }); }}
                  style={{ width: '100%', marginTop: '8px', padding: '10px', background: 'transparent', color: '#8b90a3', border: '1px solid #262a38', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  নতুন Website তৈরি করুন
                </button>
              </div>
            )}

            {!websiteResult && (
              <div style={{ background: '#12141c', border: '1px solid #262a38', borderRadius: '16px', padding: '28px' }}>
                {websiteError && (
                  <div style={{ background: '#1f0e0e', border: '1px solid #ff5c5c', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#ff5c5c', fontSize: '0.88rem' }}>❌ {websiteError}</div>
                )}

                {/* Website Type Toggle */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#aab0c0', fontWeight: 600 }}>Website Type *</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[{ v: 'ecommerce', l: '🛍️ E-commerce', d: 'Products বিক্রি' }, { v: 'service', l: '🏢 Service', d: 'Service দেওয়া' }].map(opt => (
                      <button key={opt.v} onClick={() => handleWebsiteFormChange('website_type', opt.v)}
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
                  <input type="text" placeholder="01XXXXXXXXX (order notification পাবেন)" value={websiteForm.whatsapp}
                    onChange={e => handleWebsiteFormChange('whatsapp', e.target.value)} style={inputStyle} />
                </FormField>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <FormField label="bKash Number">
                    <input type="text" placeholder="01XXXXXXXXX" value={websiteForm.bkash}
                      onChange={e => handleWebsiteFormChange('bkash', e.target.value)} style={inputStyle} />
                  </FormField>
                  <FormField label="Nagad Number">
                    <input type="text" placeholder="01XXXXXXXXX" value={websiteForm.nagad}
                      onChange={e => handleWebsiteFormChange('nagad', e.target.value)} style={inputStyle} />
                  </FormField>
                </div>
                <FormField label="Address">
                  <input type="text" placeholder="যেমন: Mirpur, Dhaka" value={websiteForm.address}
                    onChange={e => handleWebsiteFormChange('address', e.target.value)} style={inputStyle} />
                </FormField>
                <FormField label="Products / Services">
                  <input type="text" placeholder="যেমন: Shirts, Pants, Saree, Kids Wear" value={websiteForm.services}
                    onChange={e => handleWebsiteFormChange('services', e.target.value)} style={inputStyle} />
                </FormField>
                <FormField label="Business Description">
                  <textarea placeholder="আপনার business সম্পর্কে কিছু লিখুন..." value={websiteForm.description}
                    onChange={e => handleWebsiteFormChange('description', e.target.value)} rows={3}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }} />
                </FormField>
                <FormField label="Brand Color">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input type="color" value={websiteForm.color} onChange={e => handleWebsiteFormChange('color', e.target.value)}
                      style={{ width: '48px', height: '40px', border: '1px solid #262a38', borderRadius: '8px', background: '#1e2130', cursor: 'pointer', padding: '2px' }} />
                    <span style={{ color: '#8b90a3', fontSize: '0.9rem' }}>{websiteForm.color}</span>
                    <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                      {['#7c5cff', '#25D366', '#1877F2', '#ff6b35', '#e91e63', '#00bcd4'].map(c => (
                        <div key={c} onClick={() => handleWebsiteFormChange('color', c)}
                          style={{ width: '24px', height: '24px', borderRadius: '50%', background: c, cursor: 'pointer',
                            border: websiteForm.color === c ? '2px solid white' : '2px solid transparent', transition: 'border 0.2s' }} />
                      ))}
                    </div>
                  </div>
                </FormField>
                <button onClick={handleBuildWebsite} disabled={websiteBuilding} style={{ width: '100%', padding: '16px',
                  background: websiteBuilding ? '#4a3a99' : '#7c5cff', color: 'white', border: 'none', borderRadius: '10px',
                  fontSize: '1rem', fontWeight: 700, cursor: websiteBuilding ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {websiteBuilding ? (<><span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Website তৈরি হচ্ছে... (১-২ মিনিট)</>) : '🚀 Website তৈরি করুন'}
                </button>
                <p style={{ color: '#8b90a3', fontSize: '0.8rem', textAlign: 'center', marginTop: '12px', marginBottom: 0 }}>
                  AI আপনার তথ্য দিয়ে একটি সম্পূর্ণ website তৈরি করবে এবং তাৎক্ষণিকভাবে live করে দেবে।
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════ PRODUCTS TAB ════════ */}
      {activeTab === 'products' && (
        <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ color: '#7c5cff', margin: '0 0 4px', fontSize: '1.4rem' }}>📦 Products</h2>
              <p style={{ color: '#8b90a3', margin: 0, fontSize: '0.85rem' }}>
                {currentSiteId ? `Site: ${currentSiteId}` : '⚠️ আগে Website তৈরি করুন'}
              </p>
            </div>
            <button onClick={() => { setShowAddProduct(true); setProductError(''); }}
              disabled={!currentSiteId}
              style={{ padding: '10px 20px', background: currentSiteId ? '#7c5cff' : '#262a38',
                color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: currentSiteId ? 'pointer' : 'not-allowed', fontSize: '0.9rem' }}>
              + Add Product
            </button>
          </div>

          {/* Add Product Form */}
          {showAddProduct && (
            <div style={{ background: '#12141c', border: '1px solid #7c5cff', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ color: '#7c5cff', margin: '0 0 20px', fontSize: '1.1rem' }}>নতুন Product Add করুন</h3>
              {productError && (
                <div style={{ background: '#1f0e0e', border: '1px solid #ff5c5c', borderRadius: '8px', padding: '10px', marginBottom: '16px', color: '#ff5c5c', fontSize: '0.85rem' }}>❌ {productError}</div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormField label="Product Title *">
                  <input type="text" placeholder="যেমন: Cotton T-Shirt" value={productForm.title}
                    onChange={e => setProductForm(p => ({ ...p, title: e.target.value }))} style={inputStyle} />
                </FormField>
                <FormField label="Price (৳) *">
                  <input type="number" placeholder="০" value={productForm.price || ''}
                    onChange={e => setProductForm(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} style={inputStyle} />
                </FormField>
              </div>
              <FormField label="Description">
                <textarea placeholder="Product সম্পর্কে লিখুন..." value={productForm.description}
                  onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} rows={2}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }} />
              </FormField>
              <FormField label="Stock">
                <input type="number" placeholder="০" value={productForm.stock || ''}
                  onChange={e => setProductForm(p => ({ ...p, stock: parseInt(e.target.value) || 0 }))} style={{ ...inputStyle, width: '120px' }} />
              </FormField>

              {/* Sizes */}
              <FormField label="Sizes">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {commonSizes.map(s => (
                    <button key={s} onClick={() => {
                      setProductForm(p => ({ ...p, sizes: p.sizes.includes(s) ? p.sizes.filter(x => x !== s) : [...p.sizes, s] }));
                    }} style={{ padding: '4px 12px', borderRadius: '6px', border: `1px solid ${productForm.sizes.includes(s) ? '#7c5cff' : '#262a38'}`,
                      background: productForm.sizes.includes(s) ? '#7c5cff22' : 'transparent',
                      color: productForm.sizes.includes(s) ? '#7c5cff' : '#8b90a3', cursor: 'pointer', fontSize: '0.82rem' }}>{s}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" placeholder="Custom size..." value={sizeInput}
                    onChange={e => setSizeInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && sizeInput.trim()) { setProductForm(p => ({ ...p, sizes: [...p.sizes, sizeInput.trim()] })); setSizeInput(''); } }}
                    style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={() => { if (sizeInput.trim()) { setProductForm(p => ({ ...p, sizes: [...p.sizes, sizeInput.trim()] })); setSizeInput(''); } }}
                    style={{ padding: '8px 14px', background: '#262a38', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Add</button>
                </div>
                {productForm.sizes.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                    {productForm.sizes.map((s, i) => (
                      <span key={i} style={{ padding: '2px 10px', background: '#7c5cff33', color: '#7c5cff', borderRadius: '20px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {s} <span onClick={() => setProductForm(p => ({ ...p, sizes: p.sizes.filter((_, j) => j !== i) }))} style={{ cursor: 'pointer', opacity: 0.7 }}>×</span>
                      </span>
                    ))}
                  </div>
                )}
              </FormField>

              {/* Colors */}
              <FormField label="Colors">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {commonColors.map(c => (
                    <button key={c} onClick={() => setProductForm(p => ({ ...p, colors: p.colors.includes(c) ? p.colors.filter(x => x !== c) : [...p.colors, c] }))}
                      style={{ padding: '4px 12px', borderRadius: '6px', border: `1px solid ${productForm.colors.includes(c) ? '#7c5cff' : '#262a38'}`,
                        background: productForm.colors.includes(c) ? '#7c5cff22' : 'transparent',
                        color: productForm.colors.includes(c) ? '#7c5cff' : '#8b90a3', cursor: 'pointer', fontSize: '0.82rem' }}>{c}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" placeholder="Custom color..." value={colorInput}
                    onChange={e => setColorInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && colorInput.trim()) { setProductForm(p => ({ ...p, colors: [...p.colors, colorInput.trim()] })); setColorInput(''); } }}
                    style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={() => { if (colorInput.trim()) { setProductForm(p => ({ ...p, colors: [...p.colors, colorInput.trim()] })); setColorInput(''); } }}
                    style={{ padding: '8px 14px', background: '#262a38', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Add</button>
                </div>
                {productForm.colors.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                    {productForm.colors.map((c, i) => (
                      <span key={i} style={{ padding: '2px 10px', background: '#7c5cff33', color: '#7c5cff', borderRadius: '20px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {c} <span onClick={() => setProductForm(p => ({ ...p, colors: p.colors.filter((_, j) => j !== i) }))} style={{ cursor: 'pointer', opacity: 0.7 }}>×</span>
                      </span>
                    ))}
                  </div>
                )}
              </FormField>

              {/* Image URLs */}
              <FormField label="Product Images (URL)">
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" placeholder="https://... image URL দিন" value={imageInput}
                    onChange={e => setImageInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && imageInput.trim()) { setProductForm(p => ({ ...p, images: [...p.images, imageInput.trim()] })); setImageInput(''); } }}
                    style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={() => { if (imageInput.trim()) { setProductForm(p => ({ ...p, images: [...p.images, imageInput.trim()] })); setImageInput(''); } }}
                    style={{ padding: '8px 14px', background: '#262a38', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Add</button>
                </div>
                {productForm.images.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                    {productForm.images.map((img, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <img src={img} alt="" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #262a38' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <button onClick={() => setProductForm(p => ({ ...p, images: p.images.filter((_, j) => j !== i) }))}
                          style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', background: '#ff5c5c', border: 'none', borderRadius: '50%', color: 'white', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </FormField>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleSaveProduct} disabled={productSaving}
                  style={{ flex: 1, padding: '12px', background: productSaving ? '#4a3a99' : '#7c5cff', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: productSaving ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}>
                  {productSaving ? 'Saving...' : '✅ Save Product'}
                </button>
                <button onClick={() => { setShowAddProduct(false); setProductError(''); }}
                  style={{ padding: '12px 20px', background: 'transparent', color: '#8b90a3', border: '1px solid #262a38', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Products List */}
          {productsLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8b90a3' }}>Loading products...</div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8b90a3' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📦</div>
              <p>কোনো product নেই। উপরে "+ Add Product" click করুন।</p>
              {!currentSiteId && <p style={{ color: '#ff5c5c', fontSize: '0.85rem' }}>⚠️ আগে Website tab এ গিয়ে website তৈরি করুন।</p>}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
              {products.map(product => (
                <div key={product.id} style={{ background: '#12141c', border: '1px solid #262a38', borderRadius: '14px', overflow: 'hidden' }}>
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '180px', background: '#1e2130', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>📦</div>
                  )}
                  <div style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'white' }}>{product.title}</h4>
                      <span style={{ color: '#c8ff5c', fontWeight: 700, fontSize: '1rem', whiteSpace: 'nowrap', marginLeft: '8px' }}>৳{product.price}</span>
                    </div>
                    {product.description && <p style={{ color: '#8b90a3', fontSize: '0.8rem', margin: '0 0 8px', lineHeight: '1.4' }}>{product.description}</p>}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      {product.sizes?.map(s => <span key={s} style={{ padding: '2px 8px', background: '#7c5cff22', color: '#7c5cff', borderRadius: '4px', fontSize: '0.75rem' }}>{s}</span>)}
                      {product.colors?.map(c => <span key={c} style={{ padding: '2px 8px', background: '#25D36622', color: '#25D366', borderRadius: '4px', fontSize: '0.75rem' }}>{c}</span>)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#8b90a3', fontSize: '0.8rem' }}>Stock: {product.stock}</span>
                      <button onClick={() => handleDeleteProduct(product.id!)}
                        style={{ padding: '4px 12px', background: '#ff5c5c22', color: '#ff5c5c', border: '1px solid #ff5c5c44', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem' }}>
                        Delete
                      </button>
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
        <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ color: '#7c5cff', margin: '0 0 4px', fontSize: '1.4rem' }}>🛍️ Orders</h2>
              <p style={{ color: '#8b90a3', margin: 0, fontSize: '0.85rem' }}>Customer দের সব orders এখানে দেখতে পাবেন।</p>
            </div>
            <button onClick={loadOrders} style={{ padding: '8px 16px', background: '#1e2130', color: '#8b90a3', border: '1px solid #262a38', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
              🔄 Refresh
            </button>
          </div>

          {ordersLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8b90a3' }}>Loading orders...</div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8b90a3' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🛍️</div>
              <p>এখনো কোনো order নেই।</p>
              {!currentSiteId && <p style={{ color: '#ff5c5c', fontSize: '0.85rem' }}>⚠️ আগে Website তৈরি করুন।</p>}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {orders.map(order => (
                <div key={order.id} style={{ background: '#12141c', border: '1px solid #262a38', borderRadius: '14px', padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>{order.product_title}</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {order.selected_size && <span style={{ padding: '2px 8px', background: '#7c5cff22', color: '#7c5cff', borderRadius: '4px', fontSize: '0.78rem' }}>Size: {order.selected_size}</span>}
                        {order.selected_color && <span style={{ padding: '2px 8px', background: '#25D36622', color: '#25D366', borderRadius: '4px', fontSize: '0.78rem' }}>Color: {order.selected_color}</span>}
                        <span style={{ padding: '2px 8px', background: '#ffb84c22', color: '#ffb84c', borderRadius: '4px', fontSize: '0.78rem' }}>Qty: {order.quantity}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#c8ff5c', fontWeight: 700, fontSize: '1.1rem' }}>৳{order.product_price * order.quantity}</div>
                      <div style={{ fontSize: '0.75rem', color: '#8b90a3', marginTop: '2px' }}>{formatTime(order.created_at)}</div>
                    </div>
                  </div>
                  <div style={{ background: '#1e2130', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.85rem' }}>
                      <div><span style={{ color: '#8b90a3' }}>Customer: </span><span style={{ color: 'white' }}>{order.customer_name}</span></div>
                      <div><span style={{ color: '#8b90a3' }}>Phone: </span><span style={{ color: 'white' }}>{order.customer_phone}</span></div>
                      <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#8b90a3' }}>Address: </span><span style={{ color: 'white' }}>{order.customer_address}</span></div>
                      <div><span style={{ color: '#8b90a3' }}>Payment: </span><span style={{ color: 'white' }}>{paymentLabels[order.payment_method] || order.payment_method}</span></div>
                      {order.transaction_id && <div><span style={{ color: '#8b90a3' }}>TxID: </span><span style={{ color: 'white' }}>{order.transaction_id}</span></div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ padding: '4px 12px', background: (statusColors[order.status] || '#8b90a3') + '22', color: statusColors[order.status] || '#8b90a3', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                      {statusLabels[order.status] || order.status}
                    </span>
                    <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                      {['confirmed', 'shipped', 'delivered', 'cancelled'].map(s => (
                        order.status !== s && (
                          <button key={s} onClick={() => handleUpdateOrderStatus(order.id, s)}
                            style={{ padding: '4px 10px', background: (statusColors[s] || '#8b90a3') + '22', color: statusColors[s] || '#8b90a3',
                              border: `1px solid ${(statusColors[s] || '#8b90a3')}44`, borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                            {statusLabels[s]}
                          </button>
                        )
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const btnStyle = (bg: string, color: string): React.CSSProperties => ({
  width: '100%', padding: '14px', background: bg, color, border: 'none',
  borderRadius: '10px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
  marginBottom: '16px', display: 'block',
});
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', background: '#1e2130', border: '1px solid #262a38',
  borderRadius: '8px', color: 'white', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
};
const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#aab0c0', fontWeight: 600 }}>{label}</label>
    {children}
  </div>
);
const Toggle = ({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#181b26', border: '1px solid #262a38', borderRadius: '10px', padding: '16px' }}>
    <div>
      <p style={{ margin: 0, fontWeight: 600 }}>{label}</p>
      <p style={{ margin: 0, color: '#8b90a3', fontSize: '0.85rem' }}>{desc}</p>
    </div>
    <div onClick={() => onChange(!value)} style={{ width: '48px', height: '26px', borderRadius: '13px', background: value ? '#7c5cff' : '#262a38', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: '3px', left: value ? '24px' : '3px', width: '20px', height: '20px', borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
    </div>
  </div>
);

export default Dashboard;
