import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { userRoutes } from './user.routes';
import { postRoutes } from './post.routes';
import { commentRoutes } from './comment.routes';
import { notificationRoutes } from './notification.routes';
import { bookmarkRoutes } from './bookmark.routes';
import { pollRoutes } from './poll.routes';
import { reportRoutes } from './report.routes';
import { adminRoutes } from './admin.routes';
import { passkeyRoutes } from './passkey.routes';
import { storageRoutes } from './storage.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/comments', commentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/bookmarks', bookmarkRoutes);
router.use('/polls', pollRoutes);
router.use('/reports', reportRoutes);
router.use('/admin', adminRoutes);
router.use('/passkeys', passkeyRoutes);
router.use('/storage', storageRoutes);

export { router };
