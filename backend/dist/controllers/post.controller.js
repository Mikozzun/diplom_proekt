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
exports.getFeed = exports.getUserPosts = exports.deletePost = exports.updatePost = exports.getPostById = exports.getPosts = exports.createPost = void 0;
const postService = __importStar(require("../services/post.service"));
const response_1 = require("../utils/response");
const createPost = async (req, res, next) => {
    try {
        const post = await postService.createPost(req.userId, req.body);
        (0, response_1.sendCreated)(res, post);
    }
    catch (err) {
        next(err);
    }
};
exports.createPost = createPost;
const getPosts = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const result = await postService.getPosts(page, limit);
        (0, response_1.sendPaginated)(res, result.posts, result.meta);
    }
    catch (err) {
        next(err);
    }
};
exports.getPosts = getPosts;
const getPostById = async (req, res, next) => {
    try {
        const post = await postService.getPostById(BigInt(req.params.id));
        if (!post) {
            (0, response_1.sendError)(res, 'Post not found', 404);
            return;
        }
        (0, response_1.sendSuccess)(res, post);
    }
    catch (err) {
        next(err);
    }
};
exports.getPostById = getPostById;
const updatePost = async (req, res, next) => {
    try {
        const post = await postService.updatePost(BigInt(req.params.id), req.userId, req.body);
        (0, response_1.sendSuccess)(res, post);
    }
    catch (err) {
        if (err.message === 'Not authorized') {
            (0, response_1.sendError)(res, err.message, 403);
        }
        else {
            next(err);
        }
    }
};
exports.updatePost = updatePost;
const deletePost = async (req, res, next) => {
    try {
        await postService.deletePost(BigInt(req.params.id), req.userId);
        (0, response_1.sendNoContent)(res);
    }
    catch (err) {
        if (err.message === 'Not authorized') {
            (0, response_1.sendError)(res, err.message, 403);
        }
        else {
            next(err);
        }
    }
};
exports.deletePost = deletePost;
const getUserPosts = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const result = await postService.getUserPosts(BigInt(req.params.userId), page, limit);
        (0, response_1.sendPaginated)(res, result.posts, result.meta);
    }
    catch (err) {
        next(err);
    }
};
exports.getUserPosts = getUserPosts;
const getFeed = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const result = await postService.getRandomizedFeed(req.userId, page, limit);
        (0, response_1.sendPaginated)(res, result.posts, result.meta);
    }
    catch (err) {
        next(err);
    }
};
exports.getFeed = getFeed;
//# sourceMappingURL=post.controller.js.map