import { Analysis } from '../models/Analysis.js';
import { Topic } from '../models/Topic.js';
import { Decision } from '../models/Decision.js';
import { ActionItem } from '../models/ActionItem.js';

export const analysisRepository = {
  async findLatestByContentId(contentId) {
    return Analysis.findOne({ contentId }).sort({ version: -1 }).exec();
  },

  async findByContentIdAndVersion(contentId, version) {
    return Analysis.findOne({ contentId, version }).exec();
  },

  async findVersions(contentId) {
    return Analysis.find({ contentId })
      .select('version llmProvider llmModel promptVersion status createdAt tokenUsage')
      .sort({ version: -1 })
      .exec();
  },

  async createAnalysis(data) {
    return Analysis.create(data);
  },

  async deleteByContentId(contentId) {
    await Promise.all([
      Analysis.deleteMany({ contentId }),
      Topic.deleteMany({ contentId }),
      Decision.deleteMany({ contentId }),
      ActionItem.deleteMany({ contentId })
    ]);
  },

  async insertTopics(topics) {
    return Topic.insertMany(topics);
  },

  async insertDecisions(decisions) {
    return Decision.insertMany(decisions);
  },

  async insertActionItems(actionItems) {
    return ActionItem.insertMany(actionItems);
  },

  async findTopicsByContentId(contentId) {
    return Topic.find({ contentId }).sort({ sequence: 1 }).exec();
  },

  async findDecisionsByContentId(contentId) {
    return Decision.find({ contentId }).sort({ timestamp: 1 }).exec();
  },

  async findActionItemsByContentId(contentId) {
    return ActionItem.find({ contentId }).sort({ timestamp: 1 }).exec();
  },

  async updateActionItem(contentId, itemId, updates) {
    return ActionItem.findOneAndUpdate(
      { contentId, _id: itemId },
      { $set: updates },
      { new: true }
    );
  },

  async updateDecision(contentId, decisionId, updates) {
    return Decision.findOneAndUpdate(
      { contentId, _id: decisionId },
      { $set: updates },
      { new: true }
    );
  }
};
