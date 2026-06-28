import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, CheckCircle, Plus, Snowflake, Unlock, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { walletApi } from '../api/wallet';
import WalletCard from '../components/WalletCard';

export default function WalletPage() {
  const qc = useQueryClient();
  const [showVPAModal, setShowVPAModal] = useState(false);
  const [newVPA, setNewVPA] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: wallets, isLoading } = useQuery({
    queryKey: ['wallets'], queryFn: walletApi.getWallets,
  });

  const wallet = wallets?.[0];

  const freezeMut = useMutation({
    mutationFn: () => walletApi.freezeWallet(wallet!.wallet_id),
    onSuccess: () => { toast.success('Wallet frozen'); qc.invalidateQueries({ queryKey: ['wallets'] }); },
    onError: () => toast.error('Failed to freeze wallet'),
  });

  const unfreezeMut = useMutation({
    mutationFn: () => walletApi.unfreezeWallet(wallet!.wallet_id),
    onSuccess: () => { toast.success('Wallet unfrozen'); qc.invalidateQueries({ queryKey: ['wallets'] }); },
    onError: () => toast.error('Failed to unfreeze wallet'),
  });

  const createVPAMut = useMutation({
    mutationFn: () => walletApi.createVPA(newVPA),
    onSuccess: () => {
      toast.success('VPA created!');
      setShowVPAModal(false);
      setNewVPA('');
      qc.invalidateQueries({ queryKey: ['wallets'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail ?? 'Failed to create VPA'),
  });

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="page-header">
        <h1 className="page-title">Wallet</h1>
        <p className="page-subtitle">Manage your wallet, VPAs, and security settings</p>
      </div>

      {/* Wallet Card */}
      <div style={{ marginBottom: 28 }}>
        {wallet ? <WalletCard wallet={wallet} isLoading={isLoading} /> :
          <div style={{ height: 220, borderRadius: 20 }} className="skeleton" />}
      </div>

      {/* VPAs */}
      <div className="glass" style={{ padding: '24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Virtual Payment Addresses</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              Share these to receive payments
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowVPAModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Add VPA
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {wallet?.vpas.map(vpa => (
            <div key={vpa.vpa_id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 12,
              border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: vpa.is_primary ? 'var(--primary)' : 'var(--text-dim)',
                }} />
                <span style={{ fontWeight: 600, color: 'var(--primary)', fontSize: 15 }}>{vpa.vpa_name}</span>
                {vpa.is_primary && (
                  <span className="badge badge-primary" style={{ fontSize: 10 }}>Primary</span>
                )}
              </div>
              <button onClick={() => copyText(vpa.vpa_name, vpa.vpa_id)}
                style={{ color: copiedId === vpa.vpa_id ? 'var(--success)' : 'var(--text-muted)', transition: 'var(--transition)' }}>
                {copiedId === vpa.vpa_id ? <CheckCircle size={16} /> : <Copy size={16} />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Wallet controls */}
      <div className="glass" style={{ padding: '24px' }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Wallet Security</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--surface-2)', borderRadius: 12 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Wallet Status</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              {wallet?.status === 'active' ? 'Your wallet is active and accepting payments' : '⚠️ Wallet is frozen — no transactions allowed'}
            </div>
          </div>
          {wallet?.status === 'active' ? (
            <button className="btn btn-danger btn-sm" onClick={() => freezeMut.mutate()} disabled={freezeMut.isPending}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Snowflake size={14} /> Freeze
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => unfreezeMut.mutate()} disabled={unfreezeMut.isPending}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Unlock size={14} /> Unfreeze
            </button>
          )}
        </div>
      </div>

      {/* Add VPA Modal */}
      {showVPAModal && (
        <div className="modal-overlay" onClick={() => setShowVPAModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: 18 }}>Add Virtual Payment Address</h3>
              <button onClick={() => setShowVPAModal(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div className="input-group" style={{ marginBottom: 20 }}>
              <label>VPA Prefix</label>
              <div style={{ display: 'flex', gap: 0 }}>
                <input className="input" type="text" placeholder="yourname"
                  value={newVPA} onChange={e => setNewVPA(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                  style={{ borderRadius: '8px 0 0 8px', borderRight: 'none' }} />
                <div style={{
                  background: 'var(--surface-3)', border: '1px solid var(--border)',
                  padding: '12px 14px', borderRadius: '0 8px 8px 0',
                  fontSize: 14, color: 'var(--primary)', fontWeight: 600,
                }}>
                  @trip.et
                </div>
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }}
              onClick={() => createVPAMut.mutate()} disabled={!newVPA || createVPAMut.isPending}>
              {createVPAMut.isPending ? <div className="spinner" /> : 'Create VPA'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
