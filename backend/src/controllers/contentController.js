import { contentService } from '../services/contentService.js';
import { sendSuccess } from '../utils/responseHandler.js';
import { STATUS_CODES } from '../constants/statusCodes.js';

export const contentController = {
  async create(req, res) {
    const content = await contentService.createContent(req.user.id, req.body);
    sendSuccess(res, content, 'Content registered successfully', STATUS_CODES.CREATED);
  },

  async list(req, res) {
    const { items, meta } = await contentService.getUserContent(req.user.id, req.query);
    sendSuccess(res, items, 'Content items retrieved', STATUS_CODES.OK, meta);
  },

  async getById(req, res) {
    sendSuccess(res, req.resource, 'Content details retrieved');
  },

  async update(req, res) {
    const updated = await contentService.updateContent(req.params.id, req.body);
    sendSuccess(res, updated, 'Content updated successfully');
  },

  async delete(req, res) {
    const result = await contentService.deleteContent(req.params.id);
    sendSuccess(res, result, 'Content deleted successfully');
  }
};
