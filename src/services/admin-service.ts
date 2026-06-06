import apiClient from '@/lib/api-client';

export interface AdminUser {
  id: string;
  email: string;
  phone?: string;
  role: string;
  status: 'ACTIVE' | 'BLOCKED' | 'PENDING';
  profile: {
    firstName: string;
    lastName: string;
    country?: string;
  };
  createdAt: string;
  wallets: Array<{
    currency: string;
    balance: number;
  }>;
}

export const adminService = {
  getUsers: async (page = 1, limit = 10, search?: string) => {
    const response = await apiClient.get('/admin/users', { params: { page, limit, search } });
    return response.data;
  },

  updateUserStatus: async (userId: string, status: string) => {
    const response = await apiClient.patch(`/admin/users/${userId}/status`, { status });
    return response.data;
  },

  getUserDetail: async (userId: string) => {
    const response = await apiClient.get(`/admin/users/${userId}`);
    return response.data;
  },
};
