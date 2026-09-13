import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const WHATSAPP_WEBHOOK_URL = 'https://n8n2.kingpurefood.com/webhook/automorai/whatsapp-setup-request';

const ConnectWhatsApp = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [businessName, setBusinessName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [showBangla, setShowBangla] = useState(false);

  if (!user) return <p style={{ color: 'white' }}>Please login</p>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!businessName || !phoneNumber) {
      setError('Business name and phone number are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(WHATSAPP_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.email,
          email: user.email,
          business_name: businessName,
          phone_number: phoneNumber,
          website_url: websiteUrl,
          business_category: businessCategory,
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
              Our team will set up WhatsApp for <strong style={{ color: 'white' }}>{businessName}</strong> within
              24 hours. We'll message you at your WhatsApp number once it's ready to use — no
              further action needed from you.
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
            <h1 style={{ color: '#25D366', marginBottom: '8px' }}>Connect WhatsApp Business</h1>
            <p style={{ color: '#8b90a3', marginBottom: '24px' }}>
              WhatsApp setup needs a short manual step on our side. Share your details below and
              we'll have it running within 24 hours.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Business name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. King Pure Food"
                  style={inputStyle}
                  required
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={labelStyle}>WhatsApp Business number</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 01XXXXXXXXX"
                  style={inputStyle}
                  required
                />
              </div>

              {/* Important number warning */}
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
                    ⚠️ <strong>Important:</strong> This number will be used only for WhatsApp
                    automation. Once connected, you will no longer be able to use this number in
                    the regular WhatsApp App on your phone. We recommend using a spare or
                    dedicated number for this.
                  </>
                ) : (
                  <>
                    ⚠️ <strong>গুরুত্বপূর্ণ:</strong> এই নম্বরটি শুধুমাত্র WhatsApp automation-এর জন্য
                    ব্যবহৃত হবে। কানেক্ট হয়ে গেলে, আপনি আর ফোনের সাধারণ WhatsApp App-এ এই নম্বরটি
                    ব্যবহার করতে পারবেন না। এজন্য আমরা একটি আলাদা বা খালি নম্বর ব্যবহারের পরামর্শ দিই।
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

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Website (optional)</label>
                <input
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="e.g. https://yourbusiness.com"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>What do you sell? (optional)</label>
                <input
                  type="text"
                  value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}
                  placeholder="e.g. Groceries, Clothing, Electronics"
                  style={inputStyle}
                />
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
                  background: '#25D366',
                  color: 'white',
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

export default ConnectWhatsApp;
