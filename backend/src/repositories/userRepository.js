import { User } from '../models/User.js';

export const userRepository = {
  async findById(id, includePassword = false) {
    const q = User.findById(id);
    if (includePassword) q.select('+passwordHash');
    return q.exec();
  },

  async findByEmail(email, includePassword = false) {
    const q = User.findOne({ email: email.toLowerCase().trim() });
    if (includePassword) q.select('+passwordHash');
    return q.exec();
  },

  async create(userData) {
    return User.create(userData);
  },

  async updateById(id, updateData) {
    return User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  },

  async deleteById(id) {
    return User.findByIdAndDelete(id);
  },

  async findAll({ skip = 0, limit = 20, search = '', role = null, status = null } = {}) {
    const query = {};
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    if (status) query.status = status;

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      User.countDocuments(query)
    ]);

    return { users, total };
  }
};
