import apiClient from '@/lib/api-client';

export interface GiftCardListingAdmin {
  id: string;
  sellerId: string;
  brand: string;
  cardCode: string;
  cardPin: string | null;
  denomination: number;
  cardCurrency: string;
  exchangeRate: number;
  askingPriceNgn: number;
  status: string;
  evidenceUrls: string[];
  moderatorId: string | null;
  moderatorNote: string | null;
  createdAt: string;
  updatedAt: string;
  seller: {
    email: string;
    profile: {
      firstName: string;
      lastName: string;
      kycStatus: string;
    };
  };
  moderator?: {
    email: string;
    profile: {
      firstName: string;
      lastName: string;
    };
  } | null;
  evidenceRecords?: Array<{
    id: string;
    fileUrl: string;
    fileType: string;
    uploadedBy: string;
    createdAt: string;
  }>;
  orders?: GiftCardOrderAdmin[];
}

export interface GiftCardOrderAdmin {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  status: string;
  denomination: number;
  cardCurrency: string;
  askingPriceNgn: number;
  feeAmount: number;
  totalPaidNgn: number;
  createdAt: string;
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
  listing?: {
    brand: string;
    cardCode: string;
    cardPin: string | null;
  };
}

export interface GiftCardStats {
  totalListings: number;
  pendingReview: number;
  activeListings: number;
  totalOrders: number;
  completedOrders: number;
  totalVolumeNgn: number;
}

export interface GiftCardFilters {
  brand?: string;
  status?: string;
  search?: string;
}

export const giftCardAdminService = {
  getStats: async (): Promise<GiftCardStats> => {
    const response = await apiClient.get('/admin/gift-cards/stats');
    return response.data;
  },

  getListings: async (page = 1, limit = 10, filters: GiftCardFilters = {}) => {
    const response = await apiClient.get('/admin/gift-cards/listings', {
      params: { page, limit, ...filters },
    });
    return response.data;
  },

  getListingDetail: async (id: string): Promise<GiftCardListingAdmin> => {
    const response = await apiClient.get(`/admin/gift-cards/listings/${id}`);
    return response.data;
  },

  moderateListing: async (id: string, status: string, moderatorNote?: string) => {
    const response = await apiClient.patch(`/admin/gift-cards/listings/${id}/moderate`, {
      status,
      moderatorNote,
    });
    return response.data;
  },

  getOrders: async (page = 1, limit = 10, filters: GiftCardFilters = {}) => {
    const response = await apiClient.get('/admin/gift-cards/orders', {
      params: { page, limit, ...filters },
    });
    return response.data;
  },

  getOrderDetail: async (id: string): Promise<GiftCardOrderAdmin> => {
    const response = await apiClient.get(`/admin/gift-cards/orders/${id}`);
    return response.data;
  },
};
