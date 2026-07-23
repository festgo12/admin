import apiClient from '@/lib/api-client';

export interface HelpContentItem {
  id: string;
  category: string;
  title: string;
  content: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HelpContentPayload {
  category: string;
  title: string;
  content: string;
  sortOrder?: number;
  active?: boolean;
}

export const helpCenterService = {
  getAllContent: async (): Promise<HelpContentItem[]> => {
    const response = await apiClient.get('/help/admin/content');
    return response.data;
  },

  createItem: async (data: HelpContentPayload): Promise<HelpContentItem> => {
    const response = await apiClient.post('/help/admin/content', data);
    return response.data;
  },

  updateItem: async (id: string, data: Partial<HelpContentPayload>): Promise<HelpContentItem> => {
    const response = await apiClient.patch(`/help/admin/content/${id}`, data);
    return response.data;
  },

  deleteItem: async (id: string): Promise<void> => {
    await apiClient.delete(`/help/admin/content/${id}`);
  },
};
