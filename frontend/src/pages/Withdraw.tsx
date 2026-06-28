import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, CheckCircle, ArrowRight, Clock, ChevronRight, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { walletApi } from '../api/wallet';
import { paymentsApi } from '../api/payments';
import type { FeeInfo } from '../types';

type Step = 'bank' | 'amount' | 'confirm' | 'success';

const BANKS = [
  { id: 'cbe',    name: 'Commercial Bank of Ethiopia', account: '1000 4521 8873', color: '#0066CC' },
  { id: 'boa',    name: 'Bank of Abyssinia',            account: '6234 9901 3312', color: '#009933' },
  { id: 'awash',  name: 'Awash Bank',                   account: '8871 2200 5543', color: '#CC0000' },
  { id: 'dashen', name: 'Dashen Bank',                  account: '3341 7760 9982', color: '#FF6600' },
  { id: 'nib',    name: 'Nib International Bank',       account: '5512 0034 7761', color: '#663399' },
];

export default function Withdraw() {
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>('bank');
  const [selectedBank, setSelectedBank] = useState<typeof BANKS[0] | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [successRef, setSuccessRef] = useState('');

  const { data: wallets } = useQuery({ queryKey: ['wallets'], queryFn: walletApi.getWallets });
  const { data: fees } = useQuery<FeeInfo>({ queryKey: ['fees'], queryFn: paymentsApi.getFees });

  const wallet = wallets?.[0];
  const balance = wallet?.balance ?? 0;
  const currency = wallet?.currency ?? 'USD';
  const feeAmt = fees ? (Number(amount) * fees.withdrawal_fee_percent) / 100 : 0;
  const total = Number(amount) + feeAmt;
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(n);

  const withdrawMut = useMutation({
    mutationFn: () => paymentsApi.withdraw({
      amount: Number(amount),
      bank_account_token: selectedBank!.id,
      description: description || `Withdrawal to ${selectedBank?.name}`,
    }),
    onSuccess: (res) => {
      setSuccessRef(res.reference);
      setStep('success');
      qc.invalidateQueries({ queryKey: ['wallets'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Withdrawal queued!');
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail ?? 'Withdrawal failed'),
  });

  const reset = () => { setStep('bank'); setSelectedBank(null); setAmount(''); setDescription(''); setSuccessRef(''); };
  const stepIndex = ['bank', 'amount', 'confirm', 'success'].indexOf(step);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease', maxWidth: 520, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Withdraw Funds</h1>
        <p className="page-subtitle">Transfer to your Ethiopian bank account</p>
      </div>

      {step !== 'success' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {(['bank', 'amount', 'confirm'] as Step[]).map((s, i) => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: stepIndex > i ? 'var(--success)' : s === step ? 'var(--primary)' : 'var(--surface-3)',
              transition: 'var(--transition)',
            }} />
          ))}
        </div>
      )}

      <div className="glass" style={{ padding: '32px 28px' }}>

        {/* Step 1: Select Bank */}
        {step === 'bank' && (
          <div style={{ animation: 'slideUp 0.3s ease' }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Select Destination Bank</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
              Choose the bank account to withdraw to
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {BANKS.map(bank => (
                <button key={bank.id}
                  onClick={() => { setSelectedBank(bank); setStep('amount'); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '16px',
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                    transition: 'var(--transition)', width: '100%',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)';
                    (e.currentTarget as HTMLElement).style.background = 'var(--primary-dim)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                    (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)';
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: bank.color + '22',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Building2 size={20} color={bank.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{bank.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      ••••  ••••  {bank.account.slice(-4)}
                    </div>
                  </div>
                  <ChevronRight size={16} color="var(--text-dim)" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Amount */}
        {step === 'amount' && selectedBank && (
          <div style={{ animation: 'slideUp 0.3s ease' }}>
            {/* Selected bank header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
              background: 'var(--surface-2)', borderRadius: 12, marginBottom: 24,
              border: '1px solid var(--border)',
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: selectedBank.color + '22',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Building2 size={18} color={selectedBank.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{selectedBank.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>••••  ••••  {selectedBank.account.slice(-4)}</div>
              </div>
              <button onClick={() => setStep('bank')}
                style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>Amount to Withdraw</div>
              <div className="amount-input-container">
                <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>{currency}</span>
                <input
                  type="number" autoFocus
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00" min={0}
                  style={{
                    fontSize: 36, fontWeight: 800, background: 'transparent', border: 'none',
                    outline: 'none', color: 'var(--text)', width: '160px', textAlign: 'center',
                    letterSpacing: '-1px',
                  }}
                />
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 10 }}>
                Available Balance: {fmt(balance)} {currency}
              </div>
            </div>

            {Number(amount) > 0 && (
              <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '14px 16px', marginBottom: 20, animation: 'fadeIn 0.2s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Fee ({fees?.withdrawal_fee_percent}%)</span>
                  <span>{fmt(feeAmt)} {currency}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
                  <span>Total deducted</span>
                  <span style={{ color: total > balance ? 'var(--danger)' : 'var(--text)' }}>{fmt(total)} {currency}</span>
                </div>
                {total > balance && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>⚠️ Insufficient balance</div>}
              </div>
            )}

            <div className="input-group" style={{ marginBottom: 20 }}>
              <label>Note (optional)</label>
              <input className="input" placeholder="Reason for withdrawal" value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep('bank')}>Back</button>
              <button className="btn btn-primary" style={{ flex: 2, height: 48 }}
                onClick={() => setStep('confirm')}
                disabled={!amount || Number(amount) <= 0 || total > balance}>
                Review Withdrawal <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && selectedBank && (
          <div style={{ animation: 'slideUp 0.3s ease' }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Confirm Withdrawal</div>

            <div style={{
              background: 'var(--warning-dim)', border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 12, padding: '14px 16px', marginBottom: 20, fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <Clock size={16} color="var(--warning)" />
              <span style={{ color: 'var(--text-muted)' }}>Settlement typically takes <strong style={{ color: 'var(--warning)' }}>1–24 hours</strong> via partner banking rails</span>
            </div>

            <div style={{ background: 'var(--surface-2)', borderRadius: 16, padding: '20px', marginBottom: 24, border: '1px solid var(--border)' }}>
              {[
                { label: 'Withdrawal Amount', value: `${fmt(Number(amount))} ${currency}` },
                { label: 'Fee', value: `${fmt(feeAmt)} ${currency}` },
                { label: 'Total Deducted', value: `${fmt(total)} ${currency}`, highlight: true },
                { label: 'Destination Bank', value: selectedBank.name },
                { label: 'Account', value: `••••  ••••  ${selectedBank.account.slice(-4)}` },
                { label: 'Estimated Arrival', value: 'Within 24 hours' },
              ].map(({ label, value, highlight }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', fontSize: 14,
                  padding: '8px 0', borderBottom: '1px solid var(--border)',
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontWeight: highlight ? 700 : 500, color: highlight ? 'var(--accent)' : 'var(--text)' }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep('amount')}>Back</button>
              <button className="btn btn-primary" style={{ flex: 2, height: 48 }}
                onClick={() => withdrawMut.mutate()} disabled={withdrawMut.isPending}>
                {withdrawMut.isPending ? <div className="spinner" /> : <><Building2 size={16} /> Confirm Withdrawal</>}
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
            <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Withdrawal Queued!</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
              <strong>{fmt(Number(amount))} {currency}</strong> is being processed to {selectedBank?.name}
            </p>
            <div style={{
              background: 'var(--warning-dim)', borderRadius: 8, padding: '10px 16px',
              fontSize: 13, color: 'var(--warning)', marginBottom: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <Clock size={14} /> Estimated arrival: within 24 hours
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'monospace', marginBottom: 28 }}>
              Ref: {successRef}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={reset}>New Withdrawal</button>
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
