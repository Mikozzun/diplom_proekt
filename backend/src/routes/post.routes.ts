import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate, optionalAuth } from '../middleware/auth';
import * as postController from '../controllers/post.controller';
import * as commentController from '../controllers/comment.controller';
import * as engagementController from '../controllers/engagement.controller';
import * as pollController from '../controllers/poll.controller';

const router = Router();

const createPostSchema = z.object({
  content: z.string().optional(),
  imageUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
});

const commentSchema = z.object({
  content: z.string().min(1).max(5000),
});

const reactionSchema = z.object({
  reactionType: z.string().min(1),
});

const pollSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).min(2).max(10),
});

const pollResponseSchema = z.object({
  selectedOption: z.string(),
});

router.get('/', optionalAuth, postController.getPosts);
router.post(
  '/',
  authenticate,
  validate(createPostSchema),
  postController.createPost,
);
router.get('/feed', authenticate, postController.getFeed);
router.get('/:id', optionalAuth, postController.getPostById);
router.put(
  '/:id',
  authenticate,
  validate(createPostSchema),
  postController.updatePost,
);
router.delete('/:id', authenticate, postController.deletePost);

router.get('/:postId/comments', commentController.getPostComments);
router.post(
  '/:postId/comments',
  authenticate,
  validate(commentSchema),
  commentController.createComment,
);

router.post('/:postId/like', authenticate, engagementController.toggleLike);
router.post(
  '/:postId/bookmark',
  authenticate,
  engagementController.toggleBookmark,
);
router.post(
  '/:postId/react',
  authenticate,
  validate(reactionSchema),
  engagementController.addReaction,
);
router.delete(
  '/:postId/react',
  authenticate,
  validate(reactionSchema),
  engagementController.removeReaction,
);
router.get('/:postId/reactions', engagementController.getPostReactions);

router.post(
  '/:postId/poll',
  authenticate,
  validate(pollSchema),
  pollController.createPoll,
);

export { router as postRoutes };
