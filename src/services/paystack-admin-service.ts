import apiClient from '@/lib/api-client';

export interface PaymentStats {
  totalDeposits: number;
  totalWithdrawals: number;
}

export interface PaymentTransaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
  reference: string;
  metadata: any;
  createdAt: string;
  wallet: {
    currency: string;
    user: {
      email: string;
      profile: {
        firstName: string;
        lastName: string;
      };
    };
  };
}

export const paystackAdminService = {
  getStats: async (): Promise<PaymentStats> => {
    const response = await apiClient.get('/admin/payments/stats');
    return response.data;
  },

  getTransactions: async (page = 1, limit = 10) => {
    const response = await apiClient.get('/admin/payments/transactions', { params: { page, limit } });
    return response.data;
  },
};
