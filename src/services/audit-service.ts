import apiClient from '@/lib/api-client';

export interface AuditLog {
  id: string;
  userId: string;
  actorId: string | null;
  action: string;
  resource: string | null;
  resourceId: string | null;
  oldValue: Record<string, any> | null;
  newValue: Record<string, any> | null;
  metadata: Record<string, any> | null;
  ipAddress: string | null;
  device: string | null;
  success: boolean;
  errorMessage: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    profile: { firstName: string | null; lastName: string | null };
  };
}

export interface AuditLogResponse {
  logs: AuditLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuditStats {
  total: number;
  last24h: number;
  failures: number;
  last7d: string;
  byResource: { resource: string; count: number }[];
  byAction: { action: string; count: number }[];
}

export interface AuditFilters {
  action?: string;
  resource?: string;
  userId?: string;
  success?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export const auditService = {
  getAuditLogs: async (
    page = 1,
    limit = 20,
    filters?: AuditFilters,
  ): Promise<AuditLogResponse> => {
    const params: Record<string, any> = { page, limit };
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params[key] = value;
        }
      });
    }
    const response = await apiClient.get('/admin/audit-logs', { params });
    return response.data;
  },

  getAuditStats: async (): Promise<AuditStats> => {
    const response = await apiClient.get('/admin/audit-logs/stats');
    return response.data;
  },

  getUserAuditTrail: async (
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<AuditLogResponse> => {
    const response = await apiClient.get(`/admin/audit-logs/user/${userId}`, {
      params: { page, limit },
    });
    return response.data;
  },
};
