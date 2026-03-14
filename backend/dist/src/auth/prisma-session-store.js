"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaSessionStore = void 0;
const express_session_1 = require("express-session");
class PrismaSessionStore extends express_session_1.Store {
    ttlMs;
    prisma;
    cleanupTimer = null;
    constructor(prisma, ttlMs = 7 * 24 * 60 * 60 * 1000) {
        super();
        this.ttlMs = ttlMs;
        this.prisma = prisma;
        this.cleanupTimer = setInterval(() => {
            void this.cleanup();
        }, 15 * 60 * 1000);
    }
    get = (sid, callback) => {
        this.prisma.session
            .findUnique({ where: { id: sid } })
            .then((row) => {
            if (!row)
                return callback(null, null);
            if (row.expiresAt < new Date()) {
                this.prisma.session.delete({ where: { id: sid } }).catch(() => { });
                return callback(null, null);
            }
            callback(null, JSON.parse(row.data));
        })
            .catch((err) => callback(err));
    };
    set = (sid, session, callback) => {
        const maxAge = session.cookie?.maxAge ?? this.ttlMs;
        const expiresAt = new Date(Date.now() + maxAge);
        const data = JSON.stringify(session);
        this.prisma.session
            .upsert({
            where: { id: sid },
            update: { data, expiresAt },
            create: { id: sid, data, expiresAt },
        })
            .then(() => callback?.())
            .catch((err) => callback?.(err));
    };
    destroy = (sid, callback) => {
        this.prisma.session
            .delete({ where: { id: sid } })
            .then(() => callback?.())
            .catch((err) => {
            const prismaErr = err;
            if (prismaErr?.code === 'P2025')
                return callback?.();
            callback?.(err);
        });
    };
    touch = (sid, session, callback) => {
        const maxAge = session.cookie?.maxAge ?? this.ttlMs;
        const expiresAt = new Date(Date.now() + maxAge);
        this.prisma.session
            .update({ where: { id: sid }, data: { expiresAt } })
            .then(() => callback?.())
            .catch((err) => callback?.(err));
    };
    async cleanup() {
        try {
            await this.prisma.session.deleteMany({
                where: { expiresAt: { lt: new Date() } },
            });
        }
        catch {
        }
    }
    close() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
    }
}
exports.PrismaSessionStore = PrismaSessionStore;
//# sourceMappingURL=prisma-session-store.js.map