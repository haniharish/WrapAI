import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/environment.js';
import { swaggerSpec } from './config/swagger.js';
import apiRouter from './routes/index.js';
import { globalLimiter } from './middlewares/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middlewares/errorMiddleware.js';

const app = express();

// Security Headers
app.use(helmet());

// CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or matching CLIENT_URL
      if (!origin || origin === config.clientUrl || config.nodeEnv === 'development' || config.nodeEnv === 'test') {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Global Rate Limiting
if (config.nodeEnv !== 'test') {
  app.use(globalLimiter);
}

// Request Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Swagger API Documentation
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Version 1 Base Router
app.use('/api/v1', apiRouter);

// Root redirect to docs
app.get('/', (req, res) => {
  res.redirect('/api/v1/docs');
});

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
