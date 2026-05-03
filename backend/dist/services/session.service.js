"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanExpiredSessions = exports.revokeAllSessions = exports.revokeSession = exports.getUserSessions = exports.rotateRefreshToken = exports.validateRefreshToken = exports.createSession = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../config/database");
const createSession = async (userId, refreshToken, deviceInfo, ipAddress) => {
    const hashed = await bcryptjs_1.default.hash(refreshToken, 10);
    const session = await database_1.prisma.session.create({
        data: {
            userId,
            refreshToken: hashed,
            deviceInfo,
            ipAddress,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
    });
    return { session };
};
exports.createSession = createSession;
const validateRefreshToken = async (userId, refreshToken) => {
    const sessions = await database_1.prisma.session.findMany({
        where: { userId, expiresAt: { gt: new Date() } },
    });
    for (const session of sessions) {
        const valid = await bcryptjs_1.default.compare(refreshToken, session.refreshToken);
        if (valid) {
            await database_1.prisma.session.update({
                where: { id: session.id },
                data: { lastActive: new Date() },
            });
            return session;
        }
    }
    return null;
};
exports.validateRefreshToken = validateRefreshToken;
const rotateRefreshToken = async (sessionId, newRefreshToken) => {
    const hashed = await bcryptjs_1.default.hash(newRefreshToken, 10);
    return database_1.prisma.session.update({
        where: { id: sessionId },
        data: { refreshToken: hashed, lastActive: new Date() },
    });
};
exports.rotateRefreshToken = rotateRefreshToken;
const getUserSessions = async (userId) => {
    return database_1.prisma.session.findMany({
        where: { userId, expiresAt: { gt: new Date() } },
        select: {
            id: true,
            deviceInfo: true,
            ipAddress: true,
            lastActive: true,
            createdAt: true,
        },
    });
};
exports.getUserSessions = getUserSessions;
const revokeSession = async (sessionId, userId) => {
    return database_1.prisma.session.deleteMany({ where: { id: sessionId, userId } });
};
exports.revokeSession = revokeSession;
const revokeAllSessions = async (userId) => {
    return database_1.prisma.session.deleteMany({ where: { userId } });
};
exports.revokeAllSessions = revokeAllSessions;
const cleanExpiredSessions = async () => {
    return database_1.prisma.session.deleteMany({
        where: { expiresAt: { lt: new Date() } },
    });
};
exports.cleanExpiredSessions = cleanExpiredSessions;
//# sourceMappingURL=session.service.js.map