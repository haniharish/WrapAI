import { Content } from '../models/Content.js';

export const contentRepository = {
  async findById(id) {
    return Content.findOne({ _id: id, isDeleted: false }).exec();
  },

  async create(contentData) {
    return Content.create(contentData);
  },

  async updateById(id, updates) {
    return Content.findOneAndUpdate({ _id: id, isDeleted: false }, updates, { new: true, runValidators: true });
  },

  async softDeleteById(id, userId = null) {
    const filter = { _id: id };
    if (userId) filter.userId = userId;
    return Content.findOneAndUpdate(filter, { isDeleted: true, deletedAt: new Date() }, { new: true });
  },

  async softDelete(id, userId = null) {
    return this.softDeleteById(id, userId);
  },

  async find(filter = {}, options = {}) {
    let q = Content.find(filter);
    if (options.sort) q = q.sort(options.sort);
    if (options.skip) q = q.skip(options.skip);
    if (options.limit) q = q.limit(options.limit);
    if (options.populate) q = q.populate(options.populate);
    return q.exec();
  },

  async count(filter = {}) {
    return Content.countDocuments(filter);
  },

  async findByUser(userId, { skip = 0, limit = 20, search = '', type = null, status = null, sortBy = 'newest' } = {}) {
    const query = { userId, isDeleted: false };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (type && type !== 'ALL') query.contentType = type;
    if (status && status !== 'ALL') query.processingStatus = status;

    let sort = { createdAt: -1 };
    if (sortBy === 'oldest') sort = { createdAt: 1 };
    if (sortBy === 'duration') sort = { mediaDurationSeconds: -1 };

    const [items, total] = await Promise.all([
      Content.find(query).sort(sort).skip(skip).limit(limit).exec(),
      Content.countDocuments(query)
    ]);

    return { items, total };
  },

  async findAllAdmin({ skip = 0, limit = 20, search = '', type = null, status = null } = {}) {
    const query = { isDeleted: false };
    if (search) query.title = { $regex: search, $options: 'i' };
    if (type && type !== 'ALL') query.contentType = type;
    if (status && status !== 'ALL') query.processingStatus = status;

    const [items, total] = await Promise.all([
      Content.find(query).populate('userId', 'fullName email').sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      Content.countDocuments(query)
    ]);

    return { items, total };
  }
};
