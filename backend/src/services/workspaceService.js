import crypto from 'crypto';
import { workspaceRepository } from '../repositories/workspaceRepository.js';
import { authorizationService, PERMISSIONS } from './authorizationService.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { logger } from '../utils/logger.js';

export const workspaceService = {
  /**
   * Ensure user has a default PERSONAL workspace
   */
  async ensurePersonalWorkspace(userId, userFullName = 'My Workspace') {
    let personal = await workspaceRepository.findPersonalByOwnerId(userId);
    if (!personal) {
      personal = await workspaceRepository.createWorkspace({
        name: `${userFullName}'s Space`,
        slug: `personal-${userId.toString().slice(-6)}`,
        ownerId: userId,
        type: 'PERSONAL',
        plan: 'FREE'
      });

      await workspaceRepository.addMember(personal._id, userId, 'OWNER');
      logger.info(`[workspaceService] Provisioned personal workspace for user ${userId}`, { workspaceId: personal._id });
    }
    return personal;
  },

  /**
   * Create a new team workspace
   */
  async createWorkspace(userId, { name, type = 'TEAM', plan = 'FREE' }) {
    if (!name || !name.trim()) {
      throw new Error('Workspace name is required');
    }

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

    const workspace = await workspaceRepository.createWorkspace({
      name: name.trim(),
      slug,
      ownerId: userId,
      type,
      plan
    });

    // Add creator as OWNER member
    await workspaceRepository.addMember(workspace._id, userId, 'OWNER');

    // Audit log
    await AuditLog.create({
      userId,
      workspaceId: workspace._id,
      action: 'WORKSPACE_CREATED',
      resourceType: 'WORKSPACE',
      resourceId: workspace._id,
      metadata: { name: workspace.name, type: workspace.type }
    });

    logger.info(`[workspaceService] Created workspace ${workspace._id} for owner ${userId}`, { name: workspace.name });
    return workspace;
  },

  /**
   * Get all workspaces the user has access to
   */
  async getUserWorkspaces(userId) {
    // 1. Ensure personal workspace exists
    await this.ensurePersonalWorkspace(userId);

    // 2. Fetch all memberships
    const memberships = await workspaceRepository.findMembershipsByUserId(userId);

    return memberships
      .filter((m) => m.workspaceId)
      .map((m) => {
        const ws = m.workspaceId.toJSON ? m.workspaceId.toJSON() : m.workspaceId;
        return {
          ...ws,
          userRole: m.role,
          joinedAt: m.joinedAt
        };
      });
  },

  /**
   * Get workspace details by ID
   */
  async getWorkspaceById(workspaceId, userId) {
    const role = await authorizationService.getUserWorkspaceRole(userId, workspaceId);
    if (!role) {
      throw new Error('You do not have permission to view this workspace');
    }

    const workspace = await workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const members = await workspaceRepository.findMembers(workspaceId);

    return {
      ...(workspace.toJSON ? workspace.toJSON() : workspace),
      userRole: role,
      membersCount: members.length,
      members
    };
  },

  /**
   * Update workspace settings (Owner/Admin only)
   */
  async updateWorkspace(workspaceId, userId, updates) {
    const canUpdate = await authorizationService.canAccessWorkspace(userId, workspaceId, PERMISSIONS.WORKSPACE_UPDATE);
    if (!canUpdate) {
      throw new Error('Insufficient permissions to update workspace');
    }

    const workspace = await workspaceRepository.findById(workspaceId);
    if (!workspace) throw new Error('Workspace not found');

    if (updates.name) workspace.name = updates.name.trim();
    if (updates.settings) {
      workspace.settings = { ...workspace.settings, ...updates.settings };
    }

    await workspace.save();

    await AuditLog.create({
      userId,
      workspaceId,
      action: 'WORKSPACE_UPDATED',
      resourceType: 'WORKSPACE',
      resourceId: workspaceId,
      metadata: updates
    });

    return workspace;
  },

  /**
   * Delete team workspace (Owner only)
   */
  async deleteWorkspace(workspaceId, userId) {
    const workspace = await workspaceRepository.findById(workspaceId);
    if (!workspace) throw new Error('Workspace not found');

    if (workspace.type === 'PERSONAL') {
      throw new Error('Personal default workspace cannot be deleted');
    }

    if (workspace.ownerId.toString() !== userId.toString()) {
      throw new Error('Only the workspace owner can delete this workspace');
    }

    await workspaceRepository.deleteWorkspace(workspaceId);

    await AuditLog.create({
      userId,
      workspaceId,
      action: 'WORKSPACE_DELETED',
      resourceType: 'WORKSPACE',
      resourceId: workspaceId
    });

    return { message: 'Workspace deleted successfully' };
  },

  /**
   * Invite member to workspace using SHA-256 hashed secure token
   */
  async inviteMember(workspaceId, userId, { email, role = 'VIEWER', expiresInDays = 7 }) {
    const canInvite = await authorizationService.canAccessWorkspace(userId, workspaceId, PERMISSIONS.MEMBER_INVITE);
    if (!canInvite) {
      throw new Error('Insufficient permissions to invite members');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const workspace = await workspaceRepository.findById(workspaceId);
    if (!workspace) throw new Error('Workspace not found');

    // Generate random secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const invitation = await workspaceRepository.createInvitation({
      workspaceId,
      invitedEmail: normalizedEmail,
      role,
      tokenHash,
      expiresAt,
      invitedBy: userId,
      status: 'PENDING'
    });

    // Check if recipient already exists as a user and notify them
    const existingUser = await User.findOne({ email: normalizedEmail }).exec();
    if (existingUser) {
      await Notification.create({
        userId: existingUser._id,
        workspaceId,
        type: 'WORKSPACE_INVITE',
        title: `Invited to ${workspace.name}`,
        message: `You have been invited to join "${workspace.name}" as ${role}.`,
        resourceType: 'WORKSPACE',
        resourceId: workspaceId
      });
    }

    await AuditLog.create({
      userId,
      workspaceId,
      action: 'MEMBER_INVITED',
      resourceType: 'WORKSPACE_INVITATION',
      resourceId: invitation._id,
      metadata: { email: normalizedEmail, role }
    });

    return {
      invitationId: invitation._id,
      email: normalizedEmail,
      role,
      expiresAt,
      rawToken, // Sent to inviter / email link
      inviteUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/invite/accept?token=${rawToken}`
    };
  },

  /**
   * Accept workspace invitation
   */
  async acceptInvitation(rawToken, userId) {
    if (!rawToken) throw new Error('Invitation token is required');

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const invitation = await workspaceRepository.findInvitationByTokenHash(tokenHash);

    if (!invitation) {
      throw new Error('Invalid or expired invitation token');
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      await workspaceRepository.updateInvitationStatus(invitation._id, 'EXPIRED');
      throw new Error('Invitation has expired');
    }

    // Add to members
    const member = await workspaceRepository.addMember(
      invitation.workspaceId,
      userId,
      invitation.role
    );

    // Mark invitation ACCEPTED
    await workspaceRepository.updateInvitationStatus(invitation._id, 'ACCEPTED');

    // Notify workspace owner
    const workspace = await workspaceRepository.findById(invitation.workspaceId);
    if (workspace) {
      await Notification.create({
        userId: workspace.ownerId,
        workspaceId: workspace._id,
        type: 'INVITE_ACCEPTED',
        title: 'New Member Joined',
        message: `A new member has joined "${workspace.name}" with role ${invitation.role}.`,
        resourceType: 'WORKSPACE',
        resourceId: workspace._id
      });
    }

    await AuditLog.create({
      userId,
      workspaceId: invitation.workspaceId,
      action: 'MEMBER_JOINED',
      resourceType: 'WORKSPACE_MEMBER',
      resourceId: member._id,
      metadata: { role: invitation.role }
    });

    return { workspace, role: invitation.role };
  },

  /**
   * Update member role
   */
  async updateMemberRole(workspaceId, targetUserId, newRole, requesterUserId) {
    const canUpdateRole = await authorizationService.canAccessWorkspace(requesterUserId, workspaceId, PERMISSIONS.MEMBER_ROLE_UPDATE);
    if (!canUpdateRole) {
      throw new Error('Insufficient permissions to modify member roles');
    }

    const workspace = await workspaceRepository.findById(workspaceId);
    if (!workspace) throw new Error('Workspace not found');

    if (workspace.ownerId.toString() === targetUserId.toString()) {
      throw new Error('Cannot change the role of the workspace owner');
    }

    const updated = await workspaceRepository.updateMemberRole(workspaceId, targetUserId, newRole);
    if (!updated) throw new Error('Member not found in workspace');

    // Notify user
    await Notification.create({
      userId: targetUserId,
      workspaceId,
      type: 'ROLE_CHANGED',
      title: 'Workspace Role Updated',
      message: `Your role in "${workspace.name}" has been updated to ${newRole}.`,
      resourceType: 'WORKSPACE',
      resourceId: workspaceId
    });

    return updated;
  },

  /**
   * Remove member from workspace
   */
  async removeMember(workspaceId, targetUserId, requesterUserId) {
    const canRemove = await authorizationService.canAccessWorkspace(requesterUserId, workspaceId, PERMISSIONS.MEMBER_REMOVE);
    const isSelfLeaving = targetUserId.toString() === requesterUserId.toString();

    if (!canRemove && !isSelfLeaving) {
      throw new Error('Insufficient permissions to remove members');
    }

    const workspace = await workspaceRepository.findById(workspaceId);
    if (!workspace) throw new Error('Workspace not found');

    if (workspace.ownerId.toString() === targetUserId.toString()) {
      throw new Error('Workspace owner cannot be removed');
    }

    await workspaceRepository.removeMember(workspaceId, targetUserId);

    await AuditLog.create({
      userId: requesterUserId,
      workspaceId,
      action: 'MEMBER_REMOVED',
      resourceType: 'WORKSPACE_MEMBER',
      resourceId: targetUserId
    });

    return { message: 'Member removed successfully' };
  }
};
