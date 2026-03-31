import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate, requireAdmin } from '../middleware/auth';
import * as adminController from '../controllers/admin.controller';
import * as moderationController from '../controllers/moderation.controller';
import * as reportController from '../controllers/report.controller';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getAllUsers);
router.post(
  '/users/:userId/role',
  validate(z.object({ role: z.string() })),
  adminController.assignRole,
);
router.delete(
  '/users/:userId/role',
  validate(z.object({ role: z.string() })),
  adminController.removeRole,
);
router.post('/users/:userId/promote', adminController.promoteToAdmin);
router.post('/users/:userId/ban', adminController.banUser);

router.get('/moderation', moderationController.getQueue);
router.put(
  '/moderation/:id',
  validate(z.object({ action: z.enum(['approve', 'reject']) })),
  moderationController.resolveItem,
);

router.get('/reports', reportController.getReports);
router.get('/metrics', adminController.getMetrics);

export { router as adminRoutes };
