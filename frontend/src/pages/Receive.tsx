import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Copy, CheckCircle, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { walletApi } from '../api/wallet';
import { paymentsApi } from '../api/payments';
import TransactionItem from '../components/TransactionItem';

export default function Receive() {
  const [copiedVPA, setCopiedVPA] = useState<string | null>(null);
  const [selectedVPAIdx, setSelectedVPAIdx] = useState(0);

  const { data: wallets } = useQuery({ queryKey: ['wallets'], queryFn: walletApi.getWallets });
  const { data: txList } = useQuery({ queryKey: ['transactions', 1, 5], queryFn: () => paymentsApi.getTransactions(1, 5) });

  const wallet = wallets?.[0];
  const vpas = wallet?.vpas ?? [];
  const selectedVPA = vpas[selectedVPAIdx];
  const allVPAs = vpas.map(v => v.vpa_name);

  const incomingTxs = (txList?.transactions ?? [])
    .filter(t => allVPAs.includes(t.receiver_vpa ?? '') && t.tx_type === 'transfer')
    .slice(0, 5);

  const copyVPA = (vpa: string) => {
    navigator.clipboard.writeText(vpa);
    setCopiedVPA(vpa);
    toast.success('VPA copied!');
    setTimeout(() => setCopiedVPA(null), 2000);
  };

  const shareVPA = async (vpa: string) => {
    if (navigator.share) {
      await navigator.share({ title: 'Pay me via TRIP', text: `Send money to my TRIP wallet: ${vpa}` });
    } else {
      copyVPA(vpa);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease', maxWidth: 560, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Receive Money</h1>
        <p className="page-subtitle">Share your VPA or QR code to get paid</p>
      </div>

      {/* VPA selector tabs */}
      {vpas.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto' }}>
          {vpas.map((vpa, i) => (
            <button key={vpa.vpa_id}
              onClick={() => setSelectedVPAIdx(i)}
              style={{
                padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                background: selectedVPAIdx === i ? 'var(--primary)' : 'var(--surface-2)',
                color: selectedVPAIdx === i ? '#0A0F1E' : 'var(--text-muted)',
                border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'var(--transition)',
              }}
            >
              {vpa.vpa_name}
            </button>
          ))}
        </div>
      )}

      {selectedVPA && (
        <div className="glass" style={{ padding: '32px', textAlign: 'center', marginBottom: 24 }}>
          {/* QR Code */}
          <div style={{
            display: 'inline-flex', padding: '20px', background: 'white',
            borderRadius: 16, marginBottom: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          }}>
            <QRCodeSVG
              value={`trip:pay/${selectedVPA.vpa_name}`}
              size={200}
              bgColor="#ffffff"
              fgColor="#0A0F1E"
              level="H"
            />
          </div>

          {/* VPA display */}
          <div style={{
            background: 'var(--primary-dim)', border: '1px solid var(--border-primary)',
            borderRadius: 12, padding: '16px 20px', marginBottom: 20,
          }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '1px', fontWeight: 600, marginBottom: 6 }}>
              YOUR VIRTUAL PAYMENT ADDRESS
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.5px' }}>
              {selectedVPA.vpa_name}
            </div>
            {selectedVPA.is_primary && (
              <span className="badge badge-primary" style={{ marginTop: 8, fontSize: 10 }}>Primary</span>
            )}
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            Share your VPA with clients to receive payments directly to your TRIP wallet
          </p>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-primary" style={{ flex: 1 }}
              onClick={() => copyVPA(selectedVPA.vpa_name)}>
              {copiedVPA === selectedVPA.vpa_name ? <CheckCircle size={16} /> : <Copy size={16} />}
              {copiedVPA === selectedVPA.vpa_name ? 'Copied!' : 'Copy VPA'}
            </button>
            <button className="btn btn-secondary" style={{ flex: 1 }}
              onClick={() => shareVPA(selectedVPA.vpa_name)}>
              <Share2 size={16} /> Share
            </button>
          </div>
        </div>
      )}

      {/* Recent incoming */}
      {incomingTxs.length > 0 && (
        <div className="glass" style={{ padding: '24px' }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Recent Incoming Payments</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {incomingTxs.map(tx => (
              <TransactionItem key={tx.tx_id} tx={tx} userVPAs={allVPAs} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
