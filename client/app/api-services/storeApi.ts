import axios from 'axios';
import { getApiBase } from '@/app/utils/api';

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

export const storeApi = {
  register: (formData: FormData, token: string) =>
    axios.post(`${getApiBase()}/api/stores`, formData, {
      headers: authHeaders(token)   // let axios set Content-Type + boundary automatically
    }),

  getMyStore: (token: string) =>
    axios.get(`${getApiBase()}/api/stores/me/my-store`, { headers: authHeaders(token) }),

  getById: (id: string) =>
    axios.get(`${getApiBase()}/api/stores/${id}`),

  getStoresByOwnerIds: (ownerIds: string[], token: string) =>
    axios.post(`${getApiBase()}/api/stores/by-owners`, { ownerIds }, { headers: authHeaders(token) }),

  update: (id: string, formData: FormData, token: string) =>
    axios.put(`${getApiBase()}/api/stores/${id}`, formData, {
      headers: authHeaders(token)
    }),

  getAll: () =>
    axios.get(`${getApiBase()}/api/stores`),

  getByIds: (ids: string[]) =>
    axios.post(`${getApiBase()}/api/stores/batch`, { ids }),

  onboardRazorpay: (data: any, token: string) =>
    axios.post(`${getApiBase()}/api/stores/me/razorpay-onboard`, data, { headers: authHeaders(token) }),

  getRazorpayStatus: (token: string) =>
    axios.get(`${getApiBase()}/api/stores/me/razorpay-status`, { headers: authHeaders(token) }),
};

