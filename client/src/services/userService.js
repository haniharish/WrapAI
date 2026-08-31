import { apiClient } from './api.js';

export const userService = {
  async getProfile() {
    return apiClient.get('/users/me');
  },

  async updateProfile(data) {
    const response = await apiClient.patch('/users/me', data);
    if (response.data) {
      localStorage.setItem('wrapai_user', JSON.stringify(response.data));
    }
    return response;
  },

  async changePassword(currentPassword, newPassword) {
    return apiClient.patch('/users/me/password', { currentPassword, newPassword });
  },

  async deleteAccount() {
    return apiClient.delete('/users/me');
  }
};
