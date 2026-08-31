import { mockUsers } from '../mocks/mockUsers.js';
import { mockDelay, createApiResponse } from './api.js';

export const authService = {
  async login(email, password) {
    await mockDelay(400);
    const user = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()) || {
      id: 'usr_demo',
      fullName: email.split('@')[0],
      email: email,
      role: email.includes('admin') ? 'ADMIN' : 'USER',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      joinedAt: new Date().toISOString(),
      storageUsedBytes: 500000000,
      storageLimitBytes: 5368709120,
      contentCount: 4,
      status: 'ACTIVE',
      timezone: 'UTC'
    };
    return createApiResponse({
      user,
      token: 'mock_jwt_token_sample'
    }, 'Authentication successful');
  },

  async register(data) {
    await mockDelay(500);
    const newUser = {
      id: `usr_${Date.now()}`,
      fullName: data.fullName,
      email: data.email,
      role: 'USER',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      joinedAt: new Date().toISOString(),
      storageUsedBytes: 0,
      storageLimitBytes: 5368709120,
      contentCount: 0,
      status: 'ACTIVE',
      timezone: 'UTC'
    };
    return createApiResponse({
      user: newUser,
      token: 'mock_jwt_token_sample'
    }, 'Registration successful');
  },

  async getCurrentUser() {
    await mockDelay(200);
    return createApiResponse(mockUsers[0]);
  },

  async logout() {
    await mockDelay(150);
    return createApiResponse(null, 'Logged out successfully');
  }
};
