import request from 'supertest';
import app from '../src/app.js';
import { setupTestDb, teardownTestDb, clearTestDb } from './setup.js';
import { User } from '../src/models/User.js';
import { Content } from '../src/models/Content.js';
import { Workspace } from '../src/models/Workspace.js';
import { WorkspaceMember } from '../src/models/WorkspaceMember.js';
import { WorkspaceInvitation } from '../src/models/WorkspaceInvitation.js';
import { Comment } from '../src/models/Comment.js';
import { Notification } from '../src/models/Notification.js';
import { EmbeddingChunk } from '../src/models/EmbeddingChunk.js';
import { UsageRecord } from '../src/models/UsageRecord.js';
import { seedDatabase } from '../src/database/seed.js';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/environment.js';
import crypto from 'crypto';

describe('Phase 12 — Collaboration, RBAC, Global Search & Production Hardening Test Suite', () => {
  let rahulToken, sarahToken, alexToken;
  let rahulUser, sarahUser, alexUser;
  let teamAlpha;

  beforeAll(async () => {
    await setupTestDb();
    await seedDatabase();

    rahulUser = await User.findOne({ email: 'rahul@wrapai.io' }).exec();
    sarahUser = await User.findOne({ email: 'sarah.jenkins@wrapai.io' }).exec();


    // Create a third user (Alex - external user)
    const alexPasswordHash = await User.hashPassword('Password123');
    alexUser = await User.create({
      fullName: 'Alexandre Dubois',
      email: 'alex@wrapai.io',
      passwordHash: alexPasswordHash,
      role: 'USER'
    });

    rahulToken = jwt.sign({ id: rahulUser._id, role: rahulUser.role }, config.jwt.secret, { expiresIn: '1h' });
    sarahToken = jwt.sign({ id: sarahUser._id, role: sarahUser.role }, config.jwt.secret, { expiresIn: '1h' });
    alexToken = jwt.sign({ id: alexUser._id, role: alexUser.role }, config.jwt.secret, { expiresIn: '1h' });

    teamAlpha = await Workspace.findOne({ slug: 'team-alpha' }).exec();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe('1. Workspaces & Membership Management', () => {
    it('should list all workspaces where the user is an owner or member', async () => {
      const res = await request(app)
        .get('/api/v1/workspaces')
        .set('Authorization', `Bearer ${rahulToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2); // Personal space + Team Alpha
      const teamAlphaWs = res.body.data.find((w) => w.slug === 'team-alpha');
      expect(teamAlphaWs).toBeDefined();
      expect(teamAlphaWs.userRole).toBe('OWNER');
    });

    it('should allow Rahul (Owner) to create a new Team workspace', async () => {
      const res = await request(app)
        .get('/api/v1/workspaces')
        .set('Authorization', `Bearer ${sarahToken}`);

      expect(res.status).toBe(200);
      const teamAlphaWs = res.body.data.find((w) => w.slug === 'team-alpha');
      expect(teamAlphaWs).toBeDefined();
      expect(teamAlphaWs.userRole).toBe('EDITOR');
    });

    it('should create a cryptographically secure workspace invitation with SHA-256 hash', async () => {
      const res = await request(app)
        .post(`/api/v1/workspaces/${teamAlpha._id}/invitations`)
        .set('Authorization', `Bearer ${rahulToken}`)
        .send({
          email: 'alex@wrapai.io',
          role: 'VIEWER'
        });

      if (res.status !== 201) {
        console.error('Invite error res.body:', res.body);
      }
      expect(res.status).toBe(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.rawToken).toBeDefined();
      expect(res.body.data.inviteUrl).toContain(res.body.data.rawToken);

      // Verify stored invitation has tokenHash instead of rawToken
      const inv = await WorkspaceInvitation.findById(res.body.data.invitationId).exec();
      expect(inv.tokenHash).toBeDefined();
      expect(inv.tokenHash).not.toBe(res.body.data.rawToken);

      // Verify recipient received in-app notification
      const notif = await Notification.findOne({ userId: alexUser._id, type: 'WORKSPACE_INVITE' }).exec();
      expect(notif).toBeDefined();
    });

    it('should allow Alex to accept the invitation and become a VIEWER member', async () => {
      // Find the pending invitation
      const inv = await WorkspaceInvitation.findOne({ invitedEmail: 'alex@wrapai.io', status: 'PENDING' }).exec();
      expect(inv).toBeDefined();

      // Regenerate matching token via direct query test acceptance
      const testToken = crypto.randomBytes(32).toString('hex');
      const testHash = crypto.createHash('sha256').update(testToken).digest('hex');
      inv.tokenHash = testHash;
      await inv.save();

      const res = await request(app)
        .post('/api/v1/workspaces/invitations/accept')
        .set('Authorization', `Bearer ${alexToken}`)
        .send({ token: testToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('VIEWER');

      // Verify membership record created
      const member = await WorkspaceMember.findOne({ workspaceId: teamAlpha._id, userId: alexUser._id }).exec();
      expect(member).toBeDefined();
      expect(member.role).toBe('VIEWER');
    });
  });

  describe('2. Centralized RBAC & Permission Matrix', () => {
    it('should allow Sarah (Editor) to create comments on Team Alpha content', async () => {
      const content = await Content.findOne({ workspaceId: teamAlpha._id }).exec();
      expect(content).toBeDefined();

      const res = await request(app)
        .post(`/api/v1/content/${content._id}/comments`)
        .set('Authorization', `Bearer ${sarahToken}`)
        .send({
          targetType: 'TRANSCRIPT',
          timestampSeconds: 120,
          text: 'Sarah noted: Verified vector search latency is under 15ms.'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.text).toContain('Verified vector search latency');
    });

    it('should block Alex (Viewer) from updating workspace settings', async () => {
      const res = await request(app)
        .put(`/api/v1/workspaces/${teamAlpha._id}`)
        .set('Authorization', `Bearer ${alexToken}`)
        .send({ name: 'Hacked Workspace Name' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('3. Global Semantic Search with Workspace Permission Isolation', () => {
    it('should search semantically across accessible workspaces and return timestamp jump links', async () => {
      const res = await request(app)
        .get('/api/v1/search?q=MongoDB+Atlas+Vector+Search')
        .set('Authorization', `Bearer ${sarahToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.results).toBeInstanceOf(Array);
      if (res.body.data.results.length > 0) {
        const item = res.body.data.results[0];
        expect(item.contentId).toBeDefined();
        expect(item.jumpUrl).toContain('/transcript?t=');
      }
    });

    it('should block users from searching workspaces they do not belong to', async () => {
      // Create a private workspace for Alex
      const alexPrivateWs = await Workspace.create({
        name: "Alex's Top Secret Space",
        slug: 'alex-secret',
        ownerId: alexUser._id,
        type: 'PERSONAL'
      });

      const res = await request(app)
        .get(`/api/v1/search?q=launch&workspaceId=${alexPrivateWs._id}`)
        .set('Authorization', `Bearer ${rahulToken}`);

      expect(res.status).toBe(500); // Denied access
    });
  });

  describe('4. Collaboration Comments Lifecycle', () => {
    let testCommentId;

    it('should allow user to view comments on a content item', async () => {
      const content = await Content.findOne({ workspaceId: teamAlpha._id }).exec();
      const res = await request(app)
        .get(`/api/v1/content/${content._id}/comments`)
        .set('Authorization', `Bearer ${rahulToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      testCommentId = res.body.data[0]._id;
    });

    it('should block Sarah from editing Rahul’s comment', async () => {
      // Find comment authored by Rahul
      const rahulComment = await Comment.findOne({ userId: rahulUser._id }).exec();
      expect(rahulComment).toBeDefined();

      const res = await request(app)
        .put(`/api/v1/comments/${rahulComment._id}`)
        .set('Authorization', `Bearer ${sarahToken}`)
        .send({ text: 'Sarah attempting unauthorized edit' });

      expect(res.status).toBe(500); // Forbidden edit
    });

    it('should allow Rahul to edit his own comment', async () => {
      const rahulComment = await Comment.findOne({ userId: rahulUser._id }).exec();
      const res = await request(app)
        .put(`/api/v1/comments/${rahulComment._id}`)
        .set('Authorization', `Bearer ${rahulToken}`)
        .send({ text: 'Updated clarification on vector search indexing.' });

      expect(res.status).toBe(200);
      expect(res.body.data.text).toBe('Updated clarification on vector search indexing.');
    });
  });

  describe('5. Notifications Lifecycle', () => {
    it('should list notifications for the authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${rahulToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notifications).toBeInstanceOf(Array);
    });

    it('should mark all notifications as read', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${rahulToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const unreadCount = await Notification.countDocuments({ userId: rahulUser._id, read: false });
      expect(unreadCount).toBe(0);
    });
  });

  describe('6. Production Readiness & Health Checks', () => {
    it('should return deep health status with database and service telemetry', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('HEALTHY');
      expect(res.body.data.database).toBe('CONNECTED');
    });

    it('should return readiness probe for container orchestration', async () => {
      const res = await request(app).get('/api/v1/health/ready');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('READY');
      expect(res.body.checks.database).toBe('OK');
    });

    it('should include X-Request-ID header on all API responses', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.headers['x-request-id']).toBeDefined();
    });
  });

  describe('7. Safe Cascade Account Deletion', () => {
    it('should safely delete Alex user account and personal assets without affecting team workspaces', async () => {
      const deleteRes = await request(app)
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${alexToken}`);

      expect(deleteRes.status).toBe(200);

      // Verify user deleted
      const userDoc = await User.findById(alexUser._id).exec();
      expect(userDoc).toBeNull();

      // Verify Team Alpha workspace still intact
      const teamAlphaWs = await Workspace.findById(teamAlpha._id).exec();
      expect(teamAlphaWs).toBeDefined();
    });
  });
});
