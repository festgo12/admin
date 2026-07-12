import apiClient from '@/lib/api-client';

export interface NotificationTemplate {
  id: string;
  type: string;
  name: string;
  emailSubject: string | null;
  emailBody: string | null;
  pushTitle: string | null;
  pushBody: string | null;
  inAppTitle: string;
  inAppBody: string;
  smsBody: string | null;
  systemBody: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationLog {
  id: string;
  userId: string;
  type: string;
  channel: 'IN_APP' | 'PUSH' | 'EMAIL' | 'SYSTEM';
  recipient: string;
  title: string;
  body: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'RETRYING';
  retryCount: number;
  maxRetries: number;
  nextTryAt: string | null;
  errorDetails: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  user: {
    email: string;
    phone: string | null;
  };
}

export interface LogResponse {
  logs: NotificationLog[];
  total?: number;
}

export interface TemplatePayload {
  name?: string;
  emailSubject?: string;
  emailBody?: string;
  pushTitle?: string;
  pushBody?: string;
  inAppTitle?: string;
  inAppBody?: string;
  smsBody?: string;
  systemBody?: string;
}

export const notificationService = {
  getTemplates: async (): Promise<NotificationTemplate[]> => {
    const response = await apiClient.get('/notifications/admin/templates');
    return response.data;
  },

  createOrUpdateTemplate: async (type: string, data: TemplatePayload): Promise<NotificationTemplate> => {
    const response = await apiClient.post(`/notifications/admin/templates/${type}`, data);
    return response.data;
  },

  getLogs: async (page = 1, limit = 20): Promise<LogResponse> => {
    const offset = (page - 1) * limit;
    const response = await apiClient.get('/notifications/admin/logs', {
      params: { limit, offset },
    });
    return response.data;
  },

  resendNotification: async (id: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/notifications/admin/logs/${id}/resend`);
    return response.data;
  },
};
