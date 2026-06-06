import apiClient from '@/lib/api-client';
import { AuthResponse, LoginInput } from '@/types/auth';

export const authService = {
  login: async (data: LoginInput): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },
  getProfile: async (): Promise<any> => {
    const response = await apiClient.get('/users/me');
    return response.data;
  },

  refreshToken: async (token: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const response = await apiClient.post('/auth/refresh', { refreshToken: token });
    return response.data;
  },

  logout: async (token: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refreshToken: token });
  },
};
