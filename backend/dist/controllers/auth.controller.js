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
exports.logout = exports.refresh = exports.login = exports.register = void 0;
const authService = __importStar(require("../services/auth.service"));
const sessionService = __importStar(require("../services/session.service"));
const jwt_1 = require("../utils/jwt");
const response_1 = require("../utils/response");
const register = async (req, res, next) => {
    try {
        const { username, phoneNumber, passkey } = req.body;
        const user = await authService.register(username, phoneNumber, passkey);
        (0, response_1.sendCreated)(res, user);
    }
    catch (err) {
        if (err.message === 'User already exists') {
            (0, response_1.sendError)(res, err.message, 409);
        }
        else {
            next(err);
        }
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { username, passkey } = req.body;
        const deviceInfo = req.headers['user-agent'];
        const ipAddress = req.ip;
        const result = await authService.login(username, passkey, deviceInfo, ipAddress);
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        (0, response_1.sendSuccess)(res, {
            user: result.user,
            accessToken: result.accessToken,
        });
    }
    catch (err) {
        if (err.message === 'Invalid credentials') {
            (0, response_1.sendError)(res, err.message, 401);
        }
        else {
            next(err);
        }
    }
};
exports.login = login;
const refresh = async (req, res, next) => {
    try {
        const token = req.cookies?.refreshToken || req.body.refreshToken;
        if (!token) {
            (0, response_1.sendError)(res, 'Refresh token required', 401);
            return;
        }
        const payload = (0, jwt_1.verifyRefreshToken)(token);
        const userId = BigInt(payload.userId);
        const session = await sessionService.validateRefreshToken(userId, token);
        if (!session) {
            (0, response_1.sendError)(res, 'Invalid refresh token', 401);
            return;
        }
        const tokens = (0, jwt_1.generateTokenPair)(userId.toString());
        await sessionService.rotateRefreshToken(session.id, tokens.refreshToken);
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        (0, response_1.sendSuccess)(res, { accessToken: tokens.accessToken });
    }
    catch (err) {
        next(err);
    }
};
exports.refresh = refresh;
const logout = async (req, res, next) => {
    try {
        if (req.userId) {
            await sessionService.revokeAllSessions(req.userId);
        }
        res.clearCookie('refreshToken');
        (0, response_1.sendSuccess)(res, { message: 'Logged out' });
    }
    catch (err) {
        next(err);
    }
};
exports.logout = logout;
//# sourceMappingURL=auth.controller.js.map