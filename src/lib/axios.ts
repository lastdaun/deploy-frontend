// src/lib/axios.ts
import { useAuthStore } from '@/features/auth/stores/useAuthStore';
import axios from 'axios';

const DEFAULT_API_URL = 'https://ge-optimis-production.up.railway.app/optics';

const rawBaseUrl = import.meta.env.VITE_API_URL || DEFAULT_API_URL;
const normalizedBaseUrl = rawBaseUrl.replace(/\/$/, '');

/** Base URL API (ảnh tĩnh /uploads/... cùng host với axios) */
export const API_BASE_URL = normalizedBaseUrl;

export const api = axios.create({
  baseURL: normalizedBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Request Interceptor: Gắn Token
api.interceptors.request.use(
  (config) => {
    // Gọi .getState() để lấy dữ liệu store bên ngoài React Component
    const token = useAuthStore.getState().token;

    if (config.data instanceof FormData && config.headers) {
      // Bắt buộc để trình duyệt/axios gắn boundary cho multipart; default json sẽ gây 415 trên server
      const h = config.headers as unknown as { delete?: (k: string) => void };
      if (typeof h.delete === 'function') {
        h.delete('Content-Type');
        h.delete('content-type');
      } else {
        delete (config.headers as Record<string, unknown>)['Content-Type'];
        delete (config.headers as Record<string, unknown>)['content-type'];
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 2. Response Interceptor: Xử lý data và lỗi 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Nếu lỗi 401 (Unauthorized) -> Token hết hạn hoặc không hợp lệ
    if (error.response?.status === 401 && useAuthStore.getState().token) {
      // Có session (token) mà bị 401 → token hết hạn / không hợp lệ
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);
