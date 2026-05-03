"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncClerkUser = exports.loginWithClerk = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../config/database");
const jwt_1 = require("../utils/jwt");
const session_service_1 = require("./session.service");
const register = async (username, phoneNumber, passkey) => {
    const existing = await database_1.prisma.user.findFirst({
        where: { OR: [{ username }, { phoneNumber }] },
    });
    if (existing)
        throw new Error('User already exists');
    const hashed = await bcryptjs_1.default.hash(passkey, 12);
    const user = await database_1.prisma.user.create({
        data: { username, phoneNumber, passkey: hashed },
        select: { id: true, username: true, phoneNumber: true, createdAt: true },
    });
    await database_1.prisma.userSettings.create({ data: { userId: user.id } });
    await database_1.prisma.userActivityLog.create({
        data: { userId: user.id, action: 'register' },
    });
    return user;
};
exports.register = register;
const login = async (username, passkey, deviceInfo, ipAddress) => {
    const user = await database_1.prisma.user.findUnique({ where: { username } });
    if (!user)
        throw new Error('Invalid credentials');
    const valid = await bcryptjs_1.default.compare(passkey, user.passkey);
    if (!valid)
        throw new Error('Invalid credentials');
    const tokens = (0, jwt_1.generateTokenPair)(user.id.toString());
    const { session } = await (0, session_service_1.createSession)(user.id, tokens.refreshToken, deviceInfo, ipAddress);
    await database_1.prisma.userActivityLog.create({
        data: { userId: user.id, action: 'login' },
    });
    return {
        user: {
            id: user.id,
            username: user.username,
            profileImage: user.profileImage,
        },
        ...tokens,
    };
};
exports.login = login;
const loginWithClerk = async (clerkId) => {
    let user = await database_1.prisma.user.findUnique({ where: { clerkId } });
    if (!user)
        return null;
    const tokens = (0, jwt_1.generateTokenPair)(user.id.toString());
    await database_1.prisma.userActivityLog.create({
        data: { userId: user.id, action: 'clerk_login' },
    });
    return {
        user: {
            id: user.id,
            username: user.username,
            profileImage: user.profileImage,
        },
        ...tokens,
    };
};
exports.loginWithClerk = loginWithClerk;
const syncClerkUser = async (clerkId, username, phoneNumber) => {
    let user = await database_1.prisma.user.findUnique({ where: { clerkId } });
    if (user)
        return user;
    const hashed = await bcryptjs_1.default.hash(clerkId, 12);
    user = await database_1.prisma.user.create({
        data: { username, phoneNumber, passkey: hashed, clerkId },
    });
    await database_1.prisma.userSettings.create({ data: { userId: user.id } });
    return user;
};
exports.syncClerkUser = syncClerkUser;
//# sourceMappingURL=auth.service.js.map