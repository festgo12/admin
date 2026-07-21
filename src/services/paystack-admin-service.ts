import apiClient from '@/lib/api-client';

export interface PaymentStats {
  totalDeposits: number;
  totalWithdrawals: number;
}

export interface PaymentTransaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED' | 'PROCESSING';
  reference: string;
  fee: number;
  metadata: any;
  createdAt: string;
  wallet: {
    id: string;
    currency: string;
    balance: number;
    user: {
      id: string;
      email: string;
      profile: {
        firstName: string;
        lastName: string;
      };
    };
  };
}

export interface PaymentTransactionDetail extends PaymentTransaction {
  ledgerEntries: Array<{
    id: string;
    amount: number;
    type: string;
    reference: string;
    balanceAfter: number;
    createdAt: string;
  }>;
}

export interface PaymentFilters {
  search?: string;
  status?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export const paystackAdminService = {
  getStats: async (): Promise<PaymentStats> => {
    const response = await apiClient.get('/admin/payments/stats');
    return response.data;
  },

  getTransactions: async (page = 1, limit = 10, filters?: PaymentFilters) => {
    const params: Record<string, any> = { page, limit };
    if (filters?.search) params.search = filters.search;
    if (filters?.status) params.status = filters.status;
    if (filters?.type) params.type = filters.type;
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    const response = await apiClient.get('/admin/payments/transactions', { params });
    return response.data;
  },

  getTransactionDetail: async (id: string): Promise<PaymentTransactionDetail> => {
    const response = await apiClient.get(`/admin/payments/transactions/${id}`);
    return response.data;
  },

  initiateRefund: async (transactionId: string, amount?: number) => {
    const response = await apiClient.post('/paystack/refund', {
      transactionId,
      ...(amount ? { amount } : {}),
    });
    return response.data;
  },
};
