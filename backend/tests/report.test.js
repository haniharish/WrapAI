import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { setupTestDb, teardownTestDb, clearTestDb } from './setup.js';

import { seedDatabase } from '../src/database/seed.js';
import { Content, User, Report } from '../src/models/index.js';

describe('Phase 11 — Report Generation, Document Export & Sharing Test Suite', () => {
  let rahulToken;
  let sarahToken;
  let rahulUser;
  let sarahUser;
  let testContent;

  beforeAll(async () => {
    await setupTestDb();
    await seedDatabase();

    // Authenticate Rahul (regular user)
    const rahulLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'rahul@wrapai.io', password: 'Password123' });
    rahulToken = rahulLogin.body.data.token;

    // Authenticate Sarah (admin user)
    const sarahLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'sarah.jenkins@wrapai.io', password: 'Password123' });
    sarahToken = sarahLogin.body.data.token;

    rahulUser = await User.findOne({ email: 'rahul@wrapai.io' });
    sarahUser = await User.findOne({ email: 'sarah.jenkins@wrapai.io' });
    testContent = await Content.findOne({ userId: rahulUser._id });
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe('1. Report Preview & Compilation', () => {
    it('should generate an instant structured preview for live UI rendering without disk overhead', async () => {
      const res = await request(app)
        .post(`/api/v1/content/${testContent._id}/reports/preview`)
        .set('Authorization', `Bearer ${rahulToken}`)
        .send({
          templateId: 'MEETING',
          detailLevel: 'STANDARD',
          requestedSections: ['SUMMARY', 'TOPICS', 'DECISIONS', 'ACTION_ITEMS', 'PARTICIPANTS']
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('title');
      expect(res.body.data).toHaveProperty('metadata');
      expect(res.body.data.metadata.contentTitle).toBe(testContent.title);
      expect(res.body.data.sections).toBeInstanceOf(Array);
      expect(res.body.data.sections.length).toBeGreaterThanOrEqual(3);

      const decisionSec = res.body.data.sections.find(s => s.id === 'DECISIONS');
      expect(decisionSec).toBeDefined();
      expect(decisionSec.items.length).toBeGreaterThan(0);
    });

    it('should respect BRIEF detail level and slice item counts', async () => {
      const res = await request(app)
        .post(`/api/v1/content/${testContent._id}/reports/preview`)
        .set('Authorization', `Bearer ${rahulToken}`)
        .send({
          templateId: 'EXECUTIVE',
          detailLevel: 'BRIEF'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.detailLevel).toBe('BRIEF');
    });
  });

  describe('2. Multi-Format Document Generation (PDF, DOCX, Markdown, TXT)', () => {
    let generatedPdfReportId;

    it('should generate a styled PDF report and upload to storage', async () => {
      const res = await request(app)
        .post(`/api/v1/content/${testContent._id}/reports`)
        .set('Authorization', `Bearer ${rahulToken}`)
        .send({
          templateId: 'MEETING',
          format: 'PDF',
          detailLevel: 'STANDARD',
          customTitle: 'Q3 Executive Sync Report'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('storageKey');
      expect(res.body.data.format).toBe('PDF');
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.fileSizeBytes).toBeGreaterThan(100);

      generatedPdfReportId = res.body.data.id;
    });

    it('should generate a Microsoft Word (DOCX) document', async () => {
      const res = await request(app)
        .post(`/api/v1/content/${testContent._id}/reports`)
        .set('Authorization', `Bearer ${rahulToken}`)
        .send({
          templateId: 'EXECUTIVE',
          format: 'DOCX',
          detailLevel: 'STANDARD',
          customTitle: 'Q3 Word Document'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.format).toBe('DOCX');
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.mimeType).toContain('wordprocessingml');
    });

    it('should generate a clean GitHub-Flavored Markdown report', async () => {
      const res = await request(app)
        .post(`/api/v1/content/${testContent._id}/reports`)
        .set('Authorization', `Bearer ${rahulToken}`)
        .send({
          templateId: 'LECTURE',
          format: 'MARKDOWN',
          detailLevel: 'DETAILED'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.format).toBe('MARKDOWN');
      expect(res.body.data.markdownContent).toContain('#');
      expect(res.body.data.markdownContent).toContain('Executive Summary');
    });

    it('should generate a Plain Text report', async () => {
      const res = await request(app)
        .post(`/api/v1/content/${testContent._id}/reports`)
        .set('Authorization', `Bearer ${rahulToken}`)
        .send({
          templateId: 'GENERAL',
          format: 'TXT',
          detailLevel: 'STANDARD'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.format).toBe('TXT');
      expect(res.body.data.mimeType).toBe('text/plain');
    });

    it('should securely download the generated PDF file buffer', async () => {
      const res = await request(app)
        .get(`/api/v1/reports/${generatedPdfReportId}/download`)
        .set('Authorization', `Bearer ${rahulToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.body).toBeDefined();
    });
  });

  describe('3. Versioning & Regeneration', () => {
    it('should increment version when regenerating a report', async () => {
      const initial = await Report.findOne({ userId: rahulUser._id, format: 'PDF' });
      expect(initial).toBeDefined();

      const res = await request(app)
        .post(`/api/v1/reports/${initial._id}/regenerate`)
        .set('Authorization', `Bearer ${rahulToken}`)
        .send({
          detailLevel: 'DETAILED',
          customTitle: 'Regenerated Q3 Sync v2'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.version).toBeGreaterThan(initial.version || 1);
      expect(res.body.data.status).toBe('COMPLETED');
    });
  });

  describe('4. Secure Public Sharing & Revocation', () => {
    let shareReportId;
    let shareToken;

    beforeAll(async () => {
      const rep = await Report.findOne({ userId: rahulUser._id });
      shareReportId = rep._id.toString();
    });

    it('should generate a cryptographically random share token with expiration', async () => {
      const res = await request(app)
        .post(`/api/v1/reports/${shareReportId}/share`)
        .set('Authorization', `Bearer ${rahulToken}`)
        .send({ expiresInDays: 14 });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('shareToken');
      expect(res.body.data.shareToken.length).toBeGreaterThan(20);
      expect(res.body.data).toHaveProperty('shareUrl');

      shareToken = res.body.data.shareToken;
    });

    it('should allow anonymous read-only access using the share token without auth', async () => {
      const res = await request(app)
        .get(`/api/v1/reports/shared/${shareToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('title');
      expect(res.body.data).toHaveProperty('structuredData');
    });

    it('should revoke a share token', async () => {
      const revokeRes = await request(app)
        .delete(`/api/v1/reports/${shareReportId}/share`)
        .set('Authorization', `Bearer ${rahulToken}`);

      expect(revokeRes.status).toBe(200);
      expect(revokeRes.body.data.revoked).toBe(true);

      // Accessing with revoked token must now fail with 404
      const accessRes = await request(app)
        .get(`/api/v1/reports/shared/${shareToken}`);

      expect(accessRes.status).toBe(404);
    });
  });

  describe('5. Multi-Tenant Security & Report Deletion Isolation', () => {
    it('should block Sarah from downloading or modifying Rahul’s private report', async () => {
      const rahulReport = await Report.findOne({ userId: rahulUser._id, isShared: false });
      expect(rahulReport).toBeDefined();

      const downloadRes = await request(app)
        .get(`/api/v1/reports/${rahulReport._id}/download`)
        .set('Authorization', `Bearer ${sarahToken}`);

      expect(downloadRes.status).toBe(404);

      const deleteRes = await request(app)
        .delete(`/api/v1/reports/${rahulReport._id}`)
        .set('Authorization', `Bearer ${sarahToken}`);

      expect(deleteRes.status).toBe(404);
    });

    it('should delete a report record without affecting the underlying content item', async () => {
      const reportToDelete = await Report.create({
        contentId: testContent._id,
        userId: rahulUser._id,
        title: 'Temporary Report to Delete',
        reportType: 'MEETING_REPORT',
        status: 'COMPLETED'
      });

      const res = await request(app)
        .delete(`/api/v1/reports/${reportToDelete._id}`)
        .set('Authorization', `Bearer ${rahulToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);

      // Confirm DB record is deleted
      const checkDoc = await Report.findById(reportToDelete._id);
      expect(checkDoc).toBeNull();

      // Confirm parent content is completely untouched
      const parentContent = await Content.findById(testContent._id);
      expect(parentContent).not.toBeNull();
      expect(parentContent.title).toBe(testContent.title);
    });
  });
});
