import apiClient from './client';
import { User } from '../types';

export interface AdminStats {
  total_users: number;
  verified_users: number;
  pending_kyc: number;
  suspended_users: number;
  total_transactions: number;
  total_volume: number;
}

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const res = await apiClient.get<AdminStats>('/api/v1/admin/stats');
    return res.data;
  },

  getUsers: async (kycStatus?: string): Promise<User[]> => {
    const params = kycStatus ? { kyc_status: kycStatus } : {};
    const res = await apiClient.get<User[]>('/api/v1/admin/users', { params });
    return res.data;
  },

  updateKyc: async (userId: string, action: 'verified' | 'rejected'): Promise<{ message: string; user_id: string }> => {
    const res = await apiClient.post<{ message: string; user_id: string }>(
      `/api/v1/admin/users/${userId}/kyc`,
      null,
      { params: { action } }
    );
    return res.data;
  },

  updateStatus: async (userId: string, action: 'active' | 'suspended'): Promise<{ message: string; user_id: string }> => {
    const res = await apiClient.post<{ message: string; user_id: string }>(
      `/api/v1/admin/users/${userId}/status`,
      null,
      { params: { action } }
    );
    return res.data;
  },
};
