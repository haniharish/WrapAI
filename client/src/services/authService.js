import { apiClient } from './api.js';

export const authService = {
  async login(email, password) {
    const response = await apiClient.post('/auth/login', { email, password });
    if (response.data?.token) {
      localStorage.setItem('wrapai_token', response.data.token);
      localStorage.setItem('wrapai_user', JSON.stringify(response.data.user));
    }
    return response;
  },

  async register(data) {
    const response = await apiClient.post('/auth/register', data);
    if (response.data?.token) {
      localStorage.setItem('wrapai_token', response.data.token);
      localStorage.setItem('wrapai_user', JSON.stringify(response.data.user));
    }
    return response;
  },

  async getCurrentUser() {
    const response = await apiClient.get('/auth/me');
    if (response.data) {
      localStorage.setItem('wrapai_user', JSON.stringify(response.data));
    }
    return response;
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('wrapai_token');
      localStorage.removeItem('wrapai_user');
    }
  },

  async forgotPassword(email) {
    return apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(token, newPassword) {
    const response = await apiClient.post('/auth/reset-password', { token, newPassword });
    if (response.data?.token) {
      localStorage.setItem('wrapai_token', response.data.token);
      localStorage.setItem('wrapai_user', JSON.stringify(response.data.user));
    }
    return response;
  }
};
