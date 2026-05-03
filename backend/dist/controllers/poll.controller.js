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
exports.getPollResults = exports.respondToPoll = exports.createPoll = void 0;
const pollService = __importStar(require("../services/poll.service"));
const response_1 = require("../utils/response");
const createPoll = async (req, res, next) => {
    try {
        const poll = await pollService.createPoll(BigInt(req.params.postId), req.body.question, req.body.options);
        (0, response_1.sendCreated)(res, poll);
    }
    catch (err) {
        next(err);
    }
};
exports.createPoll = createPoll;
const respondToPoll = async (req, res, next) => {
    try {
        const response = await pollService.respondToPoll(BigInt(req.params.pollId), req.userId, req.body.selectedOption);
        (0, response_1.sendSuccess)(res, response);
    }
    catch (err) {
        if (err.message === 'Poll not found' || err.message === 'Invalid option') {
            (0, response_1.sendError)(res, err.message, 400);
        }
        else {
            next(err);
        }
    }
};
exports.respondToPoll = respondToPoll;
const getPollResults = async (req, res, next) => {
    try {
        const results = await pollService.getPollResults(BigInt(req.params.pollId));
        (0, response_1.sendSuccess)(res, results);
    }
    catch (err) {
        if (err.message === 'Poll not found') {
            (0, response_1.sendError)(res, err.message, 404);
        }
        else {
            next(err);
        }
    }
};
exports.getPollResults = getPollResults;
//# sourceMappingURL=poll.controller.js.map