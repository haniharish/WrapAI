import { Router } from 'express';
import { searchController } from '../controllers/searchController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { searchRateLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

router.use(authenticate);
router.get('/', searchRateLimiter, searchController.search);

export default router;
