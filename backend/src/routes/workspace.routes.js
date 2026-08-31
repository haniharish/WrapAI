import { Router } from 'express';
import { workspaceController } from '../controllers/workspaceController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requireWorkspacePermission } from '../middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '../services/authorizationService.js';

const router = Router();

// All workspace routes require authentication
router.use(authenticate);

// Workspace listing & creation
router.get('/', workspaceController.getWorkspaces);
router.post('/', workspaceController.createWorkspace);

// Accept invitation
router.post('/invitations/accept', workspaceController.acceptInvitation);

// Workspace by ID
router.get('/:id', workspaceController.getWorkspaceById);
router.put('/:id', requireWorkspacePermission(PERMISSIONS.WORKSPACE_UPDATE), workspaceController.updateWorkspace);
router.delete('/:id', workspaceController.deleteWorkspace);

// Member management
router.post('/:id/invitations', requireWorkspacePermission(PERMISSIONS.MEMBER_INVITE), workspaceController.inviteMember);
router.put('/:id/members/:memberId', requireWorkspacePermission(PERMISSIONS.MEMBER_ROLE_UPDATE), workspaceController.updateMemberRole);
router.delete('/:id/members/:memberId', workspaceController.removeMember);

// Audit logs
router.get('/:id/audit-logs', workspaceController.getAuditLogs);

export default router;
