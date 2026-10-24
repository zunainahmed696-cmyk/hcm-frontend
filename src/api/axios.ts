import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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
