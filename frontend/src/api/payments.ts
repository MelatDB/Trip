import { get, post } from './client';
import type { Transaction, TransactionList, TransferResponse, FeeInfo } from '../types';

export const paymentsApi = {
  transfer: (data: { recipient: string; amount: number; currency: string; description?: string }) =>
    post<TransferResponse>('/api/v1/payments/transfer', data),

  withdraw: (data: { amount: number; bank_account_token: string; description?: string }) =>
    post<{ tx_id: string; reference: string; amount: number; fee: number; status: string; created_at: string }>(
      '/api/v1/payments/withdraw',
      data
    ),

  deposit: (data: { amount_etb: number; description?: string }) =>
    post<{ tx_id: string; reference: string; amount: number; amount_etb: number; exchange_rate: number; status: string; created_at: string }>(
      '/api/v1/payments/deposit', data
    ),

  getFees: () => get<FeeInfo>('/api/v1/payments/fees'),

  getTransactions: (page = 1, per_page = 20, tx_type?: string) => {
    const params = new URLSearchParams({ page: String(page), per_page: String(per_page) });
    if (tx_type) params.set('tx_type', tx_type);
    return get<TransactionList>(`/api/v1/transactions/?${params}`);
  },

  getTransaction: (tx_id: string) =>
    get<Transaction>(`/api/v1/transactions/${tx_id}`),
};
