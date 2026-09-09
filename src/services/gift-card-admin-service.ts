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

// ─── Gift Card Store (Reloadly) ─────────────────────────────────────────────

export interface StoreStats {
  totalProducts: number;
  enabledProducts: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  failedOrders: number;
  totalVolumeNgn: number | string;
}

export interface StoreBrandAdmin {
  id: string;
  providerBrandId: number;
  brandName: string;
  logoUrl: string | null;
  backgroundColor: string | null;
}

export interface StoreProductAdmin {
  id: string;
  providerProductId: number;
  productName: string;
  brand: StoreBrandAdmin | null;
  countryCode: string;
  currencyCode: string;
  denominationType: string;
  fixedDenominations: number[];
  minDenomination: number | string | null;
  maxDenomination: number | string | null;
  senderFee: number | string;
  discountPercentage: number | string;
  providerPriceNgn: number | string;
  markupPercent: number | string;
  enabled: boolean;
  lastSyncedAt: string | null;
}

export interface StoreOrderAdmin {
  id: string;
  productId: string;
  denomination: number | string;
  currencyCode: string;
  quantity: number;
  status: string;
  providerOrderId: string | null;
  costNgn: number | string;
  sellPriceNgn: number | string;
  feeNgn: number | string;
  recipientEmail: string | null;
  cardCode: string | null;
  cardPin: string | null;
  failureMessage: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    email: string;
    profile: {
      firstName: string | null;
      lastName: string | null;
    } | null;
  };
  product: {
    productName: string;
    countryCode: string;
    currencyCode: string;
    brand: {
      brandName: string;
      logoUrl: string | null;
      backgroundColor: string | null;
    } | null;
  } | null;
}

export interface StoreProductFilters {
  brand?: string;
  search?: string;
  denominationType?: string;
}

export interface StoreOrderFilters {
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

  // ─── Gift Card Store (Reloadly) ────────────────────────────────────────

  getStoreStats: async (): Promise<StoreStats> => {
    const response = await apiClient.get('/admin/gift-card-store/stats');
    return response.data;
  },

  syncStoreCatalog: async (countries?: string[]) => {
    const response = await apiClient.post('/admin/gift-card-store/sync', { countries });
    return response.data;
  },

  getStoreProducts: async (page = 1, limit = 20, filters: StoreProductFilters = {}) => {
    const response = await apiClient.get('/admin/gift-card-store/products', {
      params: { page, limit, ...filters },
    });
    return response.data;
  },

  updateStoreProduct: async (
    id: string,
    data: { enabled?: boolean; markupPercent?: number },
  ) => {
    const response = await apiClient.patch(`/admin/gift-card-store/products/${id}`, data);
    return response.data;
  },

  getStoreOrders: async (page = 1, limit = 20, filters: StoreOrderFilters = {}) => {
    const response = await apiClient.get('/admin/gift-card-store/orders', {
      params: { page, limit, ...filters },
    });
    return response.data;
  },

  getStoreOrderDetail: async (id: string): Promise<StoreOrderAdmin> => {
    const response = await apiClient.get(`/admin/gift-card-store/orders/${id}`);
    return response.data;
  },
};
