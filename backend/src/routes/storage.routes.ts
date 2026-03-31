import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as storageController from '../controllers/storage.controller';

const router = Router();

router.post('/', authenticate, storageController.uploadFile);
router.get('/', authenticate, storageController.getMyFiles);
router.delete('/:id', authenticate, storageController.deleteFile);

export { router as storageRoutes };
