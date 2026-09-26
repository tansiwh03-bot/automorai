import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const FACEBOOK_APP_ID = '1458889719428985';
const REDIRECT_URI = 'https://automorai.com/dashboard';
const WEBHOOK_URL = 'https://n8n2.kingpurefood.com/webhook/automorai/new-customer';
const CONFIG_ID = '1766373457898596';
const INBOX_API = 'https://n8n2.kingpurefood.com/webhook/automorai/inbox';
const WEBSITE_BUILDER_API = 'https://n8n2.kingpurefood.com/webhook/automorai/build-website';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Message {
  role: string;
  message: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  sender_id: string;
  name: string;
  platform: 'whatsapp' | 'messenger' | 'facebook' | 'website' | string;
  page_id: string;
  messages: Message[];
  last_message: string;
  last_time: string;
}

interface WebsiteForm {
  business_name: string;
  business_type: string;
  phone: string;
  address: string;
  color: string;
  services: string;
  description: string;
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
    <span style={{
      fontSize: '0.7rem',
      background: c.color + '22',
      color: c.color,
      border: `1px solid ${c.color}44`,
      borderRadius: '4px',
      padding: '2px 6px',
      fontWeight: 600,
    }}>
      {c.label}
    </span>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user, logout } = useAuth();

  // Tabs: 'home' | 'inbox' | 'website'
  const [activeTab, setActiveTab] = useState<'home' | 'inbox' | 'website'>('home');

  // Home tab state
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
    business_name: '',
    business_type: 'retail',
    phone: '',
    address: '',
    color: '#7c5cff',
    services: '',
    description: '',
  });
  const [websiteBuilding, setWebsiteBuilding] = useState(false);
  const [websiteResult,   setWebsiteResult]   = useState<{ url: string; business_name: string } | null>(null);
  const [websiteError,    setWebsiteError]    = useState('');
  const [websiteUrlCopied, setWebsiteUrlCopied] = useState(false);

  // ── Facebook OAuth code handler ──
  const urlParams = new URLSearchParams(window.location.search);
  const fbCode    = urlParams.get('code');

  useEffect(() => {
    if (fbCode && !connectedPage && user) {
      setStatus('Facebook connected! Exchanging token...');
      fetch('/api/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: fbCode }),
      })
        .then(r => r.json())
        .then(tokenData => {
          if (tokenData.error || !tokenData.access_token) {
            setStatus('❌ Token exchange failed: ' + (tokenData.error || 'unknown error'));
            return;
          }
          setStatus('Setting up automation...');
          return fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id:                user.email,
              email:                  user.email,
              page_id:                'pending',
              page_access_token:      tokenData.access_token,
              comment_reply_enabled:  true,
              messenger_reply_enabled: true,
              timestamp:              new Date().toISOString(),
            }),
          })
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

  // ── Load WhatsApp page_id from sheet ──
  useEffect(() => {
    if (!user) return;
    fetch(`https://n8n2.kingpurefood.com/webhook/automorai/inbox?user_id=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(data => {
        if (data.wa_page_ids?.length > 0) setWaPageId(data.wa_page_ids[0]);
      })
      .catch(() => {});
  }, [user]);

  // ── Load inbox when tab opens ──
  useEffect(() => {
    if (activeTab !== 'inbox' || !user) return;
    setInboxLoading(true);
    setInboxError('');
    fetch(`${INBOX_API}?user_id=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(data => {
        setConversations(data.conversations || []);
        setInboxLoading(false);
      })
      .catch(() => {
        setInboxError('Could not load conversations. Please try again.');
        setInboxLoading(false);
      });
  }, [activeTab, user]);

  if (!user) return <p style={{ color: 'white' }}>Please login</p>;

  // ── Handlers ──
  const handleFacebookConnect = () => {
    const fbURL = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&config_id=${CONFIG_ID}&response_type=code`;
    window.location.href = fbURL;
  };

  const handleWhatsAppConnect = () => { window.location.href = '/connect-whatsapp'; };
  const handleTenderConnect   = () => { window.location.href = '/connect-tender'; };

  const handleToggleChange = (type: 'comment' | 'messenger', value: boolean) => {
    if (type === 'comment') setCommentReply(value);
    else setMessengerReply(value);
    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id:                user.email,
        comment_reply_enabled:  type === 'comment'   ? value : commentReply,
        messenger_reply_enabled: type === 'messenger' ? value : messengerReply,
      }),
    });
  };

  const handleWebsiteFormChange = (field: keyof WebsiteForm, value: string) => {
    setWebsiteForm(prev => ({ ...prev, [field]: value }));
  };

  const handleBuildWebsite = async () => {
    if (!websiteForm.business_name.trim()) {
      setWebsiteError('Business name দিন');
      return;
    }
    if (!websiteForm.phone.trim()) {
      setWebsiteError('Phone number দিন');
      return;
    }

    setWebsiteBuilding(true);
    setWebsiteError('');
    setWebsiteResult(null);

    try {
      const res = await fetch(WEBSITE_BUILDER_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...websiteForm,
          email: user.email,
          user_id: user.email,
        }),
      });
      const data = await res.json();
      if (data.success && data.url) {
        setWebsiteResult({ url: data.url, business_name: data.business_name || websiteForm.business_name });
      } else {
        setWebsiteError('Website তৈরি করতে পারেনি। আবার চেষ্টা করুন।');
      }
    } catch {
      setWebsiteError('Connection error। আবার চেষ্টা করুন।');
    } finally {
      setWebsiteBuilding(false);
    }
  };

  const formatTime = (ts: string) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      const now = new Date();
      const diffH = (now.getTime() - d.getTime()) / 36e5;
      if (diffH < 24) return d.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
      return d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' });
    } catch { return ''; }
  };

  const businessTypes = [
    { value: 'retail',      label: 'Retail / Shop' },
    { value: 'restaurant',  label: 'Restaurant / Food' },
    { value: 'fashion',     label: 'Fashion / Clothing' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'pharmacy',    label: 'Pharmacy / Health' },
    { value: 'beauty',      label: 'Beauty / Salon' },
    { value: 'education',   label: 'Education / Coaching' },
    { value: 'service',     label: 'Service Business' },
    { value: 'other',       label: 'Other' },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: '#06070a',
      fontFamily: 'sans-serif',
      color: 'white',
    }}>

      {/* ── Top Nav ── */}
      <div style={{
        background: '#12141c',
        borderBottom: '1px solid #262a38',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '56px',
      }}>
        <span style={{ color: '#7c5cff', fontWeight: 700, fontSize: '1.1rem' }}>
          Automorai
        </span>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {([
            { key: 'home',    label: '🏠 Home' },
            { key: 'inbox',   label: '💬 Inbox' },
            { key: 'website', label: '🌐 Website' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '6px 18px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                background: activeTab === tab.key ? '#7c5cff' : 'transparent',
                color:      activeTab === tab.key ? 'white'   : '#8b90a3',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span style={{ color: '#8b90a3', fontSize: '0.85rem' }}>{user.email}</span>
      </div>

      {/* ════════════════════════════════════════
          HOME TAB
      ════════════════════════════════════════ */}
      {activeTab === 'home' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 16px',
        }}>
          <div style={{
            background: '#12141c',
            border: '1px solid #262a38',
            borderRadius: '16px',
            padding: '40px',
            width: '100%',
            maxWidth: '480px',
          }}>
            <h1 style={{ color: '#7c5cff', marginBottom: '8px' }}>Welcome to Automorai</h1>
            <p style={{ color: '#8b90a3', marginBottom: '24px' }}>Hello, {user.email}!</p>

            {status && (
              <div style={{
                background: '#181b26',
                border: '1px solid #7c5cff',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                fontSize: '0.9rem',
                color: '#c8ff5c',
              }}>
                {status}
              </div>
            )}

            {/* Facebook */}
            {connectedPage ? (
              <div style={{
                background: '#181b26',
                border: '1px solid #c8ff5c',
                borderRadius: '10px',
                padding: '14px',
                marginBottom: '16px',
                color: '#c8ff5c',
                fontWeight: 600,
              }}>
                ✅ {connectedPage} Connected
              </div>
            ) : (
              <button onClick={handleFacebookConnect} style={btnStyle('#7c5cff', 'white')}>
                Connect Facebook Page
              </button>
            )}

            {/* WhatsApp */}
            <button onClick={handleWhatsAppConnect} style={btnStyle('#25D366', 'white')}>
              Connect WhatsApp Business
            </button>

            {/* Tender */}
            <button onClick={handleTenderConnect} style={btnStyle('#ffb84c', '#1a1200')}>
              Connect Tender Automation
            </button>

            {/* Widget Code */}
            {waPageId && (
              <div style={{
                background: '#0e1018',
                border: '1px solid #7c5cff44',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
              }}>
                <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '0.9rem', color: '#7c5cff' }}>
                  🌐 Your Website Widget Code
                </p>
                <p style={{ margin: '0 0 10px', fontSize: '0.8rem', color: '#8b90a3' }}>
                  এই code টা আপনার website এ paste করুন
                </p>
                <pre style={{
                  background: '#06070a',
                  border: '1px solid #262a38',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '0.72rem',
                  color: '#c8ff5c',
                  overflowX: 'auto',
                  margin: '0 0 10px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}>{`<script\n  src="https://automorai.com/automorai-widget.js"\n  data-page-id="${waPageId}"\n  data-business="Your Business Name"\n  data-color="#7c5cff">\n</script>`}</pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `<script\n  src="https://automorai.com/automorai-widget.js"\n  data-page-id="${waPageId}"\n  data-business="Your Business Name"\n  data-color="#7c5cff">\n</script>`
                    );
                    setWidgetCopied(true);
                    setTimeout(() => setWidgetCopied(false), 2000);
                  }}
                  style={{
                    width: '100%', padding: '10px',
                    background: widgetCopied ? '#c8ff5c' : '#7c5cff',
                    color: widgetCopied ? '#06070a' : 'white',
                    border: 'none', borderRadius: '8px',
                    fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {widgetCopied ? '✅ Copied!' : '📋 Copy Code'}
                </button>
              </div>
            )}

            {/* Toggles */}
            <Toggle
              label="Comment Auto-Reply"
              desc="Auto-reply to Facebook comments"
              value={commentReply}
              onChange={v => handleToggleChange('comment', v)}
            />
            <div style={{ marginBottom: '12px' }} />
            <Toggle
              label="Messenger Auto-Reply"
              desc="Auto-reply to Messenger messages"
              value={messengerReply}
              onChange={v => handleToggleChange('messenger', v)}
            />

            <div style={{ height: '24px' }} />
            <button
              onClick={logout}
              style={{
                width: '100%', padding: '14px',
                background: 'transparent', color: '#8b90a3',
                border: '1px solid #262a38', borderRadius: '10px',
                fontSize: '1rem', cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          INBOX TAB
      ════════════════════════════════════════ */}
      {activeTab === 'inbox' && (
        <div style={{
          display: 'flex',
          height: 'calc(100vh - 56px)',
          overflow: 'hidden',
        }}>

          {/* ── Conversation List (left) ── */}
          <div style={{
            width: '320px',
            minWidth: '320px',
            borderRight: '1px solid #262a38',
            overflowY: 'auto',
            background: '#0e1018',
          }}>
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #262a38',
              fontWeight: 700,
              fontSize: '1rem',
              color: '#7c5cff',
            }}>
              💬 Unified Inbox
            </div>

            {inboxLoading && (
              <div style={{ padding: '24px', color: '#8b90a3', textAlign: 'center' }}>
                Loading conversations...
              </div>
            )}

            {inboxError && (
              <div style={{ padding: '16px', color: '#ff5c5c', fontSize: '0.9rem' }}>
                {inboxError}
              </div>
            )}

            {!inboxLoading && !inboxError && conversations.length === 0 && (
              <div style={{ padding: '24px', color: '#8b90a3', textAlign: 'center', fontSize: '0.9rem' }}>
                No conversations yet.<br />Connect Facebook or WhatsApp to start.
              </div>
            )}

            {conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid #1a1d27',
                  cursor: 'pointer',
                  background: selectedConversation?.id === conv.id ? '#181b26' : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                {/* Name + time */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                    {conv.name}
                  </span>
                  <span style={{ color: '#8b90a3', fontSize: '0.75rem' }}>
                    {formatTime(conv.last_time)}
                  </span>
                </div>
                {/* Platform badge + last message */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <PlatformBadge platform={conv.platform} />
                  <span style={{
                    color: '#8b90a3',
                    fontSize: '0.82rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '180px',
                  }}>
                    {conv.last_message}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ── Chat Window (right) ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {!selectedConversation ? (
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8b90a3',
                flexDirection: 'column',
                gap: '12px',
              }}>
                <span style={{ fontSize: '2rem' }}>💬</span>
                <span>Select a conversation to view messages</span>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid #262a38',
                  background: '#12141c',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{selectedConversation.name}</div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                      <PlatformBadge platform={selectedConversation.platform} />
                      <span style={{ color: '#8b90a3', fontSize: '0.78rem' }}>
                        {selectedConversation.sender_id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}>
                  {selectedConversation.messages
                    .slice()
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                    .map((msg, i) => {
                      const isUser = msg.role === 'user';
                      return (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            justifyContent: isUser ? 'flex-start' : 'flex-end',
                          }}
                        >
                          <div style={{
                            maxWidth: '65%',
                            padding: '10px 14px',
                            borderRadius: isUser ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                            background: isUser ? '#1e2130' : '#7c5cff',
                            color: 'white',
                            fontSize: '0.9rem',
                            lineHeight: '1.5',
                          }}>
                            <div>{msg.message}</div>
                            <div style={{
                              fontSize: '0.72rem',
                              color: isUser ? '#8b90a3' : 'rgba(255,255,255,0.6)',
                              marginTop: '4px',
                              textAlign: 'right',
                            }}>
                              {formatTime(msg.timestamp)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Reply box (view only for now) */}
                <div style={{
                  padding: '14px 20px',
                  borderTop: '1px solid #262a38',
                  background: '#12141c',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                }}>
                  <input
                    placeholder="Reply coming soon..."
                    disabled
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      background: '#1e2130',
                      border: '1px solid #262a38',
                      borderRadius: '10px',
                      color: '#8b90a3',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    disabled
                    style={{
                      padding: '10px 18px',
                      background: '#7c5cff44',
                      color: '#7c5cff',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'not-allowed',
                      fontWeight: 600,
                    }}
                  >
                    Send
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          WEBSITE BUILDER TAB
      ════════════════════════════════════════ */}
      {activeTab === 'website' && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '40px 16px',
        }}>
          <div style={{ width: '100%', maxWidth: '560px' }}>

            {/* Header */}
            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ color: '#7c5cff', margin: '0 0 6px', fontSize: '1.4rem' }}>
                🌐 Website Builder
              </h2>
              <p style={{ color: '#8b90a3', margin: 0, fontSize: '0.9rem' }}>
                আপনার business এর তথ্য দিন — AI আপনার জন্য একটি সুন্দর website তৈরি করে দেবে।
              </p>
            </div>

            {/* ── Result card ── */}
            {websiteResult && (
              <div style={{
                background: '#0d1f12',
                border: '1px solid #c8ff5c',
                borderRadius: '14px',
                padding: '24px',
                marginBottom: '24px',
              }}>
                <p style={{ color: '#c8ff5c', fontWeight: 700, margin: '0 0 4px', fontSize: '1rem' }}>
                  ✅ Website তৈরি হয়ে গেছে!
                </p>
                <p style={{ color: '#8b90a3', margin: '0 0 16px', fontSize: '0.85rem' }}>
                  {websiteResult.business_name} এর website live আছে।
                </p>
                <a
                  href={websiteResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    color: '#7c5cff',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    marginBottom: '12px',
                    wordBreak: 'break-all',
                  }}
                >
                  {websiteResult.url}
                </a>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(websiteResult.url);
                      setWebsiteUrlCopied(true);
                      setTimeout(() => setWebsiteUrlCopied(false), 2000);
                    }}
                    style={{
                      flex: 1, padding: '10px',
                      background: websiteUrlCopied ? '#c8ff5c' : '#7c5cff',
                      color: websiteUrlCopied ? '#06070a' : 'white',
                      border: 'none', borderRadius: '8px',
                      fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem',
                      transition: 'all 0.2s',
                    }}
                  >
                    {websiteUrlCopied ? '✅ Copied!' : '📋 URL Copy করুন'}
                  </button>
                  <a
                    href={websiteResult.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1, padding: '10px',
                      background: '#1e2130',
                      color: 'white',
                      border: '1px solid #262a38',
                      borderRadius: '8px',
                      fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem',
                      textDecoration: 'none',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    🔗 Website দেখুন
                  </a>
                </div>
                <button
                  onClick={() => {
                    setWebsiteResult(null);
                    setWebsiteForm({
                      business_name: '',
                      business_type: 'retail',
                      phone: '',
                      address: '',
                      color: '#7c5cff',
                      services: '',
                      description: '',
                    });
                  }}
                  style={{
                    width: '100%', marginTop: '10px', padding: '10px',
                    background: 'transparent', color: '#8b90a3',
                    border: '1px solid #262a38', borderRadius: '8px',
                    cursor: 'pointer', fontSize: '0.85rem',
                  }}
                >
                  নতুন Website তৈরি করুন
                </button>
              </div>
            )}

            {/* ── Form ── */}
            {!websiteResult && (
              <div style={{
                background: '#12141c',
                border: '1px solid #262a38',
                borderRadius: '16px',
                padding: '28px',
              }}>

                {websiteError && (
                  <div style={{
                    background: '#1f0e0e',
                    border: '1px solid #ff5c5c',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '16px',
                    color: '#ff5c5c',
                    fontSize: '0.88rem',
                  }}>
                    ❌ {websiteError}
                  </div>
                )}

                {/* Business Name */}
                <FormField label="Business Name *">
                  <input
                    type="text"
                    placeholder="যেমন: Dhaka Fashion House"
                    value={websiteForm.business_name}
                    onChange={e => handleWebsiteFormChange('business_name', e.target.value)}
                    style={inputStyle}
                  />
                </FormField>

                {/* Business Type */}
                <FormField label="Business Type *">
                  <select
                    value={websiteForm.business_type}
                    onChange={e => handleWebsiteFormChange('business_type', e.target.value)}
                    style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                  >
                    {businessTypes.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </FormField>

                {/* Phone */}
                <FormField label="Phone Number *">
                  <input
                    type="text"
                    placeholder="01XXXXXXXXX"
                    value={websiteForm.phone}
                    onChange={e => handleWebsiteFormChange('phone', e.target.value)}
                    style={inputStyle}
                  />
                </FormField>

                {/* Address */}
                <FormField label="Address">
                  <input
                    type="text"
                    placeholder="যেমন: Mirpur, Dhaka"
                    value={websiteForm.address}
                    onChange={e => handleWebsiteFormChange('address', e.target.value)}
                    style={inputStyle}
                  />
                </FormField>

                {/* Services */}
                <FormField label="Products / Services">
                  <input
                    type="text"
                    placeholder="যেমন: Shirts, Pants, Saree, Kids Wear"
                    value={websiteForm.services}
                    onChange={e => handleWebsiteFormChange('services', e.target.value)}
                    style={inputStyle}
                  />
                </FormField>

                {/* Description */}
                <FormField label="Business Description">
                  <textarea
                    placeholder="আপনার business সম্পর্কে কিছু লিখুন..."
                    value={websiteForm.description}
                    onChange={e => handleWebsiteFormChange('description', e.target.value)}
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
                  />
                </FormField>

                {/* Color */}
                <FormField label="Brand Color">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="color"
                      value={websiteForm.color}
                      onChange={e => handleWebsiteFormChange('color', e.target.value)}
                      style={{
                        width: '48px',
                        height: '40px',
                        border: '1px solid #262a38',
                        borderRadius: '8px',
                        background: '#1e2130',
                        cursor: 'pointer',
                        padding: '2px',
                      }}
                    />
                    <span style={{ color: '#8b90a3', fontSize: '0.9rem' }}>
                      {websiteForm.color}
                    </span>
                    {/* Color presets */}
                    <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                      {['#7c5cff', '#25D366', '#1877F2', '#ff6b35', '#e91e63', '#00bcd4'].map(c => (
                        <div
                          key={c}
                          onClick={() => handleWebsiteFormChange('color', c)}
                          style={{
                            width: '24px', height: '24px',
                            borderRadius: '50%',
                            background: c,
                            cursor: 'pointer',
                            border: websiteForm.color === c ? '2px solid white' : '2px solid transparent',
                            transition: 'border 0.2s',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </FormField>

                {/* Submit */}
                <button
                  onClick={handleBuildWebsite}
                  disabled={websiteBuilding}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: websiteBuilding ? '#4a3a99' : '#7c5cff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: websiteBuilding ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {websiteBuilding ? (
                    <>
                      <span style={{
                        display: 'inline-block',
                        width: '16px', height: '16px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }} />
                      Website তৈরি হচ্ছে... (১-২ মিনিট)
                    </>
                  ) : (
                    '🚀 Website তৈরি করুন'
                  )}
                </button>

                <p style={{ color: '#8b90a3', fontSize: '0.8rem', textAlign: 'center', marginTop: '12px', marginBottom: 0 }}>
                  AI আপনার তথ্য দিয়ে একটি সম্পূর্ণ website তৈরি করবে এবং তাৎক্ষণিকভাবে live করে দেবে।
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Spinner animation */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

// ─── Reusable helpers ─────────────────────────────────────────────────────────
const btnStyle = (bg: string, color: string): React.CSSProperties => ({
  width: '100%',
  padding: '14px',
  background: bg,
  color,
  border: 'none',
  borderRadius: '10px',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  marginBottom: '16px',
  display: 'block',
});

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: '#1e2130',
  border: '1px solid #262a38',
  borderRadius: '8px',
  color: 'white',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#aab0c0', fontWeight: 600 }}>
      {label}
    </label>
    {children}
  </div>
);

const Toggle = ({
  label, desc, value, onChange,
}: {
  label: string; desc: string; value: boolean; onChange: (v: boolean) => void;
}) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#181b26',
    border: '1px solid #262a38',
    borderRadius: '10px',
    padding: '16px',
  }}>
    <div>
      <p style={{ margin: 0, fontWeight: 600 }}>{label}</p>
      <p style={{ margin: 0, color: '#8b90a3', fontSize: '0.85rem' }}>{desc}</p>
    </div>
    <div
      onClick={() => onChange(!value)}
      style={{
        width: '48px', height: '26px', borderRadius: '13px',
        background: value ? '#7c5cff' : '#262a38',
        cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: '3px',
        left: value ? '24px' : '3px',
        width: '20px', height: '20px', borderRadius: '50%',
        background: 'white', transition: 'left 0.2s',
      }} />
    </div>
  </div>
);

export default Dashboard;
