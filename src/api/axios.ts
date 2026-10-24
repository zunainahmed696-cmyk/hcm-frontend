import axios from 'axios';

const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const envUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const defaultBackend = isLocalhost
  ? 'http://localhost:5000/api'
  : 'https://hcm-backend-q34w.vercel.app/api';

const api = axios.create({
  baseURL: envUrl || defaultBackend,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const PUBLIC_PATHS = ['/login', '/setup'];

// Response interceptor: expired token -> login; temp password -> forced change
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const path = window.location.pathname;
    if (error.response?.status === 401 && !PUBLIC_PATHS.includes(path) && error.config?.url !== '/auth/login') {
      localStorage.removeItem('token');
      window.location.href = '/login?expired=true';
    }
    if (error.response?.data?.code === 'PASSWORD_CHANGE_REQUIRED' && path !== '/change-password') {
      window.location.href = '/change-password';
    }
    return Promise.reject(error);
  }
);

export const errorMessage = (error: any, fallback = 'Something went wrong. Please try again.'): string =>
  error?.response?.data?.message || (error?.request ? 'Cannot reach the server. Is the backend running?' : fallback);

export default api;
