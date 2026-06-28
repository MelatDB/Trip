import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('trip_access_token', accessToken);
    localStorage.setItem('trip_refresh_token', refreshToken);
    localStorage.setItem('trip_user', JSON.stringify(user));
    set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
  },

  clearAuth: () => {
    localStorage.removeItem('trip_access_token');
    localStorage.removeItem('trip_refresh_token');
    localStorage.removeItem('trip_user');
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false });
  },

  setUser: (user) => {
    localStorage.setItem('trip_user', JSON.stringify(user));
    set({ user });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  initialize: () => {
    const accessToken = localStorage.getItem('trip_access_token');
    const refreshToken = localStorage.getItem('trip_refresh_token');
    const userStr = localStorage.getItem('trip_user');
    if (accessToken && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
      } catch {
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },
}));
