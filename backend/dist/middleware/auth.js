"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.optionalAuth = exports.authenticate = void 0;
const express_1 = require("@clerk/express");
const jwt_1 = require("../utils/jwt");
const database_1 = require("../config/database");
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        try {
            const payload = (0, jwt_1.verifyAccessToken)(authHeader.slice(7));
            req.userId = BigInt(payload.userId);
            return next();
        }
        catch { }
    }
    try {
        const auth = (0, express_1.getAuth)(req);
        if (auth?.userId) {
            const user = await database_1.prisma.user.findFirst({
                where: { clerkId: auth.userId },
            });
            if (user) {
                req.userId = user.id;
                return next();
            }
        }
    }
    catch { }
    res.status(401).json({ success: false, error: 'Unauthorized' });
};
exports.authenticate = authenticate;
const optionalAuth = async (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        try {
            const payload = (0, jwt_1.verifyAccessToken)(authHeader.slice(7));
            req.userId = BigInt(payload.userId);
        }
        catch { }
    }
    next();
};
exports.optionalAuth = optionalAuth;
const requireAdmin = async (req, res, next) => {
    if (!req.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
    }
    const admin = await database_1.prisma.admin.findUnique({
        where: { userId: req.userId },
    });
    if (!admin) {
        res.status(403).json({ success: false, error: 'Forbidden' });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
//# sourceMappingURL=auth.js.map