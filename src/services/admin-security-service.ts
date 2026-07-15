import apiClient from '@/lib/api-client';

export interface FraudRule {
  id: string;
  name: string;
  code: string;
  description: string;
  enabled: boolean;
  threshold: number;
  severity: string;
  action: string;
  createdAt: string;
}

export interface RiskOverview {
  users: {
    total: number;
    frozen: number;
    suspended: number;
    with2FA: number;
    twoFaRate: number;
  };
  threats: {
    failedLogins24h: number;
    fraudFlaggedOrders7d: number;
    disputes7d: number;
  };
  alerts: {
    bySeverity: { severity: string; count: number }[];
  };
}

export interface SecurityAlert {
  id: string;
  userId: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  metadata: Record<string, any> | null;
  isRead: boolean;
  createdAt: string;
  user: {
    id: string;
    email: string;
    profile: { firstName: string | null; lastName: string | null };
  };
}

export interface AlertStats {
  total: number;
  unread: number;
  bySeverity: { severity: string; count: number }[];
  topTypes: { type: string; count: number }[];
}

export interface AlertListResponse {
  alerts: SecurityAlert[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const adminSecurityService = {
  getFraudRules: async (): Promise<FraudRule[]> => {
    const response = await apiClient.get('/admin/security/fraud-rules');
    return response.data;
  },

  updateFraudRule: async (
    ruleId: string,
    data: Partial<Pick<FraudRule, 'enabled' | 'threshold' | 'severity' | 'action'>>,
  ): Promise<FraudRule> => {
    const response = await apiClient.patch(`/admin/security/fraud-rules/${ruleId}`, data);
    return response.data;
  },

  getRiskOverview: async (): Promise<RiskOverview> => {
    const response = await apiClient.get('/admin/security/risk-overview');
    return response.data;
  },

  getAllAlerts: async (
    page = 1,
    limit = 20,
    filters?: { severity?: string; type?: string; userId?: string },
  ): Promise<AlertListResponse> => {
    const params: Record<string, any> = { page, limit };
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params[key] = value;
        }
      });
    }
    const response = await apiClient.get('/admin/security/alerts', { params });
    return response.data;
  },

  getAlertStats: async (): Promise<AlertStats> => {
    const response = await apiClient.get('/admin/security/alerts/stats');
    return response.data;
  },

  markAlertAsRead: async (alertId: string): Promise<void> => {
    await apiClient.patch(`/admin/security/alerts/${alertId}/read`);
  },
};
