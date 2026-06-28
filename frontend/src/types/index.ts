export interface User {
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  kyc_status: 'pending' | 'verified' | 'rejected';
  is_admin: boolean;
  mfa_enabled: boolean;
  status: 'active' | 'suspended' | 'pending';
  created_at: string;
}

export interface VPA {
  vpa_id: string;
  vpa_name: string;
  is_primary: boolean;
  created_at: string;
}

export interface Wallet {
  wallet_id: string;
  user_id: string;
  balance: number;
  currency: string;
  status: 'active' | 'frozen';
  created_at: string;
  vpas: VPA[];
}

export interface Transaction {
  tx_id: string;
  reference: string;
  amount: number;
  fee: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  tx_type: 'transfer' | 'deposit' | 'withdrawal' | 'fee';
  description?: string;
  sender_vpa?: string;
  receiver_vpa?: string;
  created_at: string;
  settled_at?: string;
}

export interface TransactionList {
  transactions: Transaction[];
  total: number;
  page: number;
  per_page: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface TransferRequest {
  recipient: string;
  amount: number;
  currency: string;
  description?: string;
}

export interface TransferResponse {
  tx_id: string;
  reference: string;
  amount: number;
  fee: number;
  status: string;
  created_at: string;
  receiver_vpa?: string;
  sender_vpa?: string;
}

export interface VPAResolveResponse {
  vpa_name: string;
  wallet_id: string;
  user_full_name: string;
}

export interface FeeInfo {
  transfer_fee_percent: number;
  withdrawal_fee_percent: number;
  min_amount: number;
}

export interface ApiError {
  detail: string;
}
