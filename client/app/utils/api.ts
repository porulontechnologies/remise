export const getApiBase = (): string => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return window.location.origin;
    }
  }
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }
  return 'http://localhost:3000';
};

export const getApiUrl = (): string => {
  const base = getApiBase();
  return `${base}/api`;
};

export const resolveApiUrl = getApiUrl;
export const resolveApiBase = getApiBase;

export const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
  ? `${window.location.origin}/api`
  : (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL
      ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '')}/api`
      : 'http://localhost:3000/api');

export const resolveProductImageUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  // Relative path (e.g. /uploads/products/...)
  const baseUrl = getApiBase();
  return `${baseUrl.replace(/\/+$/, '')}${url.startsWith('/') ? '' : '/'}${url}`;
};