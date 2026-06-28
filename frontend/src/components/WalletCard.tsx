import { useState } from 'react';
import { Eye, EyeOff, Send, QrCode, ArrowDownToLine, Copy, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Wallet } from '../types';

interface WalletCardProps {
  wallet: Wallet;
  isLoading?: boolean;
}

export default function WalletCard({ wallet, isLoading = false }: WalletCardProps) {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const primaryVPA = wallet.vpas.find((v) => v.is_primary) ?? wallet.vpas[0];

  const formatBalance = (val: number) =>
    new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2 }).format(val);

  const copyVPA = () => {
    if (primaryVPA?.vpa_name) {
      navigator.clipboard.writeText(primaryVPA.vpa_name);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        borderRadius: 12, overflow: 'hidden', height: 220,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}>
        <div className="skeleton" style={{ height: '100%', borderRadius: 12 }} />
      </div>
    );
  }

  return (
    <div style={{
      borderRadius: 12,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      padding: '28px 28px 24px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: 'var(--shadow)',
      animation: 'fadeIn 0.5s ease',
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 }}>
            Available Balance
          </div>
          <div style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 500, marginTop: 2 }}>
            {wallet.currency} Wallet
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            padding: '4px 10px', borderRadius: 20,
            background: wallet.status === 'active' ? 'var(--success-dim)' : 'var(--danger-dim)',
            color: wallet.status === 'active' ? 'var(--success)' : 'var(--danger)',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.5px',
          }}>
            {wallet.status.toUpperCase()}
          </span>
          <button onClick={() => setBalanceVisible(!balanceVisible)}
            style={{ color: 'var(--text-muted)', transition: 'var(--transition)' }}
            title={balanceVisible ? 'Hide balance' : 'Show balance'}
          >
            {balanceVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Balance */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          fontSize: 44, fontWeight: 800, letterSpacing: '-2px',
          color: 'var(--text)',
          lineHeight: 1, transition: 'var(--transition)',
        }}>
          {balanceVisible ? formatBalance(wallet.balance) : '••••••'}
        </div>
        <div style={{ fontSize: 18, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>
          {wallet.currency}
        </div>
      </div>

      {/* VPA + copy */}
      {primaryVPA && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <div style={{
            background: 'var(--primary-dim)', border: '1px solid var(--border-primary)',
            borderRadius: 8, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>
              {primaryVPA.vpa_name}
            </span>
            <button onClick={copyVPA} style={{ color: copied ? 'var(--success)' : 'var(--text-muted)', transition: 'var(--transition)' }}>
              {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { label: 'Send', icon: Send, path: '/send', color: 'var(--primary)', bg: 'var(--primary-dim)' },
          { label: 'Receive', icon: QrCode, path: '/receive', color: 'var(--accent)', bg: 'var(--accent-dim)' },
          { label: 'Withdraw', icon: ArrowDownToLine, path: '/withdraw', color: 'var(--text-muted)', bg: 'var(--surface-2)' },
        ].map(({ label, icon: Icon, path, color, bg }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 6, padding: '10px', borderRadius: 12, background: bg,
              border: '1px solid var(--border)', color, cursor: 'pointer',
              transition: 'var(--transition)', fontSize: 12, fontWeight: 600,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
