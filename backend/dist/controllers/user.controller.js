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
exports.deleteAccount = exports.revokeSession = exports.getMySessions = exports.updateSettings = exports.getSettings = exports.getUserProfile = exports.updateMe = exports.getMe = void 0;
const userService = __importStar(require("../services/user.service"));
const sessionService = __importStar(require("../services/session.service"));
const response_1 = require("../utils/response");
const getMe = async (req, res, next) => {
    try {
        const user = await userService.getUserById(req.userId);
        if (!user) {
            (0, response_1.sendError)(res, 'User not found', 404);
            return;
        }
        (0, response_1.sendSuccess)(res, user);
    }
    catch (err) {
        next(err);
    }
};
exports.getMe = getMe;
const updateMe = async (req, res, next) => {
    try {
        const user = await userService.updateUser(req.userId, req.body);
        (0, response_1.sendSuccess)(res, user);
    }
    catch (err) {
        next(err);
    }
};
exports.updateMe = updateMe;
const getUserProfile = async (req, res, next) => {
    try {
        const user = await userService.getUserProfile(BigInt(req.params.id));
        if (!user) {
            (0, response_1.sendError)(res, 'User not found', 404);
            return;
        }
        (0, response_1.sendSuccess)(res, user);
    }
    catch (err) {
        next(err);
    }
};
exports.getUserProfile = getUserProfile;
const getSettings = async (req, res, next) => {
    try {
        const settings = await userService.getUserSettings(req.userId);
        (0, response_1.sendSuccess)(res, settings);
    }
    catch (err) {
        next(err);
    }
};
exports.getSettings = getSettings;
const updateSettings = async (req, res, next) => {
    try {
        const settings = await userService.updateUserSettings(req.userId, req.body);
        (0, response_1.sendSuccess)(res, settings);
    }
    catch (err) {
        next(err);
    }
};
exports.updateSettings = updateSettings;
const getMySessions = async (req, res, next) => {
    try {
        const sessions = await sessionService.getUserSessions(req.userId);
        (0, response_1.sendSuccess)(res, sessions);
    }
    catch (err) {
        next(err);
    }
};
exports.getMySessions = getMySessions;
const revokeSession = async (req, res, next) => {
    try {
        await sessionService.revokeSession(BigInt(req.params.sessionId), req.userId);
        (0, response_1.sendNoContent)(res);
    }
    catch (err) {
        next(err);
    }
};
exports.revokeSession = revokeSession;
const deleteAccount = async (req, res, next) => {
    try {
        await userService.deleteUser(req.userId);
        res.clearCookie('refreshToken');
        (0, response_1.sendNoContent)(res);
    }
    catch (err) {
        next(err);
    }
};
exports.deleteAccount = deleteAccount;
//# sourceMappingURL=user.controller.js.map