import apiClient from '@/lib/api-client';

export interface DisputeEvidence {
  id: string;
  disputeId: string;
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedById: string;
  createdAt: string;
  uploadedBy: {
    id: string;
    email: string;
    profile: { firstName: string | null; lastName: string | null } | null;
  };
}

export interface DisputeOrder {
  id: string;
  status: string;
  fiatAmount: string;
  cryptoAmount: string;
  ad: { asset: string; type: string; price: string };
  buyer: {
    id: string;
    email: string;
    profile: { firstName: string | null; lastName: string | null } | null;
    wallets?: { currency: string; balance: string }[];
  };
  seller: {
    id: string;
    email: string;
    profile: { firstName: string | null; lastName: string | null } | null;
    wallets?: { currency: string; balance: string }[];
  };
}

export interface Dispute {
  id: string;
  orderId: string;
  initiatorId: string;
  reason: string;
  description: string | null;
  status: string;
  assigneeId: string | null;
  resolution: string | null;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
  order: DisputeOrder;
  initiator: {
    id: string;
    email: string;
    profile: { firstName: string | null; lastName: string | null } | null;
  };
  assignee: {
    id: string;
    email: string;
    profile: { firstName: string | null; lastName: string | null } | null;
  } | null;
  evidence: DisputeEvidence[];
}

export interface DisputeMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DisputeStats {
  total: number;
  last24h: number;
  byStatus: { status: string; count: number }[];
  avgResolutionHours: number;
}

export type DisputeStatusType =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'WAITING_FOR_USER'
  | 'WAITING_FOR_ADMIN'
  | 'RESOLVED'
  | 'REJECTED'
  | 'ESCALATED';

export const disputeService = {
  getDisputes: async (
    page = 1,
    limit = 20,
    filters?: {
      status?: DisputeStatusType;
      assigneeId?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
    },
  ): Promise<{ disputes: Dispute[]; meta: DisputeMeta }> => {
    const params: Record<string, any> = { page, limit };
    if (filters?.status) params.status = filters.status;
    if (filters?.assigneeId) params.assigneeId = filters.assigneeId;
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    if (filters?.search) params.search = filters.search;
    const response = await apiClient.get('/admin/disputes', { params });
    return response.data;
  },

  getDisputeDetail: async (id: string): Promise<Dispute> => {
    const response = await apiClient.get(`/admin/disputes/${id}`);
    return response.data;
  },

  getStats: async (): Promise<DisputeStats> => {
    const response = await apiClient.get('/admin/disputes/stats');
    return response.data;
  },

  updateStatus: async (
    id: string,
    status: DisputeStatusType,
    reason?: string,
  ): Promise<Dispute> => {
    const response = await apiClient.patch(`/admin/disputes/${id}/status`, {
      status,
      reason,
    });
    return response.data;
  },

  assign: async (id: string, assigneeId: string): Promise<Dispute> => {
    const response = await apiClient.patch(`/admin/disputes/${id}/assign`, {
      assigneeId,
    });
    return response.data;
  },

  resolve: async (
    id: string,
    resolution: string,
    outcome?: 'RESOLVED' | 'REJECTED',
  ): Promise<Dispute> => {
    const response = await apiClient.patch(`/admin/disputes/${id}/resolve`, {
      resolution,
      outcome: outcome || 'RESOLVED',
    });
    return response.data;
  },

  freezeOrder: async (id: string): Promise<{ id: string; status: string }> => {
    const response = await apiClient.patch(`/admin/disputes/${id}/freeze-order`);
    return response.data;
  },
};
