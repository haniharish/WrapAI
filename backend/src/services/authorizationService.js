import { Workspace } from '../models/Workspace.js';
import { WorkspaceMember } from '../models/WorkspaceMember.js';
import { Content } from '../models/Content.js';
import { Report } from '../models/Report.js';

export const PERMISSIONS = {
  // Content permissions
  CONTENT_VIEW: 'CONTENT_VIEW',
  CONTENT_CREATE: 'CONTENT_CREATE',
  CONTENT_EDIT: 'CONTENT_EDIT',
  CONTENT_DELETE: 'CONTENT_DELETE',
  CONTENT_SHARE: 'CONTENT_SHARE',

  // Report permissions
  REPORT_VIEW: 'REPORT_VIEW',
  REPORT_CREATE: 'REPORT_CREATE',
  REPORT_EDIT: 'REPORT_EDIT',
  REPORT_DELETE: 'REPORT_DELETE',
  REPORT_SHARE: 'REPORT_SHARE',

  // Chat & RAG permissions
  CHAT_VIEW: 'CHAT_VIEW',
  CHAT_CREATE: 'CHAT_CREATE',

  // Comments & Collaboration
  COMMENT_VIEW: 'COMMENT_VIEW',
  COMMENT_CREATE: 'COMMENT_CREATE',
  COMMENT_EDIT: 'COMMENT_EDIT',
  COMMENT_DELETE: 'COMMENT_DELETE',

  // Membership & Administration
  MEMBER_VIEW: 'MEMBER_VIEW',
  MEMBER_INVITE: 'MEMBER_INVITE',
  MEMBER_REMOVE: 'MEMBER_REMOVE',
  MEMBER_ROLE_UPDATE: 'MEMBER_ROLE_UPDATE',

  // Workspace Settings
  WORKSPACE_VIEW: 'WORKSPACE_VIEW',
  WORKSPACE_UPDATE: 'WORKSPACE_UPDATE',
  WORKSPACE_DELETE: 'WORKSPACE_DELETE'
};

const ROLE_PERMISSIONS = {
  OWNER: Object.values(PERMISSIONS),
  ADMIN: [
    PERMISSIONS.CONTENT_VIEW,
    PERMISSIONS.CONTENT_CREATE,
    PERMISSIONS.CONTENT_EDIT,
    PERMISSIONS.CONTENT_DELETE,
    PERMISSIONS.CONTENT_SHARE,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_CREATE,
    PERMISSIONS.REPORT_EDIT,
    PERMISSIONS.REPORT_DELETE,
    PERMISSIONS.REPORT_SHARE,
    PERMISSIONS.CHAT_VIEW,
    PERMISSIONS.CHAT_CREATE,
    PERMISSIONS.COMMENT_VIEW,
    PERMISSIONS.COMMENT_CREATE,
    PERMISSIONS.COMMENT_EDIT,
    PERMISSIONS.COMMENT_DELETE,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.MEMBER_INVITE,
    PERMISSIONS.MEMBER_REMOVE,
    PERMISSIONS.MEMBER_ROLE_UPDATE,
    PERMISSIONS.WORKSPACE_VIEW,
    PERMISSIONS.WORKSPACE_UPDATE
  ],
  EDITOR: [
    PERMISSIONS.CONTENT_VIEW,
    PERMISSIONS.CONTENT_CREATE,
    PERMISSIONS.CONTENT_EDIT,
    PERMISSIONS.CONTENT_DELETE,
    PERMISSIONS.CONTENT_SHARE,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_CREATE,
    PERMISSIONS.REPORT_EDIT,
    PERMISSIONS.REPORT_DELETE,
    PERMISSIONS.REPORT_SHARE,
    PERMISSIONS.CHAT_VIEW,
    PERMISSIONS.CHAT_CREATE,
    PERMISSIONS.COMMENT_VIEW,
    PERMISSIONS.COMMENT_CREATE,
    PERMISSIONS.COMMENT_EDIT,
    PERMISSIONS.COMMENT_DELETE,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.WORKSPACE_VIEW
  ],
  VIEWER: [
    PERMISSIONS.CONTENT_VIEW,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.CHAT_VIEW,
    PERMISSIONS.COMMENT_VIEW,
    PERMISSIONS.COMMENT_CREATE,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.WORKSPACE_VIEW
  ]
};

export const authorizationService = {
  /**
   * Check if a given role has a specific permission
   */
  hasPermission(role, permission) {
    if (!role) return false;
    const permissions = ROLE_PERMISSIONS[role.toUpperCase()] || [];
    return permissions.includes(permission);
  },

  /**
   * Determine user's effective role in a workspace
   */
  async getUserWorkspaceRole(userId, workspaceId) {
    if (!userId || !workspaceId) return null;

    const workspace = await Workspace.findById(workspaceId).exec();
    if (!workspace) return null;

    if (workspace.ownerId.toString() === userId.toString()) {
      return 'OWNER';
    }

    const membership = await WorkspaceMember.findOne({ workspaceId, userId }).exec();
    return membership ? membership.role : null;
  },

  /**
   * Get all workspace IDs that a user is allowed to access
   */
  async getUserAccessibleWorkspaceIds(userId) {
    if (!userId) return [];

    const [ownedWorkspaces, memberWorkspaces] = await Promise.all([
      Workspace.find({ ownerId: userId }).select('_id').exec(),
      WorkspaceMember.find({ userId }).select('workspaceId').exec()
    ]);

    const ids = new Set([
      ...ownedWorkspaces.map((w) => w._id.toString()),
      ...memberWorkspaces.map((m) => m.workspaceId.toString())
    ]);

    return Array.from(ids);
  },

  /**
   * Verify if a user can perform an action on a workspace
   */
  async canAccessWorkspace(userId, workspaceId, permission = PERMISSIONS.WORKSPACE_VIEW) {
    const role = await this.getUserWorkspaceRole(userId, workspaceId);
    if (!role) return false;
    return this.hasPermission(role, permission);
  },

  /**
   * Check if a user can access a content item
   */
  async canAccessContent(userId, contentId, permission = PERMISSIONS.CONTENT_VIEW) {
    const content = await Content.findById(contentId).exec();
    if (!content || content.isDeleted) return false;

    // Direct content creator/owner always has access
    if (content.userId.toString() === userId.toString()) {
      return true;
    }

    // If assigned to a team workspace, check workspace role & permission
    if (content.workspaceId) {
      const role = await this.getUserWorkspaceRole(userId, content.workspaceId);
      if (role && this.hasPermission(role, permission)) {
        return true;
      }
    }

    return false;
  }
};
