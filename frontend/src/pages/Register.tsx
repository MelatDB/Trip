import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, Eye, EyeOff, Shield, CheckCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import logoImg from '../Untitled.png';

const steps = ['Personal Info', 'Password', 'Payment ID', 'Welcome'];

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /\d/.test(password) },
    { label: 'Special char', ok: /[^a-zA-Z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['var(--danger)', 'var(--warning)', 'var(--warning)', 'var(--success)', 'var(--primary)'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i < score ? colors[score] : 'var(--surface-3)',
            transition: 'var(--transition)',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {checks.map(({ label, ok }) => (
          <span key={label} style={{
            fontSize: 11, color: ok ? 'var(--success)' : 'var(--text-dim)',
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            <CheckCircle size={10} /> {label}
          </span>
        ))}
      </div>
      {password && <div style={{ fontSize: 12, color: colors[score], fontWeight: 600, marginTop: 4 }}>{labels[score]}</div>}
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [vpaPrefix, setVpaPrefix] = useState('');

  const suggestedVPA = fullName
    ? fullName.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '')
    : '';

  const handleNext = () => {
    if (step === 0) {
      if (!fullName.trim() || !email.trim()) return toast.error('Name and email are required');
      setVpaPrefix(suggestedVPA);
      setStep(1);
    } else if (step === 1) {
      if (!password) return toast.error('Password is required');
      if (password !== confirmPw) return toast.error("Passwords don't match");
      if (password.length < 8) return toast.error('Password must be at least 8 characters');
      setStep(2);
    } else if (step === 2) {
      handleRegister();
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      await authApi.register({
        full_name: fullName,
        email,
        password,
        phone: phone || undefined,
      });
      const tokens = await authApi.login(email, password);
      localStorage.setItem('trip_access_token', tokens.access_token);
      const user = await authApi.getMe();
      setAuth(user, tokens.access_token, tokens.refresh_token);
      setStep(3);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ marginBottom: 12 }}>
            <img src={logoImg} alt="TRIP Logo" style={{ maxHeight: '110px', width: 'auto', objectFit: 'contain', display: 'inline-block' }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px' }}>Create your TRIP account</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Join thousands of Ethiopian freelancers</div>
        </div>

        {/* Step indicator */}
        {step < 3 && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
            {steps.slice(0, 3).map((label, i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', fontSize: 13, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: i < step ? 'var(--success)' : i === step ? 'var(--primary)' : 'var(--surface-2)',
                    color: i <= step ? '#0A0F1E' : 'var(--text-muted)',
                    border: i === step ? '2px solid var(--primary)' : '2px solid transparent',
                    transition: 'var(--transition)',
                  }}>
                    {i < step ? <CheckCircle size={14} /> : i + 1}
                  </div>
                  <span style={{ fontSize: 10, color: i === step ? 'var(--primary)' : 'var(--text-dim)', whiteSpace: 'nowrap' }}>{label}</span>
                </div>
                {i < 2 && <div style={{ flex: 1, height: 2, background: i < step ? 'var(--success)' : 'var(--border)', margin: '0 4px', marginBottom: 16 }} />}
              </div>
            ))}
          </div>
        )}

        <div className="glass-strong" style={{ padding: '36px 32px' }}>
          {/* Step 0: Personal info */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, animation: 'slideUp 0.3s ease' }}>
              <div className="input-group">
                <label>Full Name</label>
                <div className="input-icon">
                  <User size={16} className="icon" />
                  <input id="reg-name" className="input" type="text" placeholder="Yohannes Bekele"
                    value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>
              </div>
              <div className="input-group">
                <label>Email Address</label>
                <div className="input-icon">
                  <Mail size={16} className="icon" />
                  <input id="reg-email" className="input" type="email" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="input-group">
                <label>Phone Number <span style={{ color: 'var(--text-dim)' }}>(optional)</span></label>
                <div className="input-icon">
                  <Phone size={16} className="icon" />
                  <input id="reg-phone" className="input" type="tel" placeholder="+251911234567"
                    value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Password */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, animation: 'slideUp 0.3s ease' }}>
              <div className="input-group">
                <label>Create Password</label>
                <div className="input-icon" style={{ position: 'relative' }}>
                  <Lock size={16} className="icon" />
                  <input id="reg-password" className="input" type={showPw ? 'text' : 'password'}
                    placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)}
                    style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>
              <div className="input-group">
                <label>Confirm Password</label>
                <div className="input-icon">
                  <Lock size={16} className="icon" />
                  <input id="reg-confirm" className="input" type="password" placeholder="Re-enter password"
                    value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
                </div>
                {confirmPw && (
                  <div style={{ fontSize: 12, color: confirmPw === password ? 'var(--success)' : 'var(--danger)', marginTop: 4 }}>
                    {confirmPw === password ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: VPA preview */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'slideUp 0.3s ease' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48 }}>🎯</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginTop: 8 }}>Your Payment Identity</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
                  Clients will pay you using this Virtual Payment Address
                </p>
              </div>
              <div style={{
                background: 'var(--primary-dim)', border: '1px solid var(--border-primary)',
                borderRadius: 12, padding: '20px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.5px' }}>
                  {vpaPrefix || suggestedVPA}@trip.et
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Your Virtual Payment Address</div>
              </div>
              <div className="input-group">
                <label>Customize (optional)</label>
                <div style={{ display: 'flex', gap: 0 }}>
                  <input className="input" type="text" placeholder={suggestedVPA}
                    value={vpaPrefix} onChange={e => setVpaPrefix(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                    style={{ borderRadius: '8px 0 0 8px', borderRight: 'none' }} />
                  <div style={{
                    background: 'var(--surface-3)', border: '1px solid var(--border)',
                    padding: '12px 14px', borderRadius: '0 8px 8px 0',
                    fontSize: 14, color: 'var(--primary)', fontWeight: 600, whiteSpace: 'nowrap',
                  }}>
                    @trip.et
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div style={{ textAlign: 'center', animation: 'slideUp 0.4s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <div className="success-check" style={{ margin: '0 auto' }}>
                  <CheckCircle size={36} color="var(--success)" />
                </div>
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>You're all set! 🎉</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: 15 }}>
                Your TRIP wallet is ready. Start receiving payments today!
              </p>
              <button className="btn btn-primary btn-lg" style={{ width: '100%' }}
                onClick={() => navigate('/dashboard')}>
                Go to Dashboard <ArrowRight size={18} />
              </button>
            </div>
          )}

          {step < 3 && (
            <button
              id="reg-next"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 28, height: 48, fontSize: 15 }}
              onClick={handleNext}
              disabled={loading}
            >
              {loading ? <div className="spinner" /> : (
                <>{step === 2 ? 'Create Account' : 'Continue'} <ArrowRight size={16} /></>
              )}
            </button>
          )}

          {step < 3 && (
            <div style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}