import axios from 'axios';
import { getApiBase } from '@/app/utils/api';

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

export const offersApi = {
  create: (formData: FormData, token: string) =>
    axios.post(`${getApiBase()}/api/offers`, formData, {
      headers: authHeaders(token)
    }),

  getNearby: (lat: number, lng: number, radius = 10) =>
    axios.get(`${getApiBase()}/api/offers/nearby`, { params: { lat, lng, radius } }),

  getByStore: (storeId: string) =>
    axios.get(`${getApiBase()}/api/offers/store/${storeId}`),

  getById: (id: string) =>
    axios.get(`${getApiBase()}/api/offers/${id}`),

  getActive: (limit = 5) =>
    axios.get(`${getApiBase()}/api/offers/active`, { params: { limit } }),

  update: (id: string, formData: FormData, token: string) =>
    axios.put(`${getApiBase()}/api/offers/${id}`, formData, {
      headers: authHeaders(token)
    }),

  delete: (id: string, token: string) =>
    axios.delete(`${getApiBase()}/api/offers/${id}`, { headers: authHeaders(token) }),

  placeOrder: (offerId: string, orderData: Record<string, any>) =>
    axios.post(`${getApiBase()}/api/offers/${offerId}/order`, orderData),

  getMyOrders: (token: string, email?: string) =>
    axios.get(`${getApiBase()}/api/offers/orders/my`, {
      headers: authHeaders(token),
      params: email ? { email } : {}
    }),

  getStoreOrders: (storeId: string, token: string) =>
    axios.get(`${getApiBase()}/api/offers/orders/store/${storeId}`, { headers: authHeaders(token) }),

  updateOrderStatus: (orderId: string, status: string, token: string) =>
    axios.patch(`${getApiBase()}/api/offers/orders/${orderId}/status`, { status }, { headers: authHeaders(token) }),

  getMyOffers: (token: string) =>
    axios.get(`${getApiBase()}/api/offers/my`, { headers: authHeaders(token) }),
};

