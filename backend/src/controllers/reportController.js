import { reportService } from '../services/reportService.js';
import { sendSuccess } from '../utils/responseHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sanitizeText } from '../utils/sanitizer.js';

export const reportController = {
  /**
   * List paginated reports for authenticated user.
   * GET /api/v1/reports
   */
  async list(req, res) {
    const { reports, meta } = await reportService.getUserReports(req.user.id, req.query);
    sendSuccess(res, reports, 'Reports retrieved successfully', 200, meta);
  },

  /**
   * List all report versions for a specific content item.
   * GET /api/v1/content/:contentId/reports
   */
  async getContentReports(req, res) {
    const { contentId } = req.params;
    const reports = await reportService.getContentReports(contentId, req.user.id);
    sendSuccess(res, reports, 'Content reports retrieved successfully');
  },

  /**
   * Preview structured report data before generating.
   * POST /api/v1/content/:contentId/reports/preview
   */
  async preview(req, res) {
    const { contentId } = req.params;
    const { templateId, customTitle, detailLevel, requestedSections } = req.body;

    const structuredReport = await reportService.previewReport({
      contentId,
      userId: req.user.id,
      templateId: templateId ? sanitizeText(templateId) : 'MEETING',
      customTitle: customTitle ? sanitizeText(customTitle) : null,
      detailLevel: detailLevel ? sanitizeText(detailLevel) : 'STANDARD',
      requestedSections: Array.isArray(requestedSections) ? requestedSections : null
    });

    sendSuccess(res, structuredReport, 'Report preview compiled successfully');
  },

  /**
   * Create and queue a new report document generation job.
   * POST /api/v1/content/:contentId/reports
   */
  async create(req, res) {
    const { contentId } = req.params;
    const { templateId, format, customTitle, detailLevel, requestedSections, sections, title } = req.body;

    const report = await reportService.createReport({
      contentId,
      userId: req.user.id,
      templateId: templateId || 'MEETING',
      format: format || 'PDF',
      customTitle: customTitle || title || null,
      detailLevel: detailLevel || 'STANDARD',
      requestedSections: requestedSections || sections || null
    });

    sendSuccess(res, report, 'Report generation initiated successfully', 201);
  },

  /**
   * Get single report status & metadata.
   * GET /api/v1/reports/:id
   */
  async getById(req, res) {
    const report = await reportService.getReportById(req.params.id, req.user.id);
    sendSuccess(res, report, 'Report details retrieved');
  },

  /**
   * Download report file (PDF, DOCX, Markdown, TXT).
   * GET /api/v1/reports/:id/download
   */
  async download(req, res) {
    const { buffer, mimeType, filename, size } = await reportService.getDownloadPayload(req.params.id, req.user.id);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', size);
    res.setHeader('Cache-Control', 'no-cache, private');

    return res.end(buffer);
  },

  /**
   * Regenerate report into a new version.
   * POST /api/v1/reports/:id/regenerate
   */
  async regenerate(req, res) {
    const report = await reportService.regenerateReport(req.params.id, req.user.id, req.body);
    sendSuccess(res, report, 'Report regenerated successfully', 201);
  },

  /**
   * Delete report document and database record.
   * DELETE /api/v1/reports/:id
   */
  async delete(req, res) {
    const result = await reportService.deleteReport(req.params.id, req.user.id);
    sendSuccess(res, result, 'Report deleted successfully');
  },

  /**
   * Generate secure shareable read-only link.
   * POST /api/v1/reports/:id/share
   */
  async share(req, res) {
    const expiresInDays = parseInt(req.body.expiresInDays, 10) || 7;
    const shareInfo = await reportService.createShareLink(req.params.id, req.user.id, { expiresInDays });
    sendSuccess(res, shareInfo, 'Share link generated successfully');
  },

  /**
   * Revoke existing shareable link.
   * DELETE /api/v1/reports/:id/share
   */
  async revokeShare(req, res) {
    const result = await reportService.revokeShareLink(req.params.id, req.user.id);
    sendSuccess(res, result, 'Share link revoked successfully');
  },

  /**
   * Access read-only shared report by token (no auth required).
   * GET /api/v1/reports/shared/:shareToken
   */
  async getSharedReport(req, res) {
    const { shareToken } = req.params;
    const sharedReport = await reportService.getSharedReport(shareToken);
    sendSuccess(res, sharedReport, 'Shared report retrieved successfully');
  }
};
