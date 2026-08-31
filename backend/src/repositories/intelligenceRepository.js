import { Topic } from '../models/Topic.js';
import { Decision } from '../models/Decision.js';
import { ActionItem } from '../models/ActionItem.js';
import { Content } from '../models/Content.js';

export const intelligenceRepository = {
  async getIntelligenceByContentId(contentId) {
    const [content, topics, decisions, actionItems] = await Promise.all([
      Content.findById(contentId).select('summary keyPoints highlights title mediaDurationSeconds').exec(),
      Topic.find({ contentId }).sort({ sequence: 1 }).exec(),
      Decision.find({ contentId }).sort({ timestamp: 1 }).exec(),
      ActionItem.find({ contentId }).sort({ timestamp: 1 }).exec()
    ]);

    return {
      contentId,
      summary: content ? content.summary : null,
      keyPoints: content ? content.keyPoints : [],
      highlights: content ? content.highlights : [],
      topics,
      decisions,
      actionItems
    };
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

  async updateActionItemStatus(actionItemId, status) {
    return ActionItem.findByIdAndUpdate(actionItemId, { status }, { new: true, runValidators: true });
  },

  async deleteByContentId(contentId) {
    await Promise.all([
      Topic.deleteMany({ contentId }),
      Decision.deleteMany({ contentId }),
      ActionItem.deleteMany({ contentId })
    ]);
  }
};
