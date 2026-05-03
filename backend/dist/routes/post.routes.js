"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.postRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const postController = __importStar(require("../controllers/post.controller"));
const commentController = __importStar(require("../controllers/comment.controller"));
const engagementController = __importStar(require("../controllers/engagement.controller"));
const pollController = __importStar(require("../controllers/poll.controller"));
const router = (0, express_1.Router)();
exports.postRoutes = router;
const createPostSchema = zod_1.z.object({
    content: zod_1.z.string().optional(),
    imageUrl: zod_1.z.string().url().optional(),
    videoUrl: zod_1.z.string().url().optional(),
});
const commentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(5000),
});
const reactionSchema = zod_1.z.object({
    reactionType: zod_1.z.string().min(1),
});
const pollSchema = zod_1.z.object({
    question: zod_1.z.string().min(1),
    options: zod_1.z.array(zod_1.z.string()).min(2).max(10),
});
const pollResponseSchema = zod_1.z.object({
    selectedOption: zod_1.z.string(),
});
router.get('/', auth_1.optionalAuth, postController.getPosts);
router.post('/', auth_1.authenticate, (0, validate_1.validate)(createPostSchema), postController.createPost);
router.get('/feed', auth_1.authenticate, postController.getFeed);
router.get('/:id', auth_1.optionalAuth, postController.getPostById);
router.put('/:id', auth_1.authenticate, (0, validate_1.validate)(createPostSchema), postController.updatePost);
router.delete('/:id', auth_1.authenticate, postController.deletePost);
router.get('/:postId/comments', commentController.getPostComments);
router.post('/:postId/comments', auth_1.authenticate, (0, validate_1.validate)(commentSchema), commentController.createComment);
router.post('/:postId/like', auth_1.authenticate, engagementController.toggleLike);
router.post('/:postId/bookmark', auth_1.authenticate, engagementController.toggleBookmark);
router.post('/:postId/react', auth_1.authenticate, (0, validate_1.validate)(reactionSchema), engagementController.addReaction);
router.delete('/:postId/react', auth_1.authenticate, (0, validate_1.validate)(reactionSchema), engagementController.removeReaction);
router.get('/:postId/reactions', engagementController.getPostReactions);
router.post('/:postId/poll', auth_1.authenticate, (0, validate_1.validate)(pollSchema), pollController.createPoll);
//# sourceMappingURL=post.routes.js.map