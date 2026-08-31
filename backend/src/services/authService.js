import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { userRepository } from '../repositories/userRepository.js';
import { config } from '../config/environment.js';
import { ApiError } from '../utils/ApiError.js';

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id || user._id.toString(),
      email: user.email,
      role: user.role
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

export function generateRefreshToken(user) {
  return jwt.sign(
    {
      id: user.id || user._id.toString()
    },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
}

export const authService = {
  async register({ fullName, email, password }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw ApiError.conflict('An account with this email address already exists');
    }

    const passwordHash = await User.hashPassword(password);
    const user = await userRepository.create({
      fullName,
      email,
      passwordHash
    });

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    return { user, token, refreshToken };
  },

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email, true);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (user.status === 'SUSPENDED') {
      throw ApiError.forbidden('Your account is suspended. Contact administration.');
    }

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    return { user: user.toJSON(), token, refreshToken };
  },

  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User profile not found');
    return user;
  }
};
