import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Shield, Zap, Globe, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import logoImg from '../Untitled.png';

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mfaMode, setMfaMode] = useState(false);
  const [mfaCode, setMfaCode] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      const tokens = await authApi.login(email, password);
      localStorage.setItem('trip_access_token', tokens.access_token);
      const user = await authApi.getMe();
      setAuth(user, tokens.access_token, tokens.refresh_token);
      toast.success(`Welcome back, ${user.full_name.split(' ')[0]}! 👋`);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Shield, text: 'Tokenized security — your bank details stay private' },
    { icon: Zap, text: 'Instant wallet-to-wallet transfers' },
    { icon: Globe, text: 'Virtual Payment Address: yourname@trip.et' },
  ];

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'var(--bg)',
      position: 'relative', overflow: 'hidden',
    }}>

      {/* Left panel — branding */}
      <div className="hide-mobile" style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 64px', position: 'relative', zIndex: 1,
        borderRight: '1px solid var(--border)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 64 }}>
          <img src={logoImg} alt="TRIP Logo" style={{ maxHeight: '110px', width: 'auto', objectFit: 'contain' }} />
        </div>

        <h1 style={{
          fontSize: 48, fontWeight: 900, lineHeight: 1.1,
          letterSpacing: '-2px', marginBottom: 20, maxWidth: 440,
        }}>
          Ethiopia's <span className="gradient-text">Payment</span>{' '}
          <span className="gradient-text">Future</span>
        </h1>
        <p style={{ fontSize: 17, color: 'var(--text-muted)', marginBottom: 48, maxWidth: 380, lineHeight: 1.7 }}>
          The secure wallet platform built for Ethiopian freelancers, creators, and remote workers.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {features.map(({ icon: Icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: 'var(--primary-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={16} color="var(--primary)" />
              </div>
              <span style={{ fontSize: 15, color: 'var(--text-muted)' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login form */}
      <div style={{
        width: '100%', maxWidth: 480,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '40px 40px',
        position: 'relative', zIndex: 1,
      }}>
        {/* Mobile logo */}
        <div className="hide-desktop" style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
          <img src={logoImg} alt="TRIP Logo" style={{ maxHeight: '76px', width: 'auto', objectFit: 'contain' }} />
        </div>

        <div className="glass-strong" style={{ padding: '40px 36px' }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.5px' }}>
            {mfaMode ? 'Two-Factor Auth' : 'Welcome back'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32 }}>
            {mfaMode ? 'Enter your 6-digit authenticator code' : 'Sign in to your TRIP account'}
          </p>

          {!mfaMode ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Email */}
              <div className="input-group">
                <label>Email</label>
                <div className="input-icon">
                  <Mail size={16} className="icon" />
                  <input
                    className="input"
                    type="email"
                    id="login-email"
                    placeholder="you@trip.et"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="input-group">
                <label>Password</label>
                <div className="input-icon" style={{ position: 'relative' }}>
                  <Lock size={16} className="icon" />
                  <input
                    className="input"
                    type={showPw ? 'text' : 'password'}
                    id="login-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{
                      position: 'absolute', right: 14, top: '50%',
                      transform: 'translateY(-50%)', color: 'var(--text-dim)',
                    }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="login-submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 8, height: 48, fontSize: 15 }}
                disabled={loading}
              >
                {loading ? <div className="spinner" /> : (
                  <><span>Sign In</span><ArrowRight size={16} /></>
                )}
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <input
                className="input"
                type="text"
                placeholder="000000"
                value={mfaCode}
                onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                style={{ textAlign: 'center', fontSize: 28, letterSpacing: 8, fontWeight: 700 }}
                maxLength={6}
              />
              <button className="btn btn-primary" style={{ width: '100%', height: 48 }} disabled={loading}>
                {loading ? <div className="spinner" /> : 'Verify'}
              </button>
              <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => setMfaMode(false)}>
                Back
              </button>
            </div>
          )}

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              Create one free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}