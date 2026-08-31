import jwt from 'jsonwebtoken';
import { config } from '../config/environment.js';
import { ApiError } from '../utils/ApiError.js';
import { userRepository } from '../repositories/userRepository.js';

export async function authenticate(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(ApiError.unauthorized('Access token is missing or malformed'));
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await userRepository.findById(decoded.id || decoded.userId);

    if (!user) {
      return next(ApiError.unauthorized('The user belonging to this token no longer exists'));
    }

    if (user.status === 'SUSPENDED') {
      return next(ApiError.forbidden('Your account has been suspended. Please contact administration.'));
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Authentication token has expired'));
    }
    return next(ApiError.unauthorized('Invalid authentication token'));
  }
}
