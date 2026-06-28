import apiClient from './client';

export interface BankAccount {
  token_id: string;
  token_value: string;
  token_type: string;
  label: string;
  created_at: string;
}

export interface BankCreateRequest {
  bank_name: string;
  account_number: string;
  account_holder_name: string;
}

export const banksApi = {
  getBanks: async (): Promise<BankAccount[]> => {
    const res = await apiClient.get<BankAccount[]>('/api/v1/banks/');
    return res.data;
  },

  linkBank: async (data: BankCreateRequest): Promise<BankAccount> => {
    const res = await apiClient.post<BankAccount>('/api/v1/banks/', data);
    return res.data;
  },

  unlinkBank: async (tokenId: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/api/v1/banks/${tokenId}`);
    return res.data;
  },
};
