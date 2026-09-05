export const resolveApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    // If running in browser and NOT on localhost, use current domain's /api endpoint
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      const env = process.env.NEXT_PUBLIC_API_URL;
      if (env && !env.includes('localhost')) {
        const base = env.replace(/\/+$/, '');
        return base.endsWith('/api') ? base : `${base}/api`;
      }
      return `${origin}/api`;
    }
  }
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) {
    const base = process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
    return base.endsWith('/api') ? base : `${base}/api`;
  }
  return 'http://localhost:3000/api';
};

export const API_URL = resolveApiUrl();

export const resolveProductImageUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  // Relative path (e.g. /uploads/products/...)
  const baseUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:3003');
  return `${baseUrl.replace(/\/+$/, '')}${url.startsWith('/') ? '' : '/'}${url}`;
};