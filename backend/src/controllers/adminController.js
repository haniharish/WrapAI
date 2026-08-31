import { adminService } from '../services/adminService.js';
import { sendSuccess } from '../utils/responseHandler.js';

export const adminController = {
  async getOverview(req, res) {
    const metrics = await adminService.getMetricsOverview();
    sendSuccess(res, metrics, 'Admin overview metrics retrieved');
  },

  async getUsers(req, res) {
    const { users, meta } = await adminService.getAllUsers(req.query);
    sendSuccess(res, users, 'Users retrieved successfully', 200, meta);
  },

  async updateUserStatus(req, res) {
    const updated = await adminService.updateUserStatus(req.params.id, req.body.status);
    sendSuccess(res, updated, 'User status updated successfully');
  },

  async getContent(req, res) {
    const { items, meta } = await adminService.getAllContent(req.query);
    sendSuccess(res, items, 'Content monitoring list retrieved', 200, meta);
  },

  async getProcessing(req, res) {
    const jobs = await adminService.getQueueTelemetry();
    sendSuccess(res, jobs, 'Queue telemetry retrieved');
  },

  async getAnalytics(req, res) {
    const analytics = await adminService.getAnalytics();
    sendSuccess(res, analytics, 'Analytics data retrieved');
  },

  async getSystem(req, res) {
    const system = await adminService.getSystemHealth();
    sendSuccess(res, system, 'System health report retrieved');
  }
};
