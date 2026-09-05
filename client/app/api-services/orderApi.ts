import axios from 'axios';
import { getApiBase } from '@/app/utils/api';
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

export const orderApi = {
  placeWholesaleOrder: (payload: any, token: string) =>
    axios.post(`${getApiBase()}/api/orders/wholesale`, payload, { headers: auth(token) }),

  getMyWholesaleOrders: (buyerId: string, token: string) =>
    axios.get(`${getApiBase()}/api/orders/buyer/${buyerId}`, { headers: auth(token) }),

  getInvoice: (orderId: string) =>
    axios.get(`${getApiBase()}/api/orders/${orderId}/invoice`),

  getInvoicePdfUrl: (orderId: string) =>
    `${getApiBase()}/api/orders/${orderId}/invoice/pdf`,
};
