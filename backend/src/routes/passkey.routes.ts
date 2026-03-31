import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import * as passkeyController from '../controllers/passkey.controller';

const router = Router();

router.post(
  '/register/start',
  authenticate,
  passkeyController.startRegistration,
);
router.post(
  '/register/finish',
  authenticate,
  passkeyController.finishRegistration,
);
router.post('/auth/start', authLimiter, passkeyController.startAuthentication);
router.post(
  '/auth/finish',
  authLimiter,
  passkeyController.finishAuthentication,
);

export { router as passkeyRoutes };
