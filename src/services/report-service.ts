import apiClient from '@/lib/api-client';

export interface DailyReportData {
  id: string;
  date: string;
  platformFeesNgn: number;
  tradingVolumeNgn: number;
  tradingVolumeUsd: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  depositsNgn: number;
  depositCount: number;
  withdrawalsNgn: number;
  withdrawalCount: number;
  giftCardVolumeNgn: number;
  giftCardCount: number;
  newUsers: number;
  totalUsers: number;
  newDisputes: number;
  resolvedDisputes: number;
  fraudEvents: number;
}

export interface ReportOverview {
  series: DailyReportData[];
  summary: {
    platformFeesNgn: number;
    tradingVolumeNgn: number;
    tradingVolumeUsd: number;
    totalOrders: number;
    completedOrders: number;
    depositsNgn: number;
    depositCount: number;
    withdrawalsNgn: number;
    withdrawalCount: number;
    giftCardVolumeNgn: number;
    giftCardCount: number;
    newUsers: number;
    totalUsers: number;
    newDisputes: number;
    resolvedDisputes: number;
    fraudEvents: number;
  };
}

export interface ReportCategoryResponse {
  series: DailyReportData[];
  summary: Record<string, number>;
}

export type ReportCategory =
  | 'revenue'
  | 'trading-volume'
  | 'deposits'
  | 'withdrawals'
  | 'gift-cards'
  | 'user-growth'
  | 'disputes'
  | 'fraud';

export const reportService = {
  getOverview: async (startDate: string, endDate: string): Promise<ReportOverview> => {
    const response = await apiClient.get('/admin/reports/overview', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getLiveStats: async (): Promise<Record<string, number>> => {
    const response = await apiClient.get('/admin/reports/live');
    return response.data;
  },

  getReport: async (
    category: ReportCategory,
    startDate: string,
    endDate: string,
  ): Promise<ReportCategoryResponse> => {
    const response = await apiClient.get(`/admin/reports/${category}`, {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getExportData: async (
    category: ReportCategory,
    startDate: string,
    endDate: string,
  ): Promise<{ filename: string; contentType: string; content: string }> => {
    const response = await apiClient.get('/admin/reports/export/csv', {
      params: { category, startDate, endDate },
    });
    return response.data;
  },

  getPdfData: async (
    category: ReportCategory,
    startDate: string,
    endDate: string,
  ) => {
    const response = await apiClient.get('/admin/reports/export/pdf', {
      params: { category, startDate, endDate },
    });
    return response.data;
  },

  generateReport: async (date: string) => {
    const response = await apiClient.post(`/admin/reports/generate/${date}`);
    return response.data;
  },
};
