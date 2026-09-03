import crypto from 'crypto';
import { reportRepository } from '../repositories/reportRepository.js';
import { contentRepository } from '../repositories/contentRepository.js';
import { reportBuilder } from './report/reportBuilder.js';
import { documentRenderer } from './report/renderers/index.js';
import { storageService } from './storageService.js';
import { getReportQueue } from '../queues/reportQueue.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import {
  REPORT_TYPES,
  REPORT_FORMATS,
  REPORT_DETAIL_LEVELS,
  REPORT_STATUS
} from '../constants/contentTypes.js';

export const reportService = {
  /**
   * Generates a real-time intermediate Structured Report for live frontend preview.
   * Zero disk/S3 overhead, zero unnecessary LLM calls.
   */
  async previewReport({
    contentId,
    userId,
    templateId = 'MEETING',
    customTitle = null,
    detailLevel = 'STANDARD',
    requestedSections = null
  }) {
    return reportBuilder.buildStructuredReport({
      contentId,
      userId,
      templateId,
      customTitle,
      detailLevel,
      requestedSections
    });
  },

  /**
   * Queues a new report generation job.
   */
  async createReport({
    contentId,
    userId,
    templateId = 'MEETING',
    format = 'PDF',
    customTitle = null,
    detailLevel = 'STANDARD',
    requestedSections = null
  }) {
    // 1. Verify content exists & owned
    const content = await contentRepository.findByIdAndUserId(contentId, userId);
    if (!content) {
      throw ApiError.notFound('Content not found or access denied');
    }

    const fmt = (format || 'PDF').toUpperCase();
    if (!Object.values(REPORT_FORMATS).includes(fmt)) {
      throw ApiError.badRequest(`Unsupported report format: ${format}. Allowed: PDF, DOCX, MARKDOWN, TXT`);
    }

    const lvl = (detailLevel || 'STANDARD').toUpperCase();
    if (!Object.values(REPORT_DETAIL_LEVELS).includes(lvl)) {
      throw ApiError.badRequest(`Invalid detail level: ${detailLevel}`);
    }

    // 2. Determine version
    const latest = await reportRepository.findLatestByContentId(contentId, userId);
    const nextVersion = latest ? (latest.version || 1) + 1 : 1;

    // 3. Create Report DB record in QUEUED state
    const reportDoc = await reportRepository.create({
      contentId,
      userId,
      title: customTitle?.trim() || `${content.title} — Report`,
      contentTitle: content.title,
      reportType: REPORT_TYPES.MEETING_REPORT,
      template: templateId.toUpperCase(),
      detailLevel: lvl,
      format: fmt,
      sections: requestedSections || ['SUMMARY', 'TOPICS', 'DECISIONS', 'ACTION_ITEMS', 'HIGHLIGHTS', 'PARTICIPANTS'],
      status: REPORT_STATUS.QUEUED,
      version: nextVersion
    });

    // 4. Dispatch to BullMQ or execute immediately
    try {
      const queue = getReportQueue();
      await queue.add('GENERATE_REPORT', {
        reportId: reportDoc._id.toString(),
        userId: userId.toString(),
        contentId: contentId.toString(),
        format: fmt,
        templateId,
        customTitle,
        detailLevel: lvl,
        requestedSections
      }, {
        jobId: `report_${reportDoc._id.toString()}_v${nextVersion}`
      });
    } catch (err) {
      logger.warn('Failed to enqueue report to BullMQ, falling back to direct execution', { error: err.message });
    }

    // Dynamic self-healing generation trigger:
    // Ensures immediate asynchronous document compilation and storage upload even if standalone worker daemon is offline
    setTimeout(async () => {
      try {
        const fresh = await reportRepository.findById(reportDoc._id);
        if (fresh && fresh.status === REPORT_STATUS.QUEUED) {
          await this.executeReportGeneration(reportDoc._id.toString());
        }
      } catch (err) {
        logger.error('Background report generation error:', { error: err.message });
      }
    }, 50);

    // In test synchronous mode, await generation right away
    if (process.env.NODE_ENV === 'test') {
      await this.executeReportGeneration(reportDoc._id.toString());
      return reportRepository.findById(reportDoc._id);
    }

    return reportDoc;
  },

  /**
   * Worker task: executes document compilation, rendering, and secure object storage upload.
   */
  async executeReportGeneration(reportId) {
    const report = await reportRepository.findById(reportId);
    if (!report) {
      logger.error(`Report ${reportId} not found for generation`);
      return null;
    }

    try {
      await reportRepository.updateById(reportId, { status: REPORT_STATUS.GENERATING });

      // 1. Build intermediate structured report
      const structuredReport = await reportBuilder.buildStructuredReport({
        contentId: report.contentId.toString(),
        userId: report.userId.toString(),
        templateId: report.template,
        customTitle: report.title,
        detailLevel: report.detailLevel,
        requestedSections: report.sections
      });

      // 2. Render document format
      const rendered = await documentRenderer.renderDocument(structuredReport, report.format);

      // 3. Upload to Object Storage
      const { storageKey } = await storageService.uploadReportBuffer({
        userId: report.userId.toString(),
        contentId: report.contentId.toString(),
        reportId: report._id.toString(),
        buffer: rendered.buffer,
        mimeType: rendered.mimeType,
        extension: rendered.extension
      });

      // 4. Update Report record with completed status & metadata
      const updatePayload = {
        status: REPORT_STATUS.COMPLETED,
        structuredData: structuredReport,
        storageKey,
        fileSizeBytes: rendered.buffer.length,
        mimeType: rendered.mimeType,
        markdownContent: rendered.textContent || null,
        analysisVersion: structuredReport.metadata.analysisVersion,
        transcriptVersion: structuredReport.metadata.transcriptVersion,
        generatedAt: new Date()
      };

      if (report.format === 'PDF') updatePayload.pdfStorageKey = storageKey;
      if (report.format === 'DOCX') updatePayload.docxStorageKey = storageKey;

      const updated = await reportRepository.updateById(reportId, updatePayload);
      logger.info(`Report ${reportId} compiled and uploaded successfully`, { storageKey, bytes: rendered.buffer.length });
      return updated;
    } catch (err) {
      logger.error(`Report generation failed for ${reportId}:`, { error: err.message });
      await reportRepository.updateById(reportId, {
        status: REPORT_STATUS.FAILED,
        errorMessage: err.message
      });
      throw err;
    }
  },

  /**
   * Retrieve paginated reports for a user.
   */
  async getUserReports(userId, query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { reports, total } = await reportRepository.findByUser(userId, {
      skip,
      limit,
      contentId: query.contentId || null,
      format: query.format || null
    });

    const totalPages = Math.ceil(total / limit) || 1;
    return {
      reports,
      meta: { page, limit, total, totalPages }
    };
  },

  /**
   * Retrieve all versions of reports for a content item.
   */
  async getContentReports(contentId, userId) {
    const content = await contentRepository.findByIdAndUserId(contentId, userId);
    if (!content) throw ApiError.notFound('Content not found');
    return reportRepository.findByContentId(contentId, userId);
  },

  /**
   * Retrieve a single report by ID with ownership verification.
   */
  async getReportById(reportId, userId) {
    const report = await reportRepository.findByIdAndUserId(reportId, userId);
    if (!report) throw ApiError.notFound('Report not found or access denied');
    return report;
  },

  /**
   * Regenerates an existing report into a new version.
   */
  async regenerateReport(reportId, userId, overrides = {}) {
    const existing = await reportRepository.findByIdAndUserId(reportId, userId);
    if (!existing) throw ApiError.notFound('Report not found');

    return this.createReport({
      contentId: existing.contentId.toString(),
      userId,
      templateId: overrides.templateId || existing.template,
      format: overrides.format || existing.format,
      customTitle: overrides.title || existing.title,
      detailLevel: overrides.detailLevel || existing.detailLevel,
      requestedSections: overrides.sections || existing.sections
    });
  },

  /**
   * Deletes a report record and its file in storage. Source content is untouched.
   */
  async deleteReport(reportId, userId) {
    const report = await reportRepository.findByIdAndUserId(reportId, userId);
    if (!report) throw ApiError.notFound('Report not found');

    if (report.storageKey) {
      await storageService.deleteFile(report.storageKey);
    }
    await reportRepository.deleteById(reportId);
    return { id: reportId, deleted: true };
  },

  /**
   * Creates or updates a secure, cryptographically random share token.
   */
  async createShareLink(reportId, userId, { expiresInDays = 7 } = {}) {
    const report = await reportRepository.findByIdAndUserId(reportId, userId);
    if (!report) throw ApiError.notFound('Report not found');

    const shareToken = crypto.randomBytes(24).toString('hex');
    const shareExpiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const updated = await reportRepository.updateById(reportId, {
      isShared: true,
      shareToken,
      shareExpiresAt
    });

    return {
      reportId,
      shareToken,
      shareExpiresAt,
      shareUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/shared/reports/${shareToken}`
    };
  },

  /**
   * Revokes a shared report link.
   */
  async revokeShareLink(reportId, userId) {
    const report = await reportRepository.findByIdAndUserId(reportId, userId);
    if (!report) throw ApiError.notFound('Report not found');

    await reportRepository.updateById(reportId, {
      isShared: false,
      shareToken: null,
      shareExpiresAt: null
    });

    return { reportId, shared: false, revoked: true };
  },

  /**
   * Retrieves a read-only shared report by token (public endpoint without auth).
   */
  async getSharedReport(shareToken) {
    if (!shareToken) throw ApiError.badRequest('Share token is required');
    const report = await reportRepository.findByShareToken(shareToken);
    if (!report) throw ApiError.notFound('Shared report not found or link expired');

    // Return sanitized, read-only view
    return {
      title: report.title,
      contentTitle: report.contentTitle,
      reportType: report.reportType,
      template: report.template,
      format: report.format,
      detailLevel: report.detailLevel,
      sections: report.sections,
      structuredData: report.structuredData,
      markdownContent: report.markdownContent,
      generatedAt: report.generatedAt,
      version: report.version
    };
  },

  /**
   * Retrieves report file buffer and download headers.
   */
  async getDownloadPayload(reportId, userId) {
    const report = await reportRepository.findByIdAndUserId(reportId, userId);
    if (!report) throw ApiError.notFound('Report not found or access denied');
    if (report.status !== REPORT_STATUS.COMPLETED || !report.storageKey) {
      throw ApiError.badRequest('Report document is not ready for download');
    }

    const buffer = await storageService.getFileBuffer(report.storageKey);
    if (!buffer) throw ApiError.notFound('Report file not found in storage');

    const cleanTitle = (report.title || 'report')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);

    const ext = report.format === 'MARKDOWN' ? 'md' : report.format.toLowerCase();
    const filename = `wrapai-${cleanTitle}-v${report.version}.${ext}`;

    return {
      buffer,
      mimeType: report.mimeType || 'application/octet-stream',
      filename,
      size: buffer.length
    };
  }
};
