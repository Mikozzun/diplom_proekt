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
exports.deleteComment = exports.updateComment = exports.getPostComments = exports.createComment = void 0;
const commentService = __importStar(require("../services/comment.service"));
const response_1 = require("../utils/response");
const createComment = async (req, res, next) => {
    try {
        const comment = await commentService.createComment(BigInt(req.params.postId), req.userId, req.body.content);
        (0, response_1.sendCreated)(res, comment);
    }
    catch (err) {
        if (err.message === 'Post not found') {
            (0, response_1.sendError)(res, err.message, 404);
        }
        else {
            next(err);
        }
    }
};
exports.createComment = createComment;
const getPostComments = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const result = await commentService.getPostComments(BigInt(req.params.postId), page, limit);
        (0, response_1.sendPaginated)(res, result.comments, result.meta);
    }
    catch (err) {
        next(err);
    }
};
exports.getPostComments = getPostComments;
const updateComment = async (req, res, next) => {
    try {
        const comment = await commentService.updateComment(BigInt(req.params.id), req.userId, req.body.content);
        (0, response_1.sendSuccess)(res, comment);
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
exports.updateComment = updateComment;
const deleteComment = async (req, res, next) => {
    try {
        await commentService.deleteComment(BigInt(req.params.id), req.userId);
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
exports.deleteComment = deleteComment;
//# sourceMappingURL=comment.controller.js.map