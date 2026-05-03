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
exports.finishAuthentication = exports.startAuthentication = exports.finishRegistration = exports.startRegistration = void 0;
const database_1 = require("../config/database");
const passkeyUtils = __importStar(require("../utils/passkey"));
const jwt_1 = require("../utils/jwt");
const session_service_1 = require("../services/session.service");
const response_1 = require("../utils/response");
const challengeStore = new Map();
const startRegistration = async (req, res, next) => {
    try {
        const userId = req.userId;
        const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            (0, response_1.sendError)(res, 'User not found', 404);
            return;
        }
        const existing = await database_1.prisma.passkeyCredential.findMany({
            where: { userId },
        });
        const options = await passkeyUtils.getRegistrationOptions(userId.toString(), user.username, existing.map((c) => ({
            credentialId: c.credentialId,
            publicKey: c.publicKey,
            counter: Number(c.counter),
            transports: c.transports,
        })));
        challengeStore.set(userId.toString(), options.challenge);
        (0, response_1.sendSuccess)(res, options);
    }
    catch (err) {
        next(err);
    }
};
exports.startRegistration = startRegistration;
const finishRegistration = async (req, res, next) => {
    try {
        const userId = req.userId;
        const challenge = challengeStore.get(userId.toString());
        if (!challenge) {
            (0, response_1.sendError)(res, 'No challenge found', 400);
            return;
        }
        const verification = await passkeyUtils.verifyRegistration(req.body, challenge);
        if (!verification.verified || !verification.registrationInfo) {
            (0, response_1.sendError)(res, 'Verification failed', 400);
            return;
        }
        const { credential } = verification.registrationInfo;
        await database_1.prisma.passkeyCredential.create({
            data: {
                userId,
                credentialId: credential.id,
                publicKey: Buffer.from(credential.publicKey).toString('base64'),
                counter: BigInt(credential.counter),
                deviceType: verification.registrationInfo.credentialDeviceType,
                backedUp: verification.registrationInfo.credentialBackedUp,
            },
        });
        challengeStore.delete(userId.toString());
        (0, response_1.sendSuccess)(res, { verified: true });
    }
    catch (err) {
        next(err);
    }
};
exports.finishRegistration = finishRegistration;
const startAuthentication = async (req, res, next) => {
    try {
        const { username } = req.body;
        const user = await database_1.prisma.user.findUnique({ where: { username } });
        if (!user) {
            (0, response_1.sendError)(res, 'User not found', 404);
            return;
        }
        const credentials = await database_1.prisma.passkeyCredential.findMany({
            where: { userId: user.id },
        });
        if (credentials.length === 0) {
            (0, response_1.sendError)(res, 'No passkeys registered', 400);
            return;
        }
        const options = await passkeyUtils.getAuthenticationOptions(credentials.map((c) => ({
            credentialId: c.credentialId,
            publicKey: c.publicKey,
            counter: Number(c.counter),
            transports: c.transports,
        })));
        challengeStore.set(user.id.toString(), options.challenge);
        (0, response_1.sendSuccess)(res, { ...options, userId: user.id });
    }
    catch (err) {
        next(err);
    }
};
exports.startAuthentication = startAuthentication;
const finishAuthentication = async (req, res, next) => {
    try {
        const { userId: userIdStr, ...response } = req.body;
        const userId = BigInt(userIdStr);
        const challenge = challengeStore.get(userId.toString());
        if (!challenge) {
            (0, response_1.sendError)(res, 'No challenge found', 400);
            return;
        }
        const credential = await database_1.prisma.passkeyCredential.findUnique({
            where: { credentialId: response.id },
        });
        if (!credential || credential.userId !== userId) {
            (0, response_1.sendError)(res, 'Credential not found', 400);
            return;
        }
        const verification = await passkeyUtils.verifyAuthentication(response, challenge, {
            credentialId: credential.credentialId,
            publicKey: credential.publicKey,
            counter: Number(credential.counter),
            transports: credential.transports,
        });
        if (!verification.verified) {
            (0, response_1.sendError)(res, 'Authentication failed', 401);
            return;
        }
        await database_1.prisma.passkeyCredential.update({
            where: { id: credential.id },
            data: {
                counter: BigInt(verification.authenticationInfo.newCounter),
            },
        });
        const tokens = (0, jwt_1.generateTokenPair)(userId.toString());
        const deviceInfo = req.headers['user-agent'];
        await (0, session_service_1.createSession)(userId, tokens.refreshToken, deviceInfo, req.ip);
        challengeStore.delete(userId.toString());
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
exports.finishAuthentication = finishAuthentication;
//# sourceMappingURL=passkey.controller.js.map