import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield, Users, CheckCircle, XCircle, AlertTriangle,
  TrendingUp, UserCheck, Search, ShieldAlert, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../api/admin';

const KYC_STATUSES = [
  { label: 'All KYCs', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Verified', value: 'verified' },
  { label: 'Rejected', value: 'rejected' },
];

export default function Admin() {
  const queryClient = useQueryClient();
  const [kycFilter, setKycFilter] = useState('');
  const [search, setSearch] = useState('');

  // Fetch Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: adminApi.getStats,
  });

  // Fetch Users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['adminUsers', kycFilter],
    queryFn: () => adminApi.getUsers(kycFilter || undefined),
  });

  // KYC Mutation
  const kycMutation = useMutation({
    mutationFn: ({ userId, action }: { userId: string; action: 'verified' | 'rejected' }) =>
      adminApi.updateKyc(userId, action),
    onSuccess: (data) => {
      toast.success(data.message || 'KYC status updated!');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? 'Failed to update KYC status');
    },
  });

  // User Status Mutation
  const statusMutation = useMutation({
    mutationFn: ({ userId, action }: { userId: string; action: 'active' | 'suspended' }) =>
      adminApi.updateStatus(userId, action),
    onSuccess: (data) => {
      toast.success(data.message || 'User status updated!');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? 'Failed to update user status');
    },
  });

  const handleKycAction = (userId: string, action: 'verified' | 'rejected') => {
    kycMutation.mutate({ userId, action });
  };

  const handleStatusAction = (userId: string, currentStatus: string) => {
    const action = currentStatus === 'suspended' ? 'active' : 'suspended';
    statusMutation.mutate({ userId, action });
  };

  const filteredUsers = (users ?? []).filter(u => {
    if (!search) return true;
    const s = search.toLowerCase();
    return u.full_name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
  });

  const fmt = (n: number) => new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2 }).format(n);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 'var(--radius)', background: 'var(--primary-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)'
        }}>
          <Shield size={22} />
        </div>
        <div>
          <h1 className="page-title">Admin Operations Portal</h1>
          <p className="page-subtitle">Manage user status, review KYC verifications, and monitor platform activity</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 20, marginBottom: 32
      }}>
        {statsLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 110, borderRadius: 'var(--radius)' }} />
          ))
        ) : (
          <>
            {/* Total Users */}
            <div className="glass-strong" style={{ padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500 }}>Total Users</div>
                <div style={{ fontSize: 26, fontWeight: 800 }}>{stats?.total_users ?? 0}</div>
              </div>
              <div style={{ width: 44, height: 44, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <Users size={20} />
              </div>
            </div>

            {/* Pending KYC */}
            <div className="glass-strong" style={{ padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500 }}>Pending KYCs</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: (stats?.pending_kyc ?? 0) > 0 ? 'var(--warning)' : 'inherit' }}>
                  {stats?.pending_kyc ?? 0}
                </div>
              </div>
              <div style={{
                width: 44, height: 44,
                background: (stats?.pending_kyc ?? 0) > 0 ? 'var(--warning-dim)' : 'var(--surface-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: (stats?.pending_kyc ?? 0) > 0 ? 'var(--warning)' : 'var(--text-muted)'
              }}>
                <AlertTriangle size={20} />
              </div>
            </div>

            {/* Suspended Accounts */}
            <div className="glass-strong" style={{ padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500 }}>Suspended Users</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: (stats?.suspended_users ?? 0) > 0 ? 'var(--danger)' : 'inherit' }}>
                  {stats?.suspended_users ?? 0}
                </div>
              </div>
              <div style={{
                width: 44, height: 44,
                background: (stats?.suspended_users ?? 0) > 0 ? 'var(--danger-dim)' : 'var(--surface-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: (stats?.suspended_users ?? 0) > 0 ? 'var(--danger)' : 'var(--text-muted)'
              }}>
                <ShieldAlert size={20} />
              </div>
            </div>

            {/* Volume */}
            <div className="glass-strong" style={{ padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500 }}>Settle Volume</div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{fmt(stats?.total_volume ?? 0)} <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>USD</span></div>
              </div>
              <div style={{ width: 44, height: 44, background: 'var(--success-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
                <TrendingUp size={20} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filter and Search controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="input-icon" style={{ flex: 1, minWidth: 260 }}>
          <Search size={16} className="icon" />
          <input className="input" type="text" placeholder="Search users by name or email..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {KYC_STATUSES.map(({ label, value }) => (
            <button key={label}
              onClick={() => setKycFilter(value)}
              className={`btn btn-secondary ${kycFilter === value ? 'active' : ''}`}
              style={{
                borderRadius: 'var(--radius)',
                padding: '10px 16px', fontSize: 13, fontWeight: 600,
                background: kycFilter === value ? 'var(--primary)' : 'var(--surface-2)',
                color: kycFilter === value ? '#0A0F1E' : 'var(--text-muted)',
                border: `1px solid ${kycFilter === value ? 'var(--primary)' : 'var(--border)'}`,
                cursor: 'pointer', transition: 'var(--transition)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div className="glass-strong" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-muted)', fontWeight: 600 }}>
                <th style={{ padding: '16px 24px' }}>Name / Email</th>
                <th style={{ padding: '16px 24px' }}>Role</th>
                <th style={{ padding: '16px 24px' }}>KYC Status</th>
                <th style={{ padding: '16px 24px' }}>Account Status</th>
                <th style={{ padding: '16px 24px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td colSpan={5} style={{ padding: 24 }}>
                      <div className="skeleton" style={{ height: 40, width: '100%', borderRadius: 'var(--radius)' }} />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-dim)' }}>
                    No users found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.user_id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s ease' }} className="table-row-hover">
                    <td style={{ padding: '18px 24px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{u.full_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '18px 24px' }}>
                      {u.is_admin ? (
                        <span style={{ fontSize: 11, background: 'var(--primary-dim)', color: 'var(--primary)', padding: '4px 8px', borderRadius: 4, fontWeight: 700 }}>
                          ADMIN
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, background: 'var(--surface-3)', color: 'var(--text-muted)', padding: '4px 8px', borderRadius: 4, fontWeight: 600 }}>
                          USER
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '18px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {u.kyc_status === 'verified' ? (
                          <>
                            <ShieldCheck size={16} color="var(--success)" />
                            <span style={{ color: 'var(--success)', fontWeight: 600 }}>Verified</span>
                          </>
                        ) : u.kyc_status === 'rejected' ? (
                          <>
                            <ShieldAlert size={16} color="var(--danger)" />
                            <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Rejected</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={16} color="var(--warning)" />
                            <span style={{ color: 'var(--warning)', fontWeight: 600 }}>Pending Review</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '18px 24px' }}>
                      <span style={{
                        display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                        background: u.status === 'suspended' ? 'var(--danger)' : 'var(--success)',
                        marginRight: 8
                      }} />
                      <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{u.status}</span>
                    </td>
                    <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        {/* KYC review buttons */}
                        {u.kyc_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleKycAction(u.user_id, 'verified')}
                              className="btn btn-secondary btn-sm"
                              style={{ display: 'flex', alignItems: 'center', gap: 4, border: '1px solid var(--success)', color: 'var(--success)', borderRadius: 'var(--radius)' }}
                            >
                              <CheckCircle size={14} /> Approve
                            </button>
                            <button
                              onClick={() => handleKycAction(u.user_id, 'rejected')}
                              className="btn btn-secondary btn-sm"
                              style={{ display: 'flex', alignItems: 'center', gap: 4, border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: 'var(--radius)' }}
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </>
                        )}

                        {/* Account Suspend / Activate button */}
                        {!u.is_admin && (
                          <button
                            onClick={() => handleStatusAction(u.user_id, u.status)}
                            className={`btn btn-sm ${u.status === 'suspended' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{
                              borderRadius: 'var(--radius)',
                              border: u.status !== 'suspended' ? '1px solid var(--danger)' : undefined,
                              color: u.status !== 'suspended' ? 'var(--danger)' : undefined
                            }}
                          >
                            {u.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
