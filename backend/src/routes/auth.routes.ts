import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/auth';
import * as authController from '../controllers/auth.controller';

const router = Router();

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  phoneNumber: z.string().min(5),
  passkey: z.string().min(6),
});

const loginSchema = z.object({
  username: z.string(),
  passkey: z.string(),
});

router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  authController.register,
);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);

export { router as authRoutes };
