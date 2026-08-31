import { contentService } from '../services/contentService.js';
import { sendSuccess } from '../utils/responseHandler.js';
import { STATUS_CODES } from '../constants/statusCodes.js';

export const contentController = {
  async list(req, res) {
    const userId = req.user.id || req.user._id.toString();
    const result = await contentService.listUserContent(userId, req.query);
    sendSuccess(res, result.items, 'Content retrieved successfully', STATUS_CODES.OK, result.pagination);
  },

  async getById(req, res) {
    const userId = req.user.id || req.user._id.toString();
    const content = await contentService.getContentById(req.params.id, userId, req.user.role);
    sendSuccess(res, content, 'Content details retrieved successfully');
  },

  async create(req, res) {
    const userId = req.user.id || req.user._id.toString();
    const content = await contentService.createContent(userId, req.body);
    sendSuccess(res, content, 'Content created successfully', STATUS_CODES.CREATED);
  },

  async upload(req, res) {
    const userId = req.user.id || req.user._id.toString();
    const content = await contentService.uploadFileContent(userId, req.file, req.body);
    sendSuccess(res, content, 'File uploaded and content created successfully', STATUS_CODES.CREATED);
  },

  async createText(req, res) {
    const userId = req.user.id || req.user._id.toString();
    const content = await contentService.createTextContent(userId, req.body);
    sendSuccess(res, content, 'Text content created successfully', STATUS_CODES.CREATED);
  },

  async createUrl(req, res) {
    const userId = req.user.id || req.user._id.toString();
    const content = await contentService.createUrlContent(userId, req.body);
    sendSuccess(res, content, 'URL content created successfully', STATUS_CODES.CREATED);
  },

  async update(req, res) {
    const userId = req.user.id || req.user._id.toString();
    const content = await contentService.updateContent(req.params.id, userId, req.user.role, req.body);
    sendSuccess(res, content, 'Content updated successfully');
  },

  async delete(req, res) {
    const userId = req.user.id || req.user._id.toString();
    const result = await contentService.deleteContent(req.params.id, userId, req.user.role);
    sendSuccess(res, result, 'Content deleted successfully');
  },

  async getAccess(req, res) {
    const userId = req.user.id || req.user._id.toString();
    const result = await contentService.getAccessUrl(req.params.id, userId, req.user.role);
    sendSuccess(res, result, 'Secure media access URL generated');
  }
};
