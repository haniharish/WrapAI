import apiClient from './api.js';

export const workspaceService = {
  async getWorkspaces() {
    return apiClient.get('/workspaces');
  },

  async createWorkspace(data) {
    return apiClient.post('/workspaces', data);
  },

  async getWorkspaceById(id) {
    return apiClient.get(`/workspaces/${id}`);
  },

  async updateWorkspace(id, data) {
    return apiClient.put(`/workspaces/${id}`, data);
  },

  async deleteWorkspace(id) {
    return apiClient.delete(`/workspaces/${id}`);
  },

  async inviteMember(workspaceId, { email, role }) {
    return apiClient.post(`/workspaces/${workspaceId}/invitations`, { email, role });
  },

  async acceptInvitation(token) {
    return apiClient.post('/workspaces/invitations/accept', { token });
  },

  async updateMemberRole(workspaceId, memberId, role) {
    return apiClient.put(`/workspaces/${workspaceId}/members/${memberId}`, { role });
  },

  async removeMember(workspaceId, memberId) {
    return apiClient.delete(`/workspaces/${workspaceId}/members/${memberId}`);
  },

  async getAuditLogs(workspaceId) {
    return apiClient.get(`/workspaces/${workspaceId}/audit-logs`);
  }
};
