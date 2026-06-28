import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Send, QrCode, ArrowDownToLine, TrendingUp, TrendingDown, Activity, Wallet } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { format, subDays } from 'date-fns';
import { walletApi } from '../api/wallet';
import { paymentsApi } from '../api/payments';
import { useAuthStore } from '../store/authStore';
import { useWalletStore } from '../store/walletStore';
import WalletCard from '../components/WalletCard';
import StatsCard from '../components/StatsCard';
import TransactionItem from '../components/TransactionItem';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { setWallets } = useWalletStore();
  const navigate = useNavigate();

  const { data: wallets, isLoading: walletsLoading } = useQuery({
    queryKey: ['wallets'],
    queryFn: walletApi.getWallets,
  });

  const { data: txList } = useQuery({
    queryKey: ['transactions', 1, 20],
    queryFn: () => paymentsApi.getTransactions(1, 20),
  });

  useEffect(() => {
    if (wallets) setWallets(wallets);
  }, [wallets, setWallets]);

  const wallet = wallets?.[0];
  const txs = txList?.transactions ?? [];
  const allVPAs = wallet?.vpas.map(v => v.vpa_name) ?? [];

  // Stats
  const received = txs.filter(t => t.tx_type === 'transfer' && allVPAs.includes(t.receiver_vpa ?? ''))
    .reduce((s, t) => s + Number(t.amount), 0);
  const sent = txs.filter(t => t.tx_type === 'transfer' && allVPAs.includes(t.sender_vpa ?? ''))
    .reduce((s, t) => s + Number(t.amount), 0);

  // Chart data — last 7 days
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayStr = format(date, 'yyyy-MM-dd');
    const dayTxs = txs.filter(t => t.created_at.startsWith(dayStr));
    return {
      day: format(date, 'EEE'),
      received: dayTxs.filter(t => allVPAs.includes(t.receiver_vpa ?? '')).reduce((s, t) => s + Number(t.amount), 0),
      sent: dayTxs.filter(t => allVPAs.includes(t.sender_vpa ?? '')).reduce((s, t) => s + Number(t.amount), 0),
    };
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.full_name?.split(' ')[0] ?? 'there';

  const fmt = (n: number) => new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2 }).format(n);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10,
        padding: '10px 14px', fontSize: 13,
      }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} style={{ color: p.color }}>
            {p.name}: {fmt(p.value)} USD
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
            {greeting} 👋
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
            {firstName}
          </h1>
        </div>
        <div style={{
          padding: '8px 14px', borderRadius: 10,
          background: 'var(--success-dim)', border: '1px solid rgba(16,185,129,0.2)',
          fontSize: 12, color: 'var(--success)', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', animation: 'pulse-glow 2s infinite' }} />
          System Active
        </div>
      </div>

      {/* Wallet card */}
      <div style={{ marginBottom: 28 }}>
        {wallet ? (
          <WalletCard wallet={wallet} isLoading={walletsLoading} />
        ) : (
          <div style={{ height: 220, borderRadius: 20, background: 'var(--surface)' }} className="skeleton" />
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatsCard
          title="Total Received"
          value={`${fmt(received)} USD`}
          subtitle="All time"
          icon={<TrendingUp size={18} />}
          trend="up"
          trendPercent="+12%"
          color="var(--success)"
        />
        <StatsCard
          title="Total Sent"
          value={`${fmt(sent)} USD`}
          subtitle="All time"
          icon={<TrendingDown size={18} />}
          color="var(--danger)"
        />
        <StatsCard
          title="Transactions"
          value={String(txs.length)}
          subtitle="Total recorded"
          icon={<Activity size={18} />}
          color="var(--accent)"
        />
        <StatsCard
          title="Balance"
          value={wallet ? `${fmt(wallet.balance)} USD` : '—'}
          subtitle={wallet?.currency ?? ''}
          icon={<Wallet size={18} />}
          color="var(--primary)"
        />
      </div>

      {/* Chart + Recent txns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        {/* Chart */}
        <div className="glass" style={{ padding: '24px', gridColumn: window.innerWidth < 900 ? '1/-1' : 'auto' }}>
          <div style={{ fontWeight: 700, marginBottom: 20, fontSize: 16 }}>
            7-Day Activity
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="received" name="Received" stroke="var(--primary)" strokeWidth={2} fill="none" />
              <Area type="monotone" dataKey="sent" name="Sent" stroke="var(--danger)" strokeWidth={2} fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Actions */}
        <div className="glass" style={{ padding: '24px' }}>
          <div style={{ fontWeight: 700, marginBottom: 20, fontSize: 16 }}>Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Send Money', desc: 'Transfer to any VPA', icon: Send, path: '/send', color: 'var(--primary)' },
              { label: 'Receive', desc: 'Share your payment QR', icon: QrCode, path: '/receive', color: 'var(--accent)' },
              { label: 'Withdraw', desc: 'Transfer to your bank', icon: ArrowDownToLine, path: '/withdraw', color: 'var(--text-muted)' },
            ].map(({ label, desc, icon: Icon, path, color }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                  background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12,
                  cursor: 'pointer', transition: 'var(--transition)', textAlign: 'left',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = 'var(--surface-3)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface-2)'; }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 10, background: `${color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={20} color={color} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="glass" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Recent Transactions</div>
          <Link to="/transactions" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>
            View All →
          </Link>
        </div>
        {txs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Activity size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
            <div>No transactions yet</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {txs.slice(0, 5).map(tx => (
              <TransactionItem key={tx.tx_id} tx={tx} userVPAs={allVPAs} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}