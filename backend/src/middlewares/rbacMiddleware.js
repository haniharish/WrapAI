import { authorizationService, PERMISSIONS } from '../services/authorizationService.js';
import { Workspace } from '../models/Workspace.js';
import { Content } from '../models/Content.js';

/**
 * Middleware to require a specific permission in a workspace context
 */
export function requireWorkspacePermission(permission) {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id || req.user?._id;
      const workspaceId = req.params.workspaceId || req.params.id || req.body.workspaceId || req.query.workspaceId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        });
      }

      if (!workspaceId) {
        return res.status(400).json({
          success: false,
          error: { code: 'WORKSPACE_ID_REQUIRED', message: 'Workspace ID is required' }
        });
      }

      const role = await authorizationService.getUserWorkspaceRole(userId, workspaceId);
      if (!role) {
        return res.status(403).json({
          success: false,
          error: { code: 'WORKSPACE_ACCESS_DENIED', message: 'You are not a member of this workspace' }
        });
      }

      if (!authorizationService.hasPermission(role, permission)) {
        return res.status(403).json({
          success: false,
          error: { code: 'INSUFFICIENT_PERMISSIONS', message: `Permission '${permission}' denied for role '${role}'` }
        });
      }

      req.workspaceRole = role;
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Middleware to verify user has access to a specific content item
 */
export function requireContentAccess(permission = PERMISSIONS.CONTENT_VIEW) {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id || req.user?._id;
      const contentId = req.params.contentId || req.params.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        });
      }

      if (!contentId) {
        return res.status(400).json({
          success: false,
          error: { code: 'CONTENT_ID_REQUIRED', message: 'Content ID is required' }
        });
      }

      const hasAccess = await authorizationService.canAccessContent(userId, contentId, permission);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: { code: 'CONTENT_ACCESS_DENIED', message: 'You do not have permission to access this content' }
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
