import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Check } from 'lucide-react';
import { toast } from 'sonner';

// Same look as Login.tsx (brand panel left, form right; brand panel hidden on mobile).
export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signup(email, password);
      if (result.success) {
        toast.success('Account created! You can now log in.');
        navigate('/login');
      } else {
        toast.error(result.error || 'Signup failed');
      }
    } catch (err) {
      toast.error('Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '13px 14px',
    border: '1.5px solid #d6deeb', borderRadius: '11px', fontSize: '0.95rem',
    color: '#0f1c35', background: '#fff', outline: 'none', transition: 'border-color .15s',
  };

  const bullets = [
    'Free sign up — build your online shop in minutes',
    'AI replies on Facebook, Messenger & WhatsApp — 24/7',
    'Orders, courier booking, stock and sales in one place',
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f4f8ff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Brand panel */}
      <div className="signup-brand" style={{
        flex: '1 1 0', position: 'relative', overflow: 'hidden', color: '#fff',
        background: 'radial-gradient(60% 55% at 80% 15%, #1b57a6aa, transparent 60%), linear-gradient(140deg, #07122a, #0d2550 55%, #0a2a66)',
        padding: '56px 52px', flexDirection: 'column', justifyContent: 'space-between',
      }}>
        <a href="/" title="Back to home" style={{ display: 'flex', alignItems: 'center', gap: '11px', fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.02em', color: '#fff', textDecoration: 'none' }}>
          <span style={{ width: '38px', height: '38px', borderRadius: '11px', background: 'linear-gradient(135deg,#19c6ea,#2563eb)', display: 'grid', placeItems: 'center', boxShadow: '0 8px 22px -6px #2563eb' }}>
            <svg viewBox="0 0 24 24" fill="none" style={{ width: '22px', height: '22px' }}>
              <path d="M5 18V9a7 7 0 0 1 14 0v9" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" />
              <path d="M12 13l1.3 2.5 2.7.4-2 1.9.5 2.7L12 19.6 9.5 20.9l.5-2.7-2-1.9 2.7-.4z" fill="#fff" />
            </svg>
          </span>
          <span>Automor<span style={{ background: 'linear-gradient(90deg,#19c6ea,#8fd3ff)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>ai</span></span>
        </a>

        <div>
          <h1 style={{ fontSize: '2.15rem', lineHeight: 1.15, fontWeight: 800, letterSpacing: '-0.01em', margin: '0 0 18px' }}>
            Start selling online<br />in a few minutes.
          </h1>
          <div style={{ display: 'grid', gap: '14px', marginTop: '26px' }}>
            {bullets.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', color: '#d7e4f8', fontSize: '0.98rem' }}>
                <span style={{ flex: '0 0 auto', width: '24px', height: '24px', borderRadius: '50%', background: '#16b97833', color: '#4fe3a8', display: 'grid', placeItems: 'center', marginTop: '1px' }}>
                  <Check size={14} strokeWidth={3} />
                </span>
                {b}
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: '#9fb0cc', fontSize: '0.85rem', margin: 0 }}>Built for small businesses in Bangladesh.</p>
      </div>

      {/* Form panel */}
      <div style={{ flex: '1 1 0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {/* mobile logo */}
          <a href="/" className="signup-mobilelogo" style={{ display: 'none', alignItems: 'center', gap: '10px', fontWeight: 800, fontSize: '1.3rem', color: '#0f1c35', marginBottom: '28px', justifyContent: 'center', textDecoration: 'none' }}>
            <span style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg,#19c6ea,#2563eb)', display: 'grid', placeItems: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" style={{ width: '20px', height: '20px' }}>
                <path d="M5 18V9a7 7 0 0 1 14 0v9" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" />
              </svg>
            </span>
            <span>Automor<span style={{ color: '#2563eb' }}>ai</span></span>
          </a>

          <a href="/" style={{ display: 'inline-block', color: '#5e6d88', fontSize: '0.88rem', textDecoration: 'none', marginBottom: '18px' }}>← Back to home</a>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f1c35', margin: '0 0 6px', letterSpacing: '-0.01em' }}>Create your account</h2>
          <p style={{ color: '#5e6d88', fontSize: '0.92rem', margin: '0 0 26px' }}>Free sign up. No card needed.</p>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#344256', marginBottom: '7px' }}>Email</label>
              <input id="email" type="email" placeholder="you@business.com" value={email}
                onChange={(e) => setEmail(e.target.value)}
                required disabled={loading} style={inputStyle} />
            </div>

            <div>
              <label htmlFor="password" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#344256', marginBottom: '7px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input id="password" type={showPassword ? 'text' : 'password'} placeholder="Create a password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required minLength={6} disabled={loading} style={{ ...inputStyle, paddingRight: '42px' }} />
                <button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#8b97ad', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#8b97ad', margin: '7px 0 0' }}>At least 6 characters.</p>
            </div>

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '13px', marginTop: '4px', border: 'none', borderRadius: '11px', cursor: loading ? 'default' : 'pointer',
                background: 'linear-gradient(110deg,#19c6ea,#2563eb)', color: '#fff', fontWeight: 700, fontSize: '0.98rem',
                boxShadow: '0 12px 26px -12px #2563eb', opacity: loading ? 0.75 : 1 }}>
              {loading ? 'Creating account…' : 'Sign up'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.88rem', color: '#5e6d88', marginTop: '22px' }}>
            Already have an account?{' '}
            <a href="/login" style={{ color: '#2563eb', fontWeight: 700 }}>Log in</a>
          </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .signup-brand { display: flex; }
        @media (max-width: 880px) {
          .signup-brand { display: none !important; }
          .signup-mobilelogo { display: flex !important; }
        }
        input:focus { border-color: #2563eb !important; box-shadow: 0 0 0 3px #2563eb22; }
      ` }} />
    </div>
  );
}
