import { contentRepository } from '../repositories/contentRepository.js';
import { ApiError } from '../utils/ApiError.js';

export const contentService = {
  async createContent(userId, data) {
    const content = await contentRepository.create({
      ...data,
      userId
    });
    return content;
  },

  async getUserContent(userId, query) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { items, total } = await contentRepository.findByUser(userId, {
      skip,
      limit,
      search: query.search || '',
      type: query.type || null,
      status: query.status || null,
      sortBy: query.sortBy || 'newest'
    });

    const totalPages = Math.ceil(total / limit) || 1;
    return {
      items,
      meta: { page, limit, total, totalPages }
    };
  },

  async getContentById(id) {
    const content = await contentRepository.findById(id);
    if (!content) throw ApiError.notFound('Content item not found');
    return content;
  },

  async updateContent(id, updates) {
    const updated = await contentRepository.updateById(id, updates);
    if (!updated) throw ApiError.notFound('Content item not found');
    return updated;
  },

  async deleteContent(id) {
    const deleted = await contentRepository.softDeleteById(id);
    if (!deleted) throw ApiError.notFound('Content item not found');
    return { id };
  }
};
