import { ArrowUpRight, ArrowDownLeft, Building2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Transaction } from '../types';

interface TransactionItemProps {
  tx: Transaction;
  userVPAs?: string[];
}

export default function TransactionItem({ tx, userVPAs = [] }: TransactionItemProps) {
  const isSent = userVPAs.includes(tx.sender_vpa ?? '');
  const isWithdrawal = tx.tx_type === 'withdrawal';

  const icon = isWithdrawal ? Building2 : isSent ? ArrowUpRight : ArrowDownLeft;
  const Icon = icon;
  const amountColor = isSent || isWithdrawal ? 'var(--danger)' : 'var(--success)';
  const iconBg = isSent || isWithdrawal ? 'var(--danger-dim)' : 'var(--success-dim)';
  const iconColor = isSent || isWithdrawal ? 'var(--danger)' : 'var(--success)';
  const prefix = isSent || isWithdrawal ? '−' : '+';
  const counterparty = isSent ? tx.receiver_vpa : isWithdrawal ? 'Bank Settlement' : tx.sender_vpa;

  const statusColors: Record<string, { bg: string; color: string }> = {
    completed: { bg: 'var(--success-dim)', color: 'var(--success)' },
    pending: { bg: 'var(--warning-dim)', color: 'var(--warning)' },
    failed: { bg: 'var(--danger-dim)', color: 'var(--danger)' },
    reversed: { bg: 'rgba(156,163,175,0.1)', color: 'var(--text-muted)' },
  };

  const statusStyle = statusColors[tx.status] ?? statusColors.pending;
  const timeAgo = formatDistanceToNow(new Date(tx.created_at), { addSuffix: true });
  const amount = new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2 }).format(tx.amount);

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px', borderRadius: 12, background: 'var(--surface)',
        border: '1px solid var(--border)', transition: 'var(--transition)',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'var(--surface-2)';
        e.currentTarget.style.borderColor = 'var(--border-primary)';
        e.currentTarget.style.transform = 'translateX(2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'var(--surface)';
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      {/* Icon */}
      <div style={{
        width: 42, height: 42, borderRadius: 12, background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={18} color={iconColor} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>
          {tx.description || (isWithdrawal ? 'Bank Withdrawal' : isSent ? 'Sent' : 'Received')}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>
            {counterparty ?? tx.reference}
          </span>
          <span>•</span>
          <Clock size={10} style={{ flexShrink: 0 }} />
          <span style={{ flexShrink: 0 }}>{timeAgo}</span>
        </div>
      </div>

      {/* Amount + status */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: amountColor }}>
          {prefix}{amount} <span style={{ fontSize: 11, fontWeight: 500 }}>{tx.currency}</span>
        </div>
        <span style={{
          ...statusStyle,
          padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
          display: 'inline-block', marginTop: 4,
        }}>
          {tx.status}
        </span>
      </div>
    </div>
  );
}
