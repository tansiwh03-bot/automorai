import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

const SUPABASE_URL = 'https://wwettpkioulkofohfdxl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ul461fEnojpr4GxdJv-P8Q_hySiflQt';
const PAYMENT_REQUEST_API = 'https://n8n2.kingpurefood.com/webhook/automorai/package-payment-request';
const BKASH_NAGAD_NUMBER = '01674610578';

const PACKAGE_INFO: Record<string, { name: string; amount: number; note: string }> = {
  tender: {
    name: 'Tender Automation',
    amount: 20000,
    note: 'Installation charge (covers the first month). From the 2nd month, ৳5,000/month.',
  },
  automation: {
    name: 'Automation (Website + Facebook + WhatsApp + Inbox + Analysis)',
    amount: 2500,
    note: '৳2,500/month.',
  },
};

const getAuthHeader = async (): Promise<Record<string, string>> => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const BuyPackage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const pkg = params.get('package') === 'automation' ? 'automation' : 'tender';
  const info = PACKAGE_INFO[pkg];

  const [businessName, setBusinessName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!user) return <p style={{ color: 'white' }}>Please login</p>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!businessName.trim()) { setError('Enter your business name.'); return; }
    if (!transactionId.trim()) { setError('Enter the Transaction ID from your payment.'); return; }
    if (!screenshotFile) { setError('Upload a screenshot of the payment.'); return; }

    setSubmitting(true);
    let screenshotUrl = '';
    try {
      setUploading(true);
      const ext = screenshotFile.name.split('.').pop();
      const fileName = `payment-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/product-images/${fileName}`, {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': screenshotFile.type || 'application/octet-stream' },
        body: screenshotFile,
      });
      if (!uploadRes.ok) {
        const t = await uploadRes.text().catch(() => '');
        throw new Error(`Upload failed (${uploadRes.status}): ${t.slice(0, 200)}`);
      }
      screenshotUrl = `${SUPABASE_URL}/storage/v1/object/public/product-images/${fileName}`;
    } catch (err: any) {
      setError(`Screenshot upload failed: ${err?.message || err}`);
      setSubmitting(false);
      setUploading(false);
      return;
    }
    setUploading(false);

    try {
      const headers = { 'Content-Type': 'application/json', ...(await getAuthHeader()) };
      const res = await fetch(PAYMENT_REQUEST_API, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          business_name: businessName,
          package: pkg,
          amount: info.amount,
          payment_method: paymentMethod,
          transaction_id: transactionId,
          screenshot_url: screenshotUrl,
        }),
      });
      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch { throw new Error(`Bad response (${res.status}): ${text.slice(0, 200)}`); }
      if (!data.success) throw new Error(data.error || `Request failed (${res.status})`);
      setSubmitted(true);
    } catch (err: any) {
      setError(`Submission failed: ${err?.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px', background: '#181b26', border: '1px solid #262a38',
    borderRadius: '8px', color: 'white', fontSize: '0.95rem', marginTop: '6px',
  };
  const labelStyle: React.CSSProperties = { color: '#8b90a3', fontSize: '0.85rem', fontWeight: 600 };

  return (
    <div style={{
      minHeight: '100vh', background: '#06070a', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontFamily: 'sans-serif', padding: '24px',
    }}>
      <div style={{
        background: '#12141c', border: '1px solid #262a38', borderRadius: '16px',
        padding: '40px', width: '100%', maxWidth: '480px', color: 'white',
      }}>
        {submitted ? (
          <>
            <h1 style={{ color: '#c8ff5c', marginBottom: '8px' }}>✅ Payment submitted</h1>
            <p style={{ color: '#8b90a3', marginBottom: '24px' }}>
              We're reviewing your payment for <strong style={{ color: 'white' }}>{info.name}</strong>.
              Once confirmed, it will be activated on your account — usually within a few hours.
            </p>
            <button onClick={() => navigate('/dashboard')} style={{
              width: '100%', padding: '14px', background: '#7c5cff', color: 'white', border: 'none',
              borderRadius: '10px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
            }}>
              Back to dashboard
            </button>
          </>
        ) : (
          <>
            <h1 style={{ color: '#ffb84c', marginBottom: '8px' }}>Buy {info.name}</h1>
            <p style={{ color: '#8b90a3', marginBottom: '20px' }}>{info.note}</p>

            <div style={{
              background: '#1a1d2b', border: '1px solid #262a38', borderRadius: '10px',
              padding: '16px', marginBottom: '20px',
            }}>
              <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#c8ff5c' }}>৳{info.amount} টাকা পাঠান</p>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#8b90a3' }}>
                bKash বা Nagad (Send Money) নম্বর: <strong style={{ color: 'white' }}>{BKASH_NAGAD_NUMBER}</strong>
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Business name</label>
                <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)}
                  placeholder="e.g. Dhaka Fashion World" style={inputStyle} required />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Payment method</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  {(['bkash', 'nagad'] as const).map(m => (
                    <button key={m} type="button" onClick={() => setPaymentMethod(m)} style={{
                      flex: 1, padding: '10px', borderRadius: '8px', border: paymentMethod === m ? '1px solid #7c5cff' : '1px solid #262a38',
                      background: paymentMethod === m ? '#7c5cff22' : '#181b26',
                      color: paymentMethod === m ? '#7c5cff' : '#8b90a3', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                    }}>{m}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Transaction ID</label>
                <input type="text" value={transactionId} onChange={e => setTransactionId(e.target.value)}
                  placeholder="e.g. 9AB3CDE4F5" style={inputStyle} required />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Payment screenshot</label>
                <input type="file" accept="image/*" onChange={e => setScreenshotFile(e.target.files?.[0] || null)}
                  style={{ ...inputStyle, padding: '10px' }} required />
              </div>

              {error && <p style={{ color: '#ff5c7c', fontSize: '0.85rem', marginBottom: '16px' }}>{error}</p>}

              <button type="submit" disabled={submitting} style={{
                width: '100%', padding: '14px', background: '#ffb84c', color: '#1a1200', border: 'none',
                borderRadius: '10px', fontSize: '1rem', fontWeight: '600',
                cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.6 : 1,
              }}>
                {uploading ? 'Uploading screenshot...' : submitting ? 'Submitting...' : 'Submit payment'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default BuyPackage;
