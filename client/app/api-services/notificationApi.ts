import axios from 'axios';
import { getApiBase } from '@/app/utils/api';

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

export const notificationApi = {
  getVapidKey: () =>
    axios.get(`${getApiBase()}/api/notifications/vapid-public-key`),

  subscribe: (subscription: PushSubscriptionJSON, lat: number, lng: number, token: string) =>
    axios.post(`${getApiBase()}/api/notifications/subscribe`, { subscription, latitude: lat, longitude: lng }, {
      headers: authHeaders(token)
    }),

  updateLocation: (lat: number, lng: number, token: string) =>
    axios.put(`${getApiBase()}/api/notifications/location`, { latitude: lat, longitude: lng }, {
      headers: authHeaders(token)
    }),

  getAll: (token: string) =>
    axios.get(`${getApiBase()}/api/notifications`, { headers: authHeaders(token) }),

  markRead: (id: string, token: string) =>
    axios.patch(`${getApiBase()}/api/notifications/${id}/read`, {}, { headers: authHeaders(token) }),

  markAllRead: (token: string) =>
    axios.patch(`${getApiBase()}/api/notifications/read-all`, {}, { headers: authHeaders(token) }),
};

