import { searchService } from '../services/searchService.js';

export const searchController = {
  async search(req, res, next) {
    try {
      const userId = req.user.id;
      const { q, query, workspaceId, contentType, speaker, page, limit } = req.query;

      const results = await searchService.searchSemantic(userId, {
        query: q || query,
        workspaceId,
        contentType,
        speaker,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10
      });

      res.json({
        success: true,
        data: results
      });
    } catch (err) {
      next(err);
    }
  }
};
