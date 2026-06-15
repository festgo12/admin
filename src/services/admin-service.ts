import apiClient from '@/lib/api-client';

export interface AdminWallet {
  id: string;
  currency: string;
  balance: number;
  reservedBalance: number;
  address?: string;
  user: {
    email: string;
    profile: {
      firstName: string;
      lastName: string;
    };
  };
  updatedAt: string;
}

export interface AdminTransaction {
  id: string;
  amount: number;
  type: string;
  reference: string;
  status: string;
  createdAt: string;
  wallet: {
    currency: string;
    user: {
      email: string;
    };
  };
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

  getWallets: async (page = 1, limit = 10, search?: string) => {
    const response = await apiClient.get('/admin/wallets', { params: { page, limit, search } });
    return response.data;
  },

  getWalletDetail: async (walletId: string) => {
    const response = await apiClient.get(`/admin/wallets/${walletId}`);
    return response.data;
  },

  getTransactions: async (page = 1, limit = 10) => {
    const response = await apiClient.get('/admin/transactions', { params: { page, limit } });
    return response.data;
  },

  getAds: async (page = 1, limit = 10, search?: string) => {
    // Using the marketplace listings endpoint but adapted for admin
    const response = await apiClient.get('/marketplace/listings', { params: { page, limit, search } });
    return response.data;
  },

  updateAd: async (id: string, data: any) => {
    const response = await apiClient.put(`/marketplace/ads/${id}`, data);
    return response.data;
  },

  deleteAd: async (id: string) => {
    const response = await apiClient.delete(`/marketplace/ads/${id}`);
    return response.data;
  },
};

export interface AdminAd {
  id: string;
  sellerId: string;
  asset: string;
  type: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  minLimit: number;
  maxLimit: number;
  isSponsored: boolean;
  status: string;
  createdAt: string;
  seller: {
    id: string;
    profile: {
      firstName: string;
      kycStatus: string;
    };
  };
}
