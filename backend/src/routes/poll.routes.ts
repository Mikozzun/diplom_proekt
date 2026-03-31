import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import * as pollController from '../controllers/poll.controller';

const router = Router();

const responseSchema = z.object({
  selectedOption: z.string(),
});

router.post(
  '/:pollId/respond',
  authenticate,
  validate(responseSchema),
  pollController.respondToPoll,
);
router.get('/:pollId/results', pollController.getPollResults);

export { router as pollRoutes };
