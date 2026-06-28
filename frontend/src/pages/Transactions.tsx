import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, Download, Search, Filter } from 'lucide-react';
import { walletApi } from '../api/wallet';
import { paymentsApi } from '../api/payments';
import TransactionItem from '../components/TransactionItem';

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Transfers', value: 'transfer' },
  { label: 'Withdrawals', value: 'withdrawal' },
];

export default function Transactions() {
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: wallets } = useQuery({ queryKey: ['wallets'], queryFn: walletApi.getWallets });
  const allVPAs = wallets?.flatMap(w => w.vpas.map(v => v.vpa_name)) ?? [];

  const { data: txList, isLoading } = useQuery({
    queryKey: ['transactions', page, 20, filter],
    queryFn: () => paymentsApi.getTransactions(page, 20, filter || undefined),
  });

  const txs = (txList?.transactions ?? []).filter(tx => {
    if (!search) return true;
    const s = search.toLowerCase();
    return tx.reference.toLowerCase().includes(s)
      || tx.sender_vpa?.toLowerCase().includes(s)
      || tx.receiver_vpa?.toLowerCase().includes(s)
      || tx.description?.toLowerCase().includes(s);
  });

  const total = txList?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  const exportCSV = () => {
    const rows = [
      ['Reference', 'Type', 'Amount', 'Fee', 'Currency', 'Status', 'From', 'To', 'Date'],
      ...txs.map(t => [
        t.reference, t.tx_type, t.amount, t.fee, t.currency, t.status,
        t.sender_vpa ?? '', t.receiver_vpa ?? '', t.created_at,
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'trip-transactions.csv'; a.click();
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">{total} total transactions</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={exportCSV}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="input-icon" style={{ flex: 1, minWidth: 200 }}>
          <Search size={16} className="icon" />
          <input className="input" type="text" placeholder="Search by reference, VPA..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {FILTERS.map(({ label, value }) => (
            <button key={label}
              onClick={() => { setFilter(value); setPage(1); }}
              style={{
                padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: filter === value ? 'var(--primary)' : 'var(--surface-2)',
                color: filter === value ? '#0A0F1E' : 'var(--text-muted)',
                border: `1px solid ${filter === value ? 'var(--primary)' : 'var(--border)'}`,
                cursor: 'pointer', transition: 'var(--transition)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction list */}
      <div className="glass" style={{ padding: '20px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />
            ))}
          </div>
        ) : txs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <History size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>No transactions found</div>
            <div style={{ fontSize: 14 }}>
              {search || filter ? 'Try adjusting your filters' : 'Make your first transfer to get started'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {txs.map(tx => (
              <TransactionItem key={tx.tx_id} tx={tx} userVPAs={allVPAs} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            ← Prev
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                style={{
                  width: 32, height: 32, borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: p === page ? 'var(--primary)' : 'var(--surface-2)',
                  color: p === page ? '#0A0F1E' : 'var(--text-muted)',
                  border: 'none', cursor: 'pointer', transition: 'var(--transition)',
                }}>
                {p}
              </button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
