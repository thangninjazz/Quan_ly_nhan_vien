import axios from 'axios';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function resolveApiUrl(url: string) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
  return `${API_BASE_URL}/${url}`;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add interceptors to handle Token and Tenant ID
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenant_id');

    config.headers = (config.headers || {}) as any;

    if (token) {
      (config.headers as any)['Authorization'] = `Bearer ${token}`;
      (config.headers as any)['authorization'] = `Bearer ${token}`;
    }
    if (tenantId) {
      (config.headers as any)['X-Tenant-Id'] = tenantId;
      (config.headers as any)['x-tenant-id'] = tenantId;
    }
  }
  return config;
});

let isRefreshing = false;
let refreshWaiters: Array<(token: string | null) => void> = [];

function notifyRefreshWaiters(token: string | null) {
  refreshWaiters.forEach((fn) => fn(token));
  refreshWaiters = [];
}

function waitForRefresh(): Promise<string | null> {
  return new Promise((resolve) => {
    refreshWaiters.push(resolve);
  });
}

// Response interceptor to handle errors (e.g. 401 + refresh token rotation)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (typeof window === 'undefined') return Promise.reject(error);

    const originalRequest = error.config as any;
    const status = error.response?.status;

    if (status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refresh_token');
    const tenantId = localStorage.getItem('tenant_id');
    if (!refreshToken || !tenantId) {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (isRefreshing) {
      const newToken = await waitForRefresh();
      if (!newToken) return Promise.reject(error);
      originalRequest._retry = true;
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    }

    try {
      isRefreshing = true;
      const res = await api.post(
        '/auth/refresh',
        { refresh_token: refreshToken },
        { headers: { 'X-Tenant-Id': tenantId } },
      );

      const newAccess = res.data?.access_token as string | undefined;
      const newRefresh = res.data?.refresh_token as string | undefined;

      if (!newAccess || !newRefresh) {
        notifyRefreshWaiters(null);
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      localStorage.setItem('token', newAccess);
      localStorage.setItem('refresh_token', newRefresh);
      if (res.data?.roles) localStorage.setItem('roles', JSON.stringify(res.data.roles));
      if (res.data?.user) localStorage.setItem('user', JSON.stringify(res.data.user));

      notifyRefreshWaiters(newAccess);

      originalRequest._retry = true;
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return api(originalRequest);
    } catch (refreshErr) {
      notifyRefreshWaiters(null);
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  },
);
