import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import * as commentController from '../controllers/comment.controller';

const router = Router();

const updateSchema = z.object({
  content: z.string().min(1).max(5000),
});

router.put(
  '/:id',
  authenticate,
  validate(updateSchema),
  commentController.updateComment,
);
router.delete('/:id', authenticate, commentController.deleteComment);

export { router as commentRoutes };
