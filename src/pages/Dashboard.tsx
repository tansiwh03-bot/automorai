import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const FACEBOOK_APP_ID = '2236207880559103';
const REDIRECT_URI = 'https://automorai-app.vercel.app/dashboard';
const WEBHOOK_URL = 'https://n8n2.kingpurefood.com/webhook/automorai/new-customer';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [commentReply, setCommentReply] = useState(true);
  const [messengerReply, setMessengerReply] = useState(true);
  const [connectedPage, setConnectedPage] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  if (!user) return <p style={{color:'white'}}>Please login</p>;

  // Check if Facebook returned a code
  const urlParams = new URLSearchParams(window.location.search);
  const fbCode = urlParams.get('code');

  if (fbCode && !connectedPage) {
    setStatus('Facebook connected! Setting up automation...');
    // Send to webhook
    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.email,
        email: user.email,
        page_id: 'pending',
        page_access_token: fbCode,
        comment_reply_enabled: true,
        messenger_reply_enabled: true,
        timestamp: new Date().toISOString()
      })
    }).then(() => {
      setConnectedPage('Facebook Page');
      setStatus('✅ Connected successfully!');
      // Clean URL
      window.history.replaceState({}, '', '/dashboard');
    }).catch(() => {
      setStatus('❌ Connection failed. Please try again.');
    });
  }

  const handleFacebookConnect = () => {
    const scope = 'pages_show_list,pages_messaging,pages_read_engagement,pages_manage_metadata';
    const fbURL = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scope}&response_type=code`;
    window.location.href = fbURL;
  };

  const handleToggleChange = (type: 'comment' | 'messenger', value: boolean) => {
    if (type === 'comment') setCommentReply(value);
    else setMessengerReply(value);

    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.email,
        comment_reply_enabled: type === 'comment' ? value : commentReply,
        messenger_reply_enabled: type === 'messenger' ? value : messengerReply,
      })
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#06070a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        background: '#12141c',
        border: '1px solid #262a38',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '480px',
        color: 'white'
      }}>
        <h1 style={{color: '#7c5cff', marginBottom: '8px'}}>
          Welcome to Automorai
        </h1>
        <p style={{color: '#8b90a3', marginBottom: '24px'}}>
          Hello, {user.email}!
        </p>

        {status && (
          <div style={{
            background: '#181b26',
            border: '1px solid #7c5cff',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            fontSize: '0.9rem',
            color: '#c8ff5c'
          }}>
            {status}
          </div>
        )}

        {connectedPage ? (
          <div style={{
            background: '#181b26',
            border: '1px solid #c8ff5c',
            borderRadius: '10px',
            padding: '14px',
            marginBottom: '16px',
            color: '#c8ff5c',
            fontWeight: '600'
          }}>
            ✅ {connectedPage} Connected
          </div>
        ) : (
          <button
            onClick={handleFacebookConnect}
            style={{
              width: '100%',
              padding: '14px',
              background: '#7c5cff',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '16px'
            }}
          >
            Connect Facebook Page
          </button>
        )}

        {/* Comment Reply Toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#181b26',
          border: '1px solid #262a38',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '12px'
        }}>
          <div>
            <p style={{margin: 0, fontWeight: '600'}}>Comment Auto-Reply</p>
            <p style={{margin: 0, color: '#8b90a3', fontSize: '0.85rem'}}>
              Auto-reply to Facebook comments
            </p>
          </div>
          <div
            onClick={() => handleToggleChange('comment', !commentReply)}
            style={{
              width: '48px', height: '26px', borderRadius: '13px',
              background: commentReply ? '#7c5cff' : '#262a38',
              cursor: 'pointer', position: 'relative', transition: 'background 0.2s'
            }}
          >
            <div style={{
              position: 'absolute', top: '3px',
              left: commentReply ? '24px' : '3px',
              width: '20px', height: '20px', borderRadius: '50%',
              background: 'white', transition: 'left 0.2s'
            }} />
          </div>
        </div>

        {/* Messenger Reply Toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#181b26',
          border: '1px solid #262a38',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div>
            <p style={{margin: 0, fontWeight: '600'}}>Messenger Auto-Reply</p>
            <p style={{margin: 0, color: '#8b90a3', fontSize: '0.85rem'}}>
              Auto-reply to Messenger messages
            </p>
          </div>
          <div
            onClick={() => handleToggleChange('messenger', !messengerReply)}
            style={{
              width: '48px', height: '26px', borderRadius: '13px',
              background: messengerReply ? '#7c5cff' : '#262a38',
              cursor: 'pointer', position: 'relative', transition: 'background 0.2s'
            }}
          >
            <div style={{
              position: 'absolute', top: '3px',
              left: messengerReply ? '24px' : '3px',
              width: '20px', height: '20px', borderRadius: '50%',
              background: 'white', transition: 'left 0.2s'
            }} />
          </div>
        </div>

        <button
          onClick={logout}
          style={{
            width: '100%', padding: '14px',
            background: 'transparent', color: '#8b90a3',
            border: '1px solid #262a38', borderRadius: '10px',
            fontSize: '1rem', cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
