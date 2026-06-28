import { get, post } from './client';
import type { Wallet, VPA, VPAResolveResponse } from '../types';

export const walletApi = {
  getWallets: () => get<Wallet[]>('/api/v1/wallets/'),

  getBalance: (wallet_id: string) =>
    get<{ wallet_id: string; balance: number; currency: string }>(
      `/api/v1/wallets/${wallet_id}/balance`
    ),

  getVPAs: () => get<VPA[]>('/api/v1/wallets/vpas'),

  createVPA: (vpa_name: string) =>
    post<VPA>('/api/v1/wallets/vpas', { vpa_name }),

  resolveVPA: (vpa: string) =>
    get<VPAResolveResponse>(`/api/v1/wallets/vpa/resolve/${encodeURIComponent(vpa)}`),

  freezeWallet: (wallet_id: string) =>
    post<Wallet>(`/api/v1/wallets/${wallet_id}/freeze`),

  unfreezeWallet: (wallet_id: string) =>
    post<Wallet>(`/api/v1/wallets/${wallet_id}/unfreeze`),
};
