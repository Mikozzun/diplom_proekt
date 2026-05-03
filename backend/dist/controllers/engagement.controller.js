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
exports.getPostReactions = exports.removeReaction = exports.addReaction = exports.getBookmarks = exports.toggleBookmark = exports.toggleLike = void 0;
const engagementService = __importStar(require("../services/engagement.service"));
const response_1 = require("../utils/response");
const toggleLike = async (req, res, next) => {
    try {
        const result = await engagementService.toggleLike(BigInt(req.params.postId), req.userId);
        (0, response_1.sendSuccess)(res, result);
    }
    catch (err) {
        next(err);
    }
};
exports.toggleLike = toggleLike;
const toggleBookmark = async (req, res, next) => {
    try {
        const result = await engagementService.toggleBookmark(BigInt(req.params.postId), req.userId);
        (0, response_1.sendSuccess)(res, result);
    }
    catch (err) {
        next(err);
    }
};
exports.toggleBookmark = toggleBookmark;
const getBookmarks = async (req, res, next) => {
    try {
        const bookmarks = await engagementService.getUserBookmarks(req.userId);
        (0, response_1.sendSuccess)(res, bookmarks);
    }
    catch (err) {
        next(err);
    }
};
exports.getBookmarks = getBookmarks;
const addReaction = async (req, res, next) => {
    try {
        const reaction = await engagementService.addReaction(BigInt(req.params.postId), req.userId, req.body.reactionType);
        (0, response_1.sendSuccess)(res, reaction);
    }
    catch (err) {
        next(err);
    }
};
exports.addReaction = addReaction;
const removeReaction = async (req, res, next) => {
    try {
        await engagementService.removeReaction(BigInt(req.params.postId), req.userId, req.body.reactionType);
        (0, response_1.sendSuccess)(res, { removed: true });
    }
    catch (err) {
        next(err);
    }
};
exports.removeReaction = removeReaction;
const getPostReactions = async (req, res, next) => {
    try {
        const reactions = await engagementService.getPostReactions(BigInt(req.params.postId));
        (0, response_1.sendSuccess)(res, reactions);
    }
    catch (err) {
        next(err);
    }
};
exports.getPostReactions = getPostReactions;
//# sourceMappingURL=engagement.controller.js.map