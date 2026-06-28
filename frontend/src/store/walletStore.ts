import { create } from 'zustand';
import type { Wallet } from '../types';

interface WalletState {
  wallets: Wallet[];
  selectedWallet: Wallet | null;
  isLoading: boolean;
}

interface WalletActions {
  setWallets: (wallets: Wallet[]) => void;
  setSelectedWallet: (wallet: Wallet | null) => void;
  updateBalance: (wallet_id: string, balance: number) => void;
  clearWallets: () => void;
  setLoading: (loading: boolean) => void;
}

export const useWalletStore = create<WalletState & WalletActions>((set, get) => ({
  wallets: [],
  selectedWallet: null,
  isLoading: false,

  setWallets: (wallets) =>
    set({ wallets, selectedWallet: wallets[0] ?? null }),

  setSelectedWallet: (wallet) => set({ selectedWallet: wallet }),

  updateBalance: (wallet_id, balance) => {
    const wallets = get().wallets.map((w) =>
      w.wallet_id === wallet_id ? { ...w, balance } : w
    );
    const selectedWallet = wallets.find((w) => w.wallet_id === wallet_id) ?? get().selectedWallet;
    set({ wallets, selectedWallet });
  },

  clearWallets: () => set({ wallets: [], selectedWallet: null }),

  setLoading: (loading) => set({ isLoading: loading }),
}));
