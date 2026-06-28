import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { User, Shield, Bell, Info, Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';

type Tab = 'profile' | 'security' | 'notifications' | 'about';

export default function Settings() {
  const { user, setUser } = useAuthStore();
  const [tab, setTab] = useState<Tab>('profile');
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [mfaSetup, setMfaSetup] = useState<{ secret: string; qr_uri: string; backup_codes: string[] } | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [notifToggles, setNotifToggles] = useState({ email: true, transfers: true, security: true });

  const updateProfileMut = useMutation({
    mutationFn: () => authApi.updateProfile({ full_name: fullName, phone }),
    onSuccess: (updatedUser) => { setUser(updatedUser); toast.success('Profile updated!'); },
    onError: () => toast.error('Failed to update profile'),
  });

  const changePwMut = useMutation({
    mutationFn: () => authApi.changePassword(currentPw, newPw),
    onSuccess: () => { toast.success('Password changed!'); setCurrentPw(''); setNewPw(''); setConfirmPw(''); },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Failed to change password'),
  });

  const setupMFAMut = useMutation({
    mutationFn: authApi.setupMFA,
    onSuccess: (data) => setMfaSetup(data),
    onError: () => toast.error('Failed to setup MFA'),
  });

  const verifyMFAMut = useMutation({
    mutationFn: () => authApi.verifyMFA(mfaCode),
    onSuccess: () => { toast.success('MFA enabled successfully!'); setMfaSetup(null); setMfaCode(''); },
    onError: () => toast.error('Invalid MFA code'),
  });

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? 'U';

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile', icon: <User size={16} /> },
    { id: 'security', label: 'Security', icon: <Shield size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
    { id: 'about', label: 'About', icon: <Info size={16} /> },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.4s ease', maxWidth: 640, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--surface)', borderRadius: 12, padding: 6, border: '1px solid var(--border)' }}>
        {tabs.map(({ id, label, icon }) => (
          <button key={id} onClick={() => setTab(id)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: tab === id ? 'var(--primary)' : 'transparent',
              color: tab === id ? '#0A0F1E' : 'var(--text-muted)',
              border: 'none', cursor: 'pointer', transition: 'var(--transition)',
            }}>
            {icon}{label}
          </button>
        ))}
      </div>

      {/* Profile */}
      {tab === 'profile' && (
        <div className="glass" style={{ padding: '28px', animation: 'slideUp 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 22, color: '#0A0F1E',
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{user?.full_name}</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{user?.email}</div>
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: user?.kyc_status === 'verified' ? 'var(--success-dim)' : 'var(--warning-dim)',
                color: user?.kyc_status === 'verified' ? 'var(--success)' : 'var(--warning)',
                display: 'inline-block', marginTop: 6,
              }}>
                KYC: {user?.kyc_status?.toUpperCase()}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label>Full Name</label>
              <input className="input" id="settings-name" value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Phone Number</label>
              <input className="input" id="settings-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+251..." />
            </div>
            <div className="input-group">
              <label>Email</label>
              <input className="input" value={user?.email ?? ''} disabled style={{ opacity: 0.6 }} />
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Email cannot be changed</span>
            </div>
            <button className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 4 }}
              onClick={() => updateProfileMut.mutate()} disabled={updateProfileMut.isPending}>
              {updateProfileMut.isPending ? <div className="spinner" /> : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Security */}
      {tab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'slideUp 0.3s ease' }}>
          {/* Change password */}
          <div className="glass" style={{ padding: '24px' }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={18} /> Change Password
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="input-group">
                <label>Current Password</label>
                <div className="input-icon" style={{ position: 'relative' }}>
                  <Lock size={16} className="icon" />
                  <input className="input" type={showPw ? 'text' : 'password'} value={currentPw}
                    onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="input-group">
                <label>New Password</label>
                <input className="input" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min. 8 characters" />
              </div>
              <div className="input-group">
                <label>Confirm New Password</label>
                <input className="input" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Re-enter new password" />
              </div>
              <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }}
                onClick={() => changePwMut.mutate()} disabled={!currentPw || !newPw || newPw !== confirmPw || changePwMut.isPending}>
                {changePwMut.isPending ? <div className="spinner" /> : 'Update Password'}
              </button>
            </div>
          </div>

          {/* MFA */}
          <div className="glass" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Shield size={18} /> Two-Factor Authentication
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                  {user?.mfa_enabled ? '✅ MFA is enabled on your account' : 'Add an extra layer of security'}
                </div>
              </div>
              {!user?.mfa_enabled && (
                <button className="btn btn-primary btn-sm" onClick={() => setupMFAMut.mutate()} disabled={setupMFAMut.isPending}>
                  {setupMFAMut.isPending ? <div className="spinner" /> : 'Enable MFA'}
                </button>
              )}
            </div>

            {mfaSetup && !user?.mfa_enabled && (
              <div style={{ animation: 'slideUp 0.3s ease' }}>
                <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                  Scan this QR code with Google Authenticator or Authy, then enter the 6-digit code below.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <div style={{ background: 'white', padding: 16, borderRadius: 12 }}>
                    <QRCodeSVG value={mfaSetup.qr_uri} size={160} />
                  </div>
                </div>
                <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: 12, marginBottom: 16, fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all', color: 'var(--text-muted)' }}>
                  Secret: {mfaSetup.secret}
                </div>
                <div className="input-group" style={{ marginBottom: 12 }}>
                  <label>Enter 6-digit code to verify</label>
                  <input className="input" type="text" maxLength={6} placeholder="000000"
                    value={mfaCode} onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    style={{ textAlign: 'center', letterSpacing: 8, fontSize: 24, fontWeight: 700 }} />
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }}
                  onClick={() => verifyMFAMut.mutate()} disabled={mfaCode.length !== 6 || verifyMFAMut.isPending}>
                  {verifyMFAMut.isPending ? <div className="spinner" /> : 'Verify & Enable MFA'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notifications */}
      {tab === 'notifications' && (
        <div className="glass" style={{ padding: '24px', animation: 'slideUp 0.3s ease' }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Notification Preferences</div>
          {[
            { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
            { key: 'transfers', label: 'Transfer Alerts', desc: 'Get notified on sends and receives' },
            { key: 'security', label: 'Security Alerts', desc: 'Login and security-related alerts' },
          ].map(({ key, label, desc }) => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 0', borderBottom: '1px solid var(--border)',
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</div>
              </div>
              <div
                onClick={() => setNotifToggles(p => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                style={{
                  width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
                  background: notifToggles[key as keyof typeof notifToggles] ? 'var(--primary)' : 'var(--surface-3)',
                  position: 'relative', transition: 'var(--transition)',
                }}
              >
                <div style={{
                  position: 'absolute', top: 3,
                  left: notifToggles[key as keyof typeof notifToggles] ? 'calc(100% - 21px)' : 3,
                  width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'var(--transition)',
                }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* About */}
      {tab === 'about' && (
        <div className="glass" style={{ padding: '28px', animation: 'slideUp 0.3s ease', textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 18, margin: '0 auto 16px',
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-primary)',
          }}>
            <Shield size={34} color="#0A0F1E" />
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>TRIP</h3>
          <div style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>Trusted Remote Income Platform</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Version 1.0.0 • MVP</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.8 }}>
            TRIP is a wallet-based digital payment infrastructure for Ethiopian freelancers.
            Receive, manage, and transfer income from clients worldwide using your Virtual Payment Address.
          </div>
          <div style={{ height: 1, background: 'var(--border)', margin: '24px 0' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['Terms of Service', 'Privacy Policy', 'Help & Support'].map(item => (
              <button key={item} style={{ color: 'var(--primary)', fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                {item}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 20, fontSize: 11, color: 'var(--text-dim)' }}>
            © 2026 TRIP. All rights reserved.
          </div>
        </div>
      )}
    </div>
  );
}
