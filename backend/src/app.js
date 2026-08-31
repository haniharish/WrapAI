import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import { config } from './config/environment.js';
import { errorHandler, notFoundHandler } from './middlewares/errorMiddleware.js';
import { globalLimiter } from './middlewares/rateLimiter.js';
import { correlationMiddleware } from './middlewares/correlationMiddleware.js';

// Route imports
import apiRoutes from './routes/index.js';

const app = express();

app.use(correlationMiddleware);
app.use(helmet());

app.use(cors(config.cors));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (config.nodeEnv !== 'test') {
  app.use(morgan('combined'));
}

app.use(globalLimiter);

// Swagger Documentation
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes Mount
app.use('/api/v1', apiRoutes);

// Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
