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

export interface CryptoSystemStatus {
  provider: string;
  network: string;
  isTestnet: boolean;
  confirmations: { eth: number; btc: number };
  depositSweepThreshold: number;
  registrySize: number;
  webhookProviders: { evm: string; btc: string };
  masterWallets: { evm: string; btc: string };
  recentSweeps: {
    id: string;
    amount: number;
    status: string;
    reference: string;
    createdAt: string;
    wallet: { currency: string };
  }[];
}

export interface WithdrawalJob {
  id: string;
  txHash: string;
  walletId: string;
  currency: string;
  amount: number;
  destination: string;
  status: string;
  attempts: number;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChainBalance {
  currency: string;
  address: string;
  balance: number;
}

export const adminService = {
  getDashboardStats: async () => {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  },

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
    const response = await apiClient.patch(`/admin/ads/${id}`, data);
    return response.data;
  },

  deleteAd: async (id: string) => {
    const response = await apiClient.delete(`/admin/ads/${id}`);
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

  flagOrder: async (orderId: string) => {
    const response = await apiClient.patch(`/admin/orders/${orderId}/flag`);
    return response.data;
  },

  releaseOrder: async (orderId: string) => {
    const response = await apiClient.patch(`/admin/orders/${orderId}/release`);
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

  getExchangeRates: async () => {
    const response = await apiClient.get('/admin/exchange-rates');
    return response.data;
  },

  refreshExchangeRates: async () => {
    const response = await apiClient.post('/admin/exchange-rates/refresh');
    return response.data;
  },

  getCryptoSystemStatus: async () => {
    const response = await apiClient.get('/admin/crypto/status');
    return response.data;
  },

  getWithdrawalJobs: async (page = 1, limit = 20, status?: string) => {
    const response = await apiClient.get('/admin/crypto/withdrawal-jobs', {
      params: { page, limit, ...(status ? { status } : {}) },
    });
    return response.data;
  },

  getChainBalances: async () => {
    const response = await apiClient.get('/admin/crypto/chain-balances');
    return response.data;
  },

  getFeeConfigs: async () => {
    const response = await apiClient.get('/admin/fees');
    return response.data;
  },

  updateFeeConfig: async (key: string, value: number) => {
    const response = await apiClient.patch(`/admin/fees/${key}`, { value });
    return response.data;
  },

  getFeeWallets: async () => {
    const response = await apiClient.get('/admin/fee-wallets');
    return response.data;
  },

  initFeeWallets: async () => {
    const response = await apiClient.post('/admin/fee-wallets/init');
    return response.data;
  },

  sweepFeeWallet: async (currency: string, address: string, amount?: number) => {
    const response = await apiClient.post(`/admin/fee-wallets/${currency}/sweep`, {
      address,
      ...(amount !== undefined && amount > 0 ? { amount } : {}),
    });
    return response.data;
  },

  creditTestFunds: async (email: string, currency: string, amount: number) => {
    const response = await apiClient.post('/admin/testnet/credit', {
      email,
      currency,
      amount,
    });
    return response.data;
  },

  reconcileAll: async () => {
    const response = await apiClient.post('/admin/crypto/reconcile');
    return response.data;
  },

  reconcileCurrency: async (currency: string) => {
    const response = await apiClient.post(`/admin/crypto/reconcile/${currency}`);
    return response.data;
  },

  sweepAll: async () => {
    const response = await apiClient.post('/admin/crypto/sweep-all');
    return response.data;
  },

  getBtcHistory: async (page = 1, pageSize = 50) => {
    const response = await apiClient.get('/admin/crypto/btc-history', {
      params: { page, pageSize },
    });
    return response.data;
  },

  getEvmHistory: async (address: string, page = 1) => {
    const response = await apiClient.get(`/admin/crypto/evm-history/${address}`, {
      params: { page },
    });
    return response.data;
  },
};
