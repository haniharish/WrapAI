import { workspaceService } from '../services/workspaceService.js';
import { AuditLog } from '../models/AuditLog.js';
import { authorizationService, PERMISSIONS } from '../services/authorizationService.js';

export const workspaceController = {
  async getWorkspaces(req, res, next) {
    try {
      const userId = req.user.id;
      const workspaces = await workspaceService.getUserWorkspaces(userId);
      res.json({
        success: true,
        data: workspaces
      });
    } catch (err) {
      next(err);
    }
  },

  async createWorkspace(req, res, next) {
    try {
      const userId = req.user.id;
      const workspace = await workspaceService.createWorkspace(userId, req.body);
      res.status(201).json({
        success: true,
        data: workspace,
        message: 'Workspace created successfully'
      });
    } catch (err) {
      next(err);
    }
  },

  async getWorkspaceById(req, res, next) {
    try {
      const userId = req.user.id;
      const workspace = await workspaceService.getWorkspaceById(req.params.id, userId);
      res.json({
        success: true,
        data: workspace
      });
    } catch (err) {
      next(err);
    }
  },

  async updateWorkspace(req, res, next) {
    try {
      const userId = req.user.id;
      const workspace = await workspaceService.updateWorkspace(req.params.id, userId, req.body);
      res.json({
        success: true,
        data: workspace,
        message: 'Workspace updated successfully'
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteWorkspace(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await workspaceService.deleteWorkspace(req.params.id, userId);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  async inviteMember(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await workspaceService.inviteMember(req.params.id, userId, req.body);
      res.status(201).json({
        success: true,
        data: result,
        message: 'Invitation generated successfully'
      });
    } catch (err) {
      next(err);
    }
  },

  async acceptInvitation(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await workspaceService.acceptInvitation(req.body.token, userId);
      res.json({
        success: true,
        data: result,
        message: 'Joined workspace successfully'
      });
    } catch (err) {
      next(err);
    }
  },

  async updateMemberRole(req, res, next) {
    try {
      const userId = req.user.id;
      const { memberId } = req.params;
      const { role } = req.body;
      const result = await workspaceService.updateMemberRole(req.params.id, memberId, role, userId);
      res.json({
        success: true,
        data: result,
        message: 'Member role updated successfully'
      });
    } catch (err) {
      next(err);
    }
  },

  async removeMember(req, res, next) {
    try {
      const userId = req.user.id;
      const { memberId } = req.params;
      const result = await workspaceService.removeMember(req.params.id, memberId, userId);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  async getAuditLogs(req, res, next) {
    try {
      const userId = req.user.id;
      const workspaceId = req.params.id;

      const canView = await authorizationService.canAccessWorkspace(userId, workspaceId, PERMISSIONS.WORKSPACE_VIEW);
      if (!canView) {
        return res.status(403).json({
          success: false,
          error: { code: 'ACCESS_DENIED', message: 'Unauthorized to view audit logs' }
        });
      }

      const logs = await AuditLog.find({ workspaceId })
        .populate('userId', 'fullName email')
        .sort({ createdAt: -1 })
        .limit(100)
        .exec();

      res.json({
        success: true,
        data: logs
      });
    } catch (err) {
      next(err);
    }
  }
};
