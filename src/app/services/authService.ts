import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  department: string;
  designation?: string;
  phone?: string;
}

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post('/auth/login', credentials);
    const data = response.data?.data || response.data;
    if (data?.user) {
      sessionStorage.setItem('user', JSON.stringify(data.user));
    }
    if (data?.token) {
      sessionStorage.setItem('token', data.token);
    }
    return response;
  },

  register: async (data: RegisterData) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
    }
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    sessionStorage.setItem('user', JSON.stringify(response.data.data.user));
    return response.data.data.user;
  },

  updatePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.put('/auth/update-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};
