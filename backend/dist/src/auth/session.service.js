"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SessionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_js_1 = require("../../prisma/prisma.service.js");
let SessionService = SessionService_1 = class SessionService {
    prisma;
    logger = new common_1.Logger(SessionService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    createSession(req, userId, email) {
        req.session.userId = userId;
        req.session.email = email;
        req.session.userAgent = req.headers['user-agent'] ?? 'unknown';
        req.session.ip = req.ip ?? req.socket.remoteAddress;
        req.session.createdAt = Date.now();
    }
    async listUserSessions(userId) {
        const rows = await this.prisma.session.findMany({
            where: { expiresAt: { gt: new Date() } },
        });
        const sessions = [];
        for (const row of rows) {
            try {
                const data = JSON.parse(row.data);
                if (data.userId === userId) {
                    sessions.push({
                        sessionId: row.id,
                        userAgent: data.userAgent,
                        ip: data.ip,
                        createdAt: data.createdAt,
                    });
                }
            }
            catch {
            }
        }
        return sessions;
    }
    async destroySession(sessionId) {
        try {
            await this.prisma.session.delete({ where: { id: sessionId } });
            return true;
        }
        catch {
            return false;
        }
    }
    async destroyAllUserSessions(userId) {
        const rows = await this.prisma.session.findMany({
            where: { expiresAt: { gt: new Date() } },
        });
        let destroyed = 0;
        for (const row of rows) {
            try {
                const data = JSON.parse(row.data);
                if (data.userId === userId) {
                    await this.prisma.session.delete({ where: { id: row.id } });
                    destroyed++;
                }
            }
            catch {
            }
        }
        return destroyed;
    }
};
exports.SessionService = SessionService;
exports.SessionService = SessionService = SessionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], SessionService);
//# sourceMappingURL=session.service.js.map