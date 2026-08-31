import { Workspace } from '../models/Workspace.js';
import { WorkspaceMember } from '../models/WorkspaceMember.js';
import { WorkspaceInvitation } from '../models/WorkspaceInvitation.js';

export const workspaceRepository = {
  async createWorkspace(data) {
    return Workspace.create(data);
  },

  async findById(workspaceId) {
    return Workspace.findById(workspaceId).exec();
  },

  async findPersonalByOwnerId(ownerId) {
    return Workspace.findOne({ ownerId, type: 'PERSONAL' }).exec();
  },

  async findByOwnerId(ownerId) {
    return Workspace.find({ ownerId }).sort({ createdAt: -1 }).exec();
  },

  async findMembershipsByUserId(userId) {
    return WorkspaceMember.find({ userId })
      .populate('workspaceId')
      .exec();
  },

  async addMember(workspaceId, userId, role = 'VIEWER') {
    return WorkspaceMember.findOneAndUpdate(
      { workspaceId, userId },
      { workspaceId, userId, role, joinedAt: new Date() },
      { upsert: true, new: true }
    );
  },

  async findMember(workspaceId, userId) {
    return WorkspaceMember.findOne({ workspaceId, userId }).exec();
  },

  async findMembers(workspaceId) {
    return WorkspaceMember.find({ workspaceId })
      .populate('userId', 'fullName email avatar role')
      .sort({ joinedAt: 1 })
      .exec();
  },

  async updateMemberRole(workspaceId, userId, role) {
    return WorkspaceMember.findOneAndUpdate(
      { workspaceId, userId },
      { role },
      { new: true }
    );
  },

  async removeMember(workspaceId, userId) {
    return WorkspaceMember.findOneAndDelete({ workspaceId, userId });
  },

  async createInvitation(data) {
    return WorkspaceInvitation.create(data);
  },

  async findInvitationByTokenHash(tokenHash) {
    return WorkspaceInvitation.findOne({ tokenHash, status: 'PENDING' }).exec();
  },

  async findInvitationsByWorkspace(workspaceId) {
    return WorkspaceInvitation.find({ workspaceId, status: 'PENDING' })
      .populate('invitedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .exec();
  },

  async updateInvitationStatus(invitationId, status) {
    return WorkspaceInvitation.findByIdAndUpdate(invitationId, { status }, { new: true });
  },

  async deleteWorkspace(workspaceId) {
    await Promise.all([
      Workspace.findByIdAndDelete(workspaceId),
      WorkspaceMember.deleteMany({ workspaceId }),
      WorkspaceInvitation.deleteMany({ workspaceId })
    ]);
  }
};
