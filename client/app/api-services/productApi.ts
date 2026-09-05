import axios from 'axios';
import { getApiBase } from '@/app/utils/api';

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

export const productApi = {
  // ── Public ──────────────────────────────────────────────────────────────────
  getAll: (params?: Record<string, string | number>) =>
    axios.get(`${getApiBase()}/api/products`, { params }),

  getById: (id: string) =>
    axios.get(`${getApiBase()}/api/products/${id}`),

  getByStore: (storeId: string, params?: Record<string, string | number>) =>
    axios.get(`${getApiBase()}/api/products/store/${storeId}`, { params }),

  getCategories: () =>
    axios.get(`${getApiBase()}/api/categories`),

  // productApi.ts — add
  getSuppliers: (ownerRole: 'whole_saler' | 'home_business', params?: Record<string, string | number | undefined>) =>
    axios.get(`${getApiBase()}/api/products`, { params: { ...params, ownerRole } }),

  getGroupedSuppliers: (ownerRole: 'whole_saler' | 'home_business', params?: Record<string, string | number | undefined>) =>
    axios.get(`${getApiBase()}/api/products/suppliers-grouped`, { params: { ...params, ownerRole } }),

  // ── Store Owner / Admin ──────────────────────────────────────────────────────
  create: (formData: FormData, token: string) =>
    axios.post(`${getApiBase()}/api/products`, formData, { headers: auth(token) }),

  update: (id: string, formData: FormData, token: string) =>
    axios.put(`${getApiBase()}/api/products/${id}`, formData, { headers: auth(token) }),

  delete: (id: string, token: string) =>
    axios.delete(`${getApiBase()}/api/products/${id}`, { headers: auth(token) }),

  createCategory: (name: string, token: string) =>
    axios.post(`${getApiBase()}/api/categories`, { name }, { headers: auth(token) }),

  deleteCategory: (id: string, token: string) =>
    axios.delete(`${getApiBase()}/api/categories/${id}`, { headers: auth(token) }),
};

