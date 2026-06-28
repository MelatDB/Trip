import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserCheck, ArrowRight, CheckCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { walletApi } from '../api/wallet';
import { paymentsApi } from '../api/payments';
import type { VPAResolveResponse, FeeInfo } from '../types';

type Step = 'recipient' | 'amount' | 'confirm' | 'success';

export default function SendMoney() {
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>('recipient');
  const [recipient, setRecipient] = useState('');
  const [resolved, setResolved] = useState<VPAResolveResponse | null>(null);
  const [resolving, setResolving] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [successRef, setSuccessRef] = useState('');

  const { data: fees } = useQuery<FeeInfo>({ queryKey: ['fees'], queryFn: paymentsApi.getFees });
  const { data: wallets } = useQuery({ queryKey: ['wallets'], queryFn: walletApi.getWallets });

  const balance = wallets?.[0]?.balance ?? 0;
  const feeAmt = fees ? (Number(amount) * fees.transfer_fee_percent) / 100 : 0;
  const total = Number(amount) + feeAmt;
  const fmt = (n: number) => new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2 }).format(n);

  const resolveVPA = async () => {
    if (!recipient) return;
    setResolving(true);
    try {
      const res = await walletApi.resolveVPA(recipient);
      setResolved(res);
    } catch {
      setResolved(null);
    } finally {
      setResolving(false);
    }
  };

  const transferMut = useMutation({
    mutationFn: () => paymentsApi.transfer({ recipient, amount: Number(amount), currency: 'USD', description }),
    onSuccess: (res) => {
      setSuccessRef(res.reference);
      setStep('success');
      qc.invalidateQueries({ queryKey: ['wallets'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transfer successful!');
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail ?? 'Transfer failed'),
  });

  const reset = () => {
    setStep('recipient'); setRecipient(''); setResolved(null);
    setAmount(''); setDescription(''); setSuccessRef('');
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease', maxWidth: 560, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Send Money</h1>
        <p className="page-subtitle">Transfer funds to any TRIP address, email, or phone</p>
      </div>

      {/* Progress */}
      {step !== 'success' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {(['recipient', 'amount', 'confirm'] as Step[]).map((s, i) => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: ['recipient', 'amount', 'confirm', 'success'].indexOf(step) > i
                ? 'var(--success)' : s === step ? 'var(--primary)' : 'var(--surface-3)',
              transition: 'var(--transition)',
            }} />
          ))}
        </div>
      )}

      <div className="glass" style={{ padding: '32px 28px' }}>
        {/* Step 1: Recipient */}
        {step === 'recipient' && (
          <div style={{ animation: 'slideUp 0.3s ease' }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Find Recipient</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
              Enter a VPA (e.g. name@trip.et), email, or phone number
            </p>
            <div className="input-group" style={{ marginBottom: 16 }}>
              <label>Recipient</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="input-icon" style={{ flex: 1 }}>
                  <Search size={16} className="icon" />
                  <input
                    className="input"
                    id="send-recipient"
                    type="text"
                    placeholder="yeebyo@trip.et"
                    value={recipient}
                    onChange={e => { setRecipient(e.target.value); setResolved(null); }}
                    onKeyDown={e => e.key === 'Enter' && resolveVPA()}
                  />
                </div>
                <button className="btn btn-secondary" onClick={resolveVPA} disabled={!recipient || resolving}>
                  {resolving ? <div className="spinner" /> : 'Find'}
                </button>
              </div>
            </div>

            {resolved && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '16px',
                background: 'var(--success-dim)', border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 12, marginBottom: 20, animation: 'fadeIn 0.3s ease',
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 16, color: '#0A0F1E',
                }}>
                  {resolved.user_full_name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{resolved.user_full_name}</div>
                  <div style={{ fontSize: 13, color: 'var(--success)' }}>{resolved.vpa_name}</div>
                </div>
                <UserCheck size={20} color="var(--success)" style={{ marginLeft: 'auto' }} />
              </div>
            )}

            <button className="btn btn-primary" style={{ width: '100%', height: 48 }}
              onClick={() => setStep('amount')} disabled={!resolved}>
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 2: Amount */}
        {step === 'amount' && (
          <div style={{ animation: 'slideUp 0.3s ease' }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Enter Amount</div>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>Sending to</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)' }}>
                {resolved?.vpa_name}
              </div>
            </div>

            {/* Big amount input */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>Amount to Send</div>
              <div className="amount-input-container">
                <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>USD</span>
                <input
                  type="number"
                  id="send-amount"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  min={0}
                  style={{
                    fontSize: 36, fontWeight: 800, background: 'transparent', border: 'none',
                    outline: 'none', color: 'var(--text)', width: '160px', textAlign: 'center',
                    letterSpacing: '-1px',
                  }}
                  autoFocus
                />
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 10 }}>
                Available Balance: {fmt(balance)} USD
              </div>
            </div>

            {/* Fee breakdown */}
            {Number(amount) > 0 && (
              <div style={{
                background: 'var(--surface-2)', borderRadius: 12, padding: '16px',
                marginBottom: 20, animation: 'fadeIn 0.2s ease',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Amount</span>
                  <span>{fmt(Number(amount))} USD</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Fee ({fees?.transfer_fee_percent}%)</span>
                  <span>{fmt(feeAmt)} USD</span>
                </div>
                <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>You pay</span>
                  <span style={{ color: total > balance ? 'var(--danger)' : 'var(--text)' }}>
                    {fmt(total)} USD
                  </span>
                </div>
                {total > balance && (
                  <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8 }}>⚠️ Insufficient balance</div>
                )}
              </div>
            )}

            <div className="input-group" style={{ marginBottom: 20 }}>
              <label>Description (optional)</label>
              <input className="input" id="send-desc" placeholder="What's this for?"
                value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep('recipient')}>Back</button>
              <button className="btn btn-primary" style={{ flex: 2, height: 48 }}
                onClick={() => setStep('confirm')} disabled={!amount || Number(amount) <= 0 || total > balance}>
                Review <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && (
          <div style={{ animation: 'slideUp 0.3s ease' }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Confirm Transfer</div>
            <div style={{
              background: 'var(--surface-2)', borderRadius: 16, padding: '20px',
              marginBottom: 24, border: '1px solid var(--border)',
            }}>
              {[
                { label: 'To', value: resolved?.vpa_name ?? '' },
                { label: 'Name', value: resolved?.user_full_name ?? '' },
                { label: 'Amount', value: `${fmt(Number(amount))} USD` },
                { label: 'Fee', value: `${fmt(feeAmt)} USD` },
                { label: 'Total Debit', value: `${fmt(total)} USD`, highlight: true },
                { label: 'Description', value: description || '—' },
              ].map(({ label, value, highlight }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', fontSize: 14,
                  padding: '8px 0', borderBottom: '1px solid var(--border)',
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontWeight: highlight ? 700 : 500, color: highlight ? 'var(--primary)' : 'var(--text)' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep('amount')}>Back</button>
              <button className="btn btn-primary" style={{ flex: 2, height: 48 }}
                onClick={() => transferMut.mutate()} disabled={transferMut.isPending}>
                {transferMut.isPending ? <div className="spinner" /> : <><Send size={16} /> Confirm & Send</>}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', animation: 'slideUp 0.4s ease', padding: '20px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div className="success-check">
                <CheckCircle size={40} color="var(--success)" />
              </div>
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Transfer Successful!</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
              {fmt(Number(amount))} USD sent to <strong style={{ color: 'var(--primary)' }}>{resolved?.vpa_name}</strong>
            </p>
            <div style={{
              background: 'var(--surface-2)', borderRadius: 8, padding: '10px 16px',
              fontSize: 12, color: 'var(--text-muted)', marginBottom: 28, fontFamily: 'monospace',
            }}>
              Ref: {successRef}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={reset}>Send Again</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => window.location.href = '/transactions'}>
                View Transactions
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

