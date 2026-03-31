import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import * as reportController from '../controllers/report.controller';

const router = Router();

const createSchema = z.object({
  reportType: z.string().min(1),
  description: z.string().optional(),
});

router.post(
  '/',
  authenticate,
  validate(createSchema),
  reportController.createReport,
);

export { router as reportRoutes };
