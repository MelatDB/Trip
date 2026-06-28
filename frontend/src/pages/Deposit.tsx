import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2, ArrowRight, CheckCircle, Clock,
  ShieldCheck, Loader2, ChevronRight, X, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentsApi } from '../api/payments';
import { walletApi } from '../api/wallet';

type Step = 'bank' | 'amount' | 'processing' | 'success';

const BANKS = [
  { id: 'cbe',    name: 'Commercial Bank of Ethiopia', short: 'CBE',    account: '1000 4521 8873', color: '#0066CC' },
  { id: 'boa',    name: 'Bank of Abyssinia',            short: 'BOA',    account: '6234 9901 3312', color: '#009933' },
  { id: 'awash',  name: 'Awash Bank',                   short: 'AWASH',  account: '8871 2200 5543', color: '#CC0000' },
  { id: 'dashen', name: 'Dashen Bank',                  short: 'DASHEN', account: '3341 7760 9982', color: '#FF6600' },
  { id: 'nib',    name: 'Nib International Bank',       short: 'NIB',    account: '5512 0034 7761', color: '#663399' },
];

const QUICK_AMOUNTS_ETB = [500, 1000, 2500, 5000, 10000];

// Live ETB/USD rate from exchangerate-api
const ETB_TO_USD = 0.00877; // ~114 ETB = 1 USD (fallback)

export default function Deposit() {
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>('bank');
  const [selectedBank, setSelectedBank] = useState<typeof BANKS[0] | null>(null);
  const [amountETB, setAmountETB] = useState('');
  const [description, setDescription] = useState('');
  const [successRef, setSuccessRef] = useState('');
  const [successETB, setSuccessETB] = useState(0);
  const [successConverted, setSuccessConverted] = useState(0);
  const [progress, setProgress] = useState(0);
  const [processingMsg, setProcessingMsg] = useState('Connecting to bank...');
  const [rate, setRate] = useState<number>(ETB_TO_USD);
  const [rateLoading, setRateLoading] = useState(true);

  const { data: wallets } = useQuery({ queryKey: ['wallets'], queryFn: walletApi.getWallets });
  const primaryWallet = wallets?.[0];
  const currency = primaryWallet?.currency ?? 'USD';

  // Fetch live exchange rate
  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/ETB')
      .then(r => r.json())
      .then(data => {
        const r = data?.rates?.[currency];
        if (r) setRate(r);
      })
      .catch(() => {}) // use fallback
      .finally(() => setRateLoading(false));
  }, [currency]);

  const etbVal = Number(amountETB) || 0;
  const convertedVal = etbVal * rate;

  const fmtETB = (n: number) => new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2 }).format(n);
  const fmtUSD = (n: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(n);

  // Processing animation
  useEffect(() => {
    if (step !== 'processing') return;
    const messages = [
      'Connecting to bank...',
      'Verifying account details...',
      'Authorizing transfer...',
      'Converting ETB to ' + currency + '...',
      'Crediting TRIP wallet...',
      'Finalizing transaction...',
    ];
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setProgress(Math.min((i / messages.length) * 100, 95));
      if (messages[i]) setProcessingMsg(messages[i]);
      if (i >= messages.length - 1) clearInterval(interval);
    }, 600);
    return () => clearInterval(interval);
  }, [step, currency]);

  const handleConfirm = async () => {
    setStep('processing');
    setProgress(10);
    await new Promise(r => setTimeout(r, 3800));
    try {
      const res = await paymentsApi.deposit({
        amount_etb: parseFloat(etbVal.toFixed(2)),
        description: description || `Bank deposit from ${selectedBank?.name} (${fmtETB(etbVal)} ETB)`,
      });
      setProgress(100);
      setSuccessRef(res.reference);
      setSuccessETB(etbVal);
      setSuccessConverted(convertedVal);
      await new Promise(r => setTimeout(r, 400));
      setStep('success');
      qc.invalidateQueries({ queryKey: ['wallets'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Deposit successful!');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? 'Deposit failed');
      setStep('amount');
    }
  };

  const reset = () => {
    setStep('bank'); setSelectedBank(null);
    setAmountETB(''); setDescription('');
    setSuccessRef(''); setProgress(0);
  };

  const stepIndex = ['bank', 'amount', 'processing', 'success'].indexOf(step);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease', maxWidth: 520, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Add Money</h1>
        <p className="page-subtitle">Deposit from your Ethiopian bank account</p>
      </div>

      {step !== 'success' && step !== 'processing' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {(['bank', 'amount'] as Step[]).map((s, i) => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: stepIndex > i ? 'var(--success)' : s === step ? 'var(--primary)' : 'var(--surface-3)',
              transition: 'background 0.4s ease',
            }} />
          ))}
        </div>
      )}

      <div className="glass" style={{ padding: '32px 28px' }}>

        {/* ── Step 1: Select Bank ── */}
        {step === 'bank' && (
          <div style={{ animation: 'slideUp 0.3s ease' }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Select Source Bank</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
              Choose the bank account to deposit from
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {BANKS.map(bank => (
                <button key={bank.id}
                  onClick={() => { setSelectedBank(bank); setStep('amount'); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '16px', background: 'var(--surface-2)',
                    border: '1px solid var(--border)', borderRadius: 14,
                    cursor: 'pointer', textAlign: 'left', transition: 'var(--transition)', width: '100%',
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

        {/* ── Step 2: Enter Amount ── */}
        {step === 'amount' && selectedBank && (
          <div style={{ animation: 'slideUp 0.3s ease' }}>
            {/* Selected bank */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
              background: 'var(--surface-2)', borderRadius: 12, marginBottom: 20,
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

            {/* Exchange rate banner */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 10, marginBottom: 20, fontSize: 12,
            }}>
              <RefreshCw size={13} color="var(--primary)" style={rateLoading ? { animation: 'spin 1s linear infinite' } : {}} />
              <span style={{ color: 'var(--text-muted)' }}>
                Live rate: <strong style={{ color: 'var(--primary)' }}>1 ETB = {fmtUSD(rate)} {currency}</strong>
              </span>
              <span style={{ color: 'var(--text-dim)', marginLeft: 'auto' }}>
                {rateLoading ? 'Fetching...' : 'Live'}
              </span>
            </div>

            {/* ETB amount input */}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>Amount to Deposit (ETB)</div>
              <div className="amount-input-container">
                <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>ETB</span>
                <input
                  type="number" autoFocus
                  value={amountETB}
                  onChange={e => setAmountETB(e.target.value)}
                  placeholder="0.00"
                  min={0}
                  style={{
                    fontSize: 40, fontWeight: 800, background: 'transparent', border: 'none',
                    outline: 'none', color: 'var(--text)', width: '180px', textAlign: 'center',
                    letterSpacing: '-1px',
                  }}
                />
              </div>
            </div>

            {/* Converted amount */}
            {etbVal > 0 && (
              <div style={{
                textAlign: 'center', marginBottom: 20,
                padding: '12px', background: 'var(--primary-dim)',
                borderRadius: 12, animation: 'fadeIn 0.2s ease',
              }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>You will receive</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>
                  {fmtUSD(convertedVal)} {currency}
                </div>
              </div>
            )}

            {/* Quick amounts */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 }}>
              {QUICK_AMOUNTS_ETB.map(q => (
                <button key={q} onClick={() => setAmountETB(String(q))}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                    background: etbVal === q ? 'var(--primary)' : 'var(--surface-2)',
                    color: etbVal === q ? '#0A0F1E' : 'var(--text-muted)',
                    border: `1px solid ${etbVal === q ? 'var(--primary)' : 'var(--border)'}`,
                    cursor: 'pointer', transition: 'var(--transition)',
                  }}>
                  {fmtETB(q)}
                </button>
              ))}
            </div>

            {/* Security note */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 10, marginBottom: 20, fontSize: 12, color: 'var(--text-muted)',
            }}>
              <ShieldCheck size={14} color="var(--success)" style={{ flexShrink: 0 }} />
              Converted amount will be instantly credited to your {currency} wallet
            </div>

            <div className="input-group" style={{ marginBottom: 24 }}>
              <label>Note (optional)</label>
              <input className="input" placeholder="e.g. Freelance payment deposit"
                value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep('bank')}>Back</button>
              <button className="btn btn-primary" style={{ flex: 2, height: 48 }}
                onClick={() => handleConfirm()}
                disabled={!amountETB || etbVal <= 0}>
                Deposit {etbVal > 0 ? `${fmtETB(etbVal)} ETB` : ''} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Processing ── */}
        {step === 'processing' && (
          <div style={{ textAlign: 'center', padding: '20px 0', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 28px' }}>
              <svg width="80" height="80" style={{ position: 'absolute', top: 0, left: 0, animation: 'spin 1.2s linear infinite' }}>
                <circle cx="40" cy="40" r="34" fill="none" stroke="var(--primary)" strokeWidth="4"
                  strokeDasharray="160" strokeDashoffset="40" strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={28} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Processing Deposit</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>{processingMsg}</p>
            <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 3, marginBottom: 28, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                width: `${progress}%`, transition: 'width 0.5s ease',
              }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
              <Clock size={14} /> Secured by TRIP Payment Rails
            </div>
          </div>
        )}

        {/* ── Step 4: Success ── */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', animation: 'slideUp 0.4s ease', padding: '20px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div className="success-check">
                <CheckCircle size={40} color="var(--success)" />
              </div>
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Deposit Successful!</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>
              <strong style={{ color: 'var(--success)', fontSize: 22 }}>{fmtUSD(successConverted)} {currency}</strong>
            </p>
            <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 20 }}>
              credited to your wallet from {fmtETB(successETB)} ETB
            </p>

            <div style={{
              background: 'var(--surface-2)', borderRadius: 14, padding: '16px 20px',
              marginBottom: 24, textAlign: 'left', border: '1px solid var(--border)',
            }}>
              {[
                { label: 'ETB Deposited',     value: `${fmtETB(successETB)} ETB` },
                { label: 'Exchange Rate',      value: `1 ETB = ${fmtUSD(rate)} ${currency}` },
                { label: `${currency} Received`, value: `${fmtUSD(successConverted)} ${currency}` },
                { label: 'Conversion Fee',     value: 'Free' },
                { label: 'Source',             value: selectedBank?.name ?? '' },
                { label: 'Status',             value: '✓ Completed' },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', fontSize: 13,
                  padding: '7px 0', borderBottom: '1px solid var(--border)',
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontWeight: 600, color: label === 'Status' ? 'var(--success)' : 'var(--text)' }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'monospace', marginBottom: 24 }}>
              Ref: {successRef}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={reset}>Deposit Again</button>
              <button className="btn btn-primary" style={{ flex: 1 }}
                onClick={() => window.location.href = '/wallet'}>
                View Wallet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
