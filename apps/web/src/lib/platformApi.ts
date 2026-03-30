import axios from 'axios';
import { API_BASE_URL } from './api';

export const platformApi = axios.create({
  baseURL: API_BASE_URL,
});

platformApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('platform_token');
    if (token) {
      config.headers = (config.headers || {}) as any;
      (config.headers as any)['Authorization'] = `Bearer ${token}`;
      (config.headers as any)['authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

