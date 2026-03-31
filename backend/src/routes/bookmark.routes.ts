import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as engagementController from '../controllers/engagement.controller';

const router = Router();

router.get('/', authenticate, engagementController.getBookmarks);

export { router as bookmarkRoutes };
