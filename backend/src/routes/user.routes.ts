import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import * as userController from '../controllers/user.controller';
import * as followController from '../controllers/follow.controller';

const router = Router();

const updateSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  profileImage: z.string().url().optional(),
});

const settingsSchema = z.object({
  theme: z.enum(['light', 'dark']).optional(),
  notificationsEnabled: z.boolean().optional(),
});

// Search (must be before /:id)
router.get('/search', userController.searchUsers);

router.get('/me', authenticate, userController.getMe);
router.put(
  '/me',
  authenticate,
  validate(updateSchema),
  userController.updateMe,
);
router.delete('/me', authenticate, userController.deleteAccount);
router.get('/me/settings', authenticate, userController.getSettings);
router.put(
  '/me/settings',
  authenticate,
  validate(settingsSchema),
  userController.updateSettings,
);
router.get('/me/sessions', authenticate, userController.getMySessions);
router.delete(
  '/me/sessions/:sessionId',
  authenticate,
  userController.revokeSession,
);

// Follow routes (must be before generic /:id)
router.post('/:id/follow', authenticate, followController.toggleFollow);
router.get('/:id/followers', followController.getFollowers);
router.get('/:id/following', followController.getFollowing);
router.get('/:id/is-following', authenticate, followController.checkFollowing);

router.get('/:id', userController.getUserProfile);

export { router as userRoutes };
