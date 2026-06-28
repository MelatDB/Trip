import { get, post } from './client';
import type { User, TokenResponse } from '../types';

export const authApi = {
  register: (data: { full_name: string; email: string; password: string; phone?: string }) =>
    post<User>('/api/v1/auth/register', data),

  login: (email: string, password: string) =>
    post<TokenResponse>('/api/v1/auth/login', { email, password }),

  refresh: (refresh_token: string) =>
    post<TokenResponse>('/api/v1/auth/refresh', { refresh_token }),

  getMe: () => get<User>('/api/v1/auth/me'),

  setupMFA: () => post<{ secret: string; qr_uri: string; backup_codes: string[] }>('/api/v1/auth/mfa/setup'),

  verifyMFA: (code: string) =>
    post<{ message: string; enabled: boolean }>('/api/v1/auth/mfa/verify', { code }),

  changePassword: (current_password: string, new_password: string) =>
    post<{ message: string }>('/api/v1/auth/change-password', { current_password, new_password }),

  logout: () => post<{ message: string }>('/api/v1/auth/logout'),

  updateProfile: (data: { full_name?: string; phone?: string }) =>
    post<User>('/api/v1/users/me', data),
};
