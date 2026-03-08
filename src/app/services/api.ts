import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    const method = String(config.method || '').toLowerCase();
    const url = String(config.url || '');
    const isLeaveApply = method === 'post' && url.includes('/leaves/apply');

    if (isLeaveApply && !config.headers?.['x-idempotency-key']) {
      const idempotencyKey =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      config.headers = config.headers || {};
      config.headers['x-idempotency-key'] = idempotencyKey;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors and unwrap data
api.interceptors.response.use(
  (response) => {
    // If the backend wrapped the actual payload in a 'data' property
    // (e.g. { success: true, data: { ... } }), flatten it into the main data object.
    if (response.data && response.data.success && response.data.data) {
      response.data = { ...response.data, ...response.data.data };
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && (sessionStorage.getItem('user') || sessionStorage.getItem('token'))) {
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
