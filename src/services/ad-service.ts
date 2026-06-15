import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const adService = {
  async getAllAds(token: string) {
    const response = await axios.get(`${API_URL}/marketplace/listings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async updateAd(token: string, id: string, data: any) {
    const response = await axios.put(`${API_URL}/marketplace/ads/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async deleteAd(token: string, id: string) {
    const response = await axios.delete(`${API_URL}/marketplace/ads/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
