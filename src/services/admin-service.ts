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

export interface AdminOrder {
  id: string;
  buyerId: string;
  sellerId: string;
  adId: string;
  status: string;
  fiatAmount: number;
  cryptoAmount: number;
  feeAmount: number;
  fraudFlagged: boolean;
  createdAt: string;
  updatedAt: string;
  buyer: {
    email: string;
    profile: {
      firstName: string;
      lastName: string;
    };
  };
  seller: {
    email: string;
    profile: {
      firstName: string;
      lastName: string;
    };
  };
  ad: {
    asset: string;
    price: number;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  profile: {
    firstName: string;
    lastName: string;
  };
}

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

  getOrders: async (page = 1, limit = 10, search?: string) => {
    const response = await apiClient.get('/admin/orders', { params: { page, limit, search } });
    return response.data;
  },

  getOrderDetail: async (orderId: string) => {
    const response = await apiClient.get(`/admin/orders/${orderId}`);
    return response.data;
  },

  getBlockchainStats: async () => {
    const response = await apiClient.get('/admin/blockchain/stats');
    return response.data;
  },

  getBlockchainTransactions: async (page = 1, limit = 10) => {
    const response = await apiClient.get('/admin/blockchain/transactions', { params: { page, limit } });
    return response.data;
  },

  getFailedTransactions: async (page = 1, limit = 10) => {
    const response = await apiClient.get('/admin/blockchain/failed', { params: { page, limit } });
    return response.data;
  },

  retryTransaction: async (transactionId: string) => {
    const response = await apiClient.post(`/admin/blockchain/failed/${transactionId}/retry`);
    return response.data;
  },

  syncAllBalances: async () => {
    const response = await apiClient.post('/admin/blockchain/sync');
    return response.data;
  },

  getExchangeRates: async () => {
    const response = await apiClient.get('/admin/exchange-rates');
    return response.data;
  },

  refreshExchangeRates: async () => {
    const response = await apiClient.post('/admin/exchange-rates/refresh');
    return response.data;
  },

  getWebhookSubscriptions: async () => {
    const response = await apiClient.get('/admin/webhooks');
    return response.data;
  },

  initOutgoingWebhooks: async () => {
    const response = await apiClient.post('/admin/webhooks/init');
    return response.data;
  },

  cancelWebhook: async (subscriptionId: string) => {
    const response = await apiClient.post(`/admin/webhooks/cancel/${subscriptionId}`);
    return response.data;
  },
};
