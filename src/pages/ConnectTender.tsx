import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TENDER_WEBHOOK_URL = 'https://n8n2.kingpurefood.com/webhook/automorai/tender-setup-request';

const ConnectTender = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState('');
  const [proprietorName, setProprietorName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramUserId, setTelegramUserId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [showBangla, setShowBangla] = useState(false);

  if (!user) return <p style={{ color: 'white' }}>Please login</p>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!companyName || !proprietorName || !telegramBotToken || !telegramUserId) {
      setError('Company name, proprietor name, Telegram bot token, and your Telegram user ID are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(TENDER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.email,
          email: user.email,
          company_name: companyName,
          proprietor_name: proprietorName,
          company_address: companyAddress,
          telegram_bot_token: telegramBotToken,
          telegram_user_id: telegramUserId,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error('Request failed');
      setSubmitted(true);
    } catch (err) {
      setError('Something went wrong. Please try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    background: '#181b26',
    border: '1px solid #262a38',
    borderRadius: '8px',
    color: 'white',
    fontSize: '0.95rem',
    marginTop: '6px',
  };

  const labelStyle: React.CSSProperties = {
    color: '#8b90a3',
    fontSize: '0.85rem',
    fontWeight: 600,
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#06070a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif',
      padding: '24px',
    }}>
      <div style={{
        background: '#12141c',
        border: '1px solid #262a38',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '480px',
        color: 'white',
      }}>
        {submitted ? (
          <>
            <h1 style={{ color: '#c8ff5c', marginBottom: '8px' }}>✅ Request received</h1>
            <p style={{ color: '#8b90a3', marginBottom: '24px' }}>
              Our team will set up Tender Document Automation for{' '}
              <strong style={{ color: 'white' }}>{companyName}</strong> within 24 hours. We'll message
              you on Telegram once it's ready to use — no further action needed from you.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
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
              }}
            >
              Back to dashboard
            </button>
          </>
        ) : (
          <>
            <h1 style={{ color: '#ffb84c', marginBottom: '8px' }}>Connect Tender Automation</h1>
            <p style={{ color: '#8b90a3', marginBottom: '24px' }}>
              Tender document setup needs a short manual step on our side. Share your details below
              and we'll have it running within 24 hours.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Company name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. F & F Traders"
                  style={inputStyle}
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Proprietor / signing authority name</label>
                <input
                  type="text"
                  value={proprietorName}
                  onChange={(e) => setProprietorName(e.target.value)}
                  placeholder="e.g. Md. Omar Faruk"
                  style={inputStyle}
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Company address (optional)</label>
                <input
                  type="text"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="e.g. West Nakhalpara, Tejgaon, Dhaka"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={labelStyle}>Telegram bot token</label>
                <input
                  type="text"
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  placeholder="e.g. 123456:ABC-DEF..."
                  style={inputStyle}
                  required
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={labelStyle}>Your Telegram user ID</label>
                <input
                  type="text"
                  value={telegramUserId}
                  onChange={(e) => setTelegramUserId(e.target.value)}
                  placeholder="e.g. 1952068243"
                  style={inputStyle}
                  required
                />
              </div>

              <div style={{
                background: '#1f1a0f',
                border: '1px solid #a5822b',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
                fontSize: '0.82rem',
                lineHeight: 1.5,
                color: '#e0c184',
              }}>
                {!showBangla ? (
                  <>
                    ⚠️ <strong>Important:</strong> Create your own Telegram bot via @BotFather (free,
                    takes 2 minutes) and paste its token above. This keeps your documents and
                    conversations completely separate from other companies using this service. To
                    find your Telegram user ID, message @userinfobot on Telegram.
                  </>
                ) : (
                  <>
                    ⚠️ <strong>গুরুত্বপূর্ণ:</strong> @BotFather দিয়ে নিজের একটা Telegram bot বানান (ফ্রি,
                    ২ মিনিট লাগবে) এবং এর token উপরে পেস্ট করুন। এতে আপনার documents ও conversation
                    অন্য company থেকে সম্পূর্ণ আলাদা থাকবে। নিজের Telegram user ID জানতে @userinfobot-কে
                    message করুন।
                  </>
                )}
                <div style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowBangla(!showBangla)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#c8ff5c',
                      fontSize: '0.8rem',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {showBangla ? 'Read in English' : 'বাংলায় পড়ুন'}
                  </button>
                </div>
              </div>

              {error && (
                <p style={{ color: '#ff5c7c', fontSize: '0.85rem', marginBottom: '16px' }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: '#ffb84c',
                  color: '#1a1200',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: submitting ? 'default' : 'pointer',
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? 'Sending...' : 'Request setup'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ConnectTender;
