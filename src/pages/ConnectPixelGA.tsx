import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PIXEL_GA_WEBHOOK_URL = 'https://n8n2.kingpurefood.com/webhook/automorai/pixel-ga-setup-request';

const ConnectPixelGA = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [businessName, setBusinessName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [showBangla, setShowBangla] = useState(false);

  if (!user) return <p style={{ color: 'white' }}>Please login</p>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!businessName || !websiteUrl) {
      setError('Business name and website URL are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(PIXEL_GA_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.email,
          email: user.email,
          business_name: businessName,
          website_url: websiteUrl,
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
              Our team will set up your Facebook Pixel and Google Analytics for{' '}
              <strong style={{ color: 'white' }}>{businessName}</strong> within 24 hours. We'll
              message you on WhatsApp once it's live — no further action needed from you.
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
            <h1 style={{ color: '#0099FF', marginBottom: '8px' }}>Facebook Pixel ও Google Analytics Setup</h1>
            <p style={{ color: '#8b90a3', marginBottom: '24px' }}>
              {!showBangla ? (
                <>
                  Get Facebook Pixel and Google Analytics tracking installed on your website —
                  no technical setup needed. Our team handles it for you within 24 hours.
                </>
              ) : (
                <>
                  আপনার ওয়েবসাইটে Facebook Pixel আর Google Analytics বসিয়ে দেওয়া হবে — কোনো
                  টেকনিক্যাল কাজ করতে হবে না। আমাদের টিম ২৪ ঘণ্টার মধ্যে এটা করে দেবে।
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

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Website URL</label>
                <input
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="e.g. https://yourbusiness.com"
                  style={inputStyle}
                  required
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
                  background: '#0099FF',
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

export default ConnectPixelGA;
