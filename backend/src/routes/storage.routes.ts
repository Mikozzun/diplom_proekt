import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import * as storageController from '../controllers/storage.controller';

const router = Router();

router.post(
  '/upload',
  authenticate,
  upload.single('file'),
  storageController.uploadFileLocal,
);
router.post('/', authenticate, storageController.uploadFile);
router.get('/', authenticate, storageController.getMyFiles);
router.delete('/:id', authenticate, storageController.deleteFile);

export { router as storageRoutes };
