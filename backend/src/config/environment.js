import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/wrapai',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_secret_jwt_key_at_least_32_characters_long_for_wrapai',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret_key_at_least_32_chars_long',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 mins
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10
  }
};
