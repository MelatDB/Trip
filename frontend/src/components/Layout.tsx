import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Wallet, Send, QrCode, History,
  ArrowDownToLine, ArrowUpToLine, Settings, LogOut, Menu, X, Shield
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import logoImg from '../Untitled.png';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/send', icon: Send, label: 'Send Money' },
  { to: '/receive', icon: QrCode, label: 'Receive' },
  { to: '/deposit', icon: ArrowUpToLine, label: 'Add Money' },
  { to: '/transactions', icon: History, label: 'Transactions' },
  { to: '/withdraw', icon: ArrowDownToLine, label: 'Withdraw' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'U';

  return (
    <div className="layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 99, backdropFilter: 'blur(4px)'
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`} style={{ zIndex: 100 }}>
        {/* Logo */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
          <img src={logoImg} alt="TRIP Logo" style={{ maxHeight: '84px', width: 'auto', objectFit: 'contain' }} />
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          {[
            ...navItems,
            ...(user?.is_admin ? [{ to: '/admin', icon: Shield, label: 'Admin Portal' }] : []),
          ].map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px', borderRadius: 10, marginBottom: 2,
                transition: 'var(--transition)', textDecoration: 'none',
                background: isActive ? 'var(--primary-dim)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: isActive ? 600 : 400,
                fontSize: 14,
                borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
              })}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 13, color: '#0A0F1E', flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.full_name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 12px', borderRadius: 8, background: 'var(--danger-dim)',
              color: 'var(--danger)', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 500, transition: 'var(--transition)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--danger)', e.currentTarget.style.color = 'white')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--danger-dim)', e.currentTarget.style.color = 'var(--danger)')}
          >
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        {/* Mobile header */}
        <div className="hide-desktop" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 20, padding: '0 0 16px', borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src={logoImg} alt="TRIP Logo" style={{ maxHeight: '60px', width: 'auto', objectFit: 'contain' }} />
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ color: 'var(--text)' }}>
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--surface)', borderTop: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-around', padding: '8px 0 12px',
        zIndex: 50,
      }}>
        {navItems.slice(0, 5).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              fontSize: 10, fontWeight: isActive ? 600 : 400, textDecoration: 'none',
              padding: '4px 8px',
            })}
          >
            <Icon size={20} />
            {label.split(' ')[0]}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
