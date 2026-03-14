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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const github_auth_service_js_1 = require("./github-auth.service.js");
const telegram_auth_service_js_1 = require("./telegram-auth.service.js");
const session_service_js_1 = require("./session.service.js");
const session_guard_js_1 = require("./guards/session.guard.js");
const prisma_service_js_1 = require("../../prisma/prisma.service.js");
const index_js_1 = require("./dto/index.js");
let AuthController = class AuthController {
    githubAuth;
    telegramAuth;
    sessionService;
    prisma;
    constructor(githubAuth, telegramAuth, sessionService, prisma) {
        this.githubAuth = githubAuth;
        this.telegramAuth = telegramAuth;
        this.sessionService = sessionService;
        this.prisma = prisma;
    }
    githubRedirect(res) {
        const url = this.githubAuth.getAuthorizationUrl();
        res.redirect(url);
    }
    async githubCallback(code, req, res) {
        if (!code) {
            throw new common_1.BadRequestException('Missing authorization code');
        }
        const result = await this.githubAuth.handleCallback(code);
        this.sessionService.createSession(req, result.userId, result.email ?? '');
        const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
        res.redirect(`${frontendUrl}/auth/success`);
    }
    async telegramRequestCode() {
        return this.telegramAuth.createLoginCode();
    }
    async telegramVerifyCode(dto, req) {
        const result = await this.telegramAuth.authenticateWithCode(dto.code);
        this.sessionService.createSession(req, result.userId, result.email ?? '');
        return {
            userId: result.userId,
            email: result.email,
            username: result.username,
            message: 'Logged in via Telegram code successfully',
        };
    }
    async telegramLogin(dto, req) {
        const result = await this.telegramAuth.authenticate(dto);
        this.sessionService.createSession(req, result.userId, result.email ?? '');
        return {
            userId: result.userId,
            email: result.email,
            username: result.username,
            message: 'Logged in via Telegram successfully',
        };
    }
    async telegramCallback(idRaw, authDateRaw, hash, firstName, lastName, username, photoUrl, returnToRaw, req, res) {
        const id = Number(idRaw);
        const authDate = Number(authDateRaw);
        if (!Number.isFinite(id) || !Number.isFinite(authDate) || !hash) {
            throw new common_1.BadRequestException('Missing or invalid Telegram callback data');
        }
        const result = await this.telegramAuth.authenticate({
            id,
            auth_date: authDate,
            hash,
            first_name: firstName,
            last_name: lastName,
            username,
            photo_url: photoUrl,
        });
        this.sessionService.createSession(req, result.userId, result.email ?? '');
        const redirectPath = this.getSafeReturnPath(returnToRaw);
        const redirectUrl = new URL(redirectPath, `${req.protocol}://${req.get('host')}`);
        redirectUrl.searchParams.set('auth', 'telegram-success');
        res.redirect(redirectUrl.pathname + redirectUrl.search);
    }
    async me(req) {
        const userId = req.session.userId;
        if (!userId) {
            throw new common_1.BadRequestException('No active session');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: BigInt(userId) },
            select: {
                githubId: true,
                telegramId: true,
                passwordHash: true,
            },
        });
        return {
            userId,
            email: req.session.email,
            sessionId: req.sessionID,
            userAgent: req.session.userAgent,
            ip: req.session.ip,
            createdAt: req.session.createdAt,
            authStatus: {
                github: Boolean(user?.githubId),
                telegram: Boolean(user?.telegramId),
            },
        };
    }
    async listSessions(req) {
        const userId = req.session.userId;
        if (!userId)
            throw new common_1.BadRequestException('No active session');
        const sessions = await this.sessionService.listUserSessions(userId);
        return { sessions, currentSessionId: req.sessionID };
    }
    async destroySession(sessionId, req) {
        const userId = req.session.userId;
        if (!userId)
            throw new common_1.BadRequestException('No active session');
        const userSessions = await this.sessionService.listUserSessions(userId);
        const ownsSession = userSessions.some((s) => s.sessionId === sessionId);
        if (!ownsSession) {
            throw new common_1.BadRequestException('Session not found');
        }
        await this.sessionService.destroySession(sessionId);
        return { message: 'Session destroyed' };
    }
    async logout(req) {
        if (!req.session?.userId) {
            return { message: 'Already logged out' };
        }
        return new Promise((resolve, reject) => {
            req.session.destroy((err) => {
                if (err) {
                    reject(err instanceof Error ? err : new Error('Session destroy failed'));
                    return;
                }
                resolve({ message: 'Logged out successfully' });
            });
        });
    }
    async logoutAll(req) {
        const userId = req.session.userId;
        if (!userId) {
            return { message: 'Already logged out from all devices' };
        }
        const count = await this.sessionService.destroyAllUserSessions(userId);
        return { message: `Destroyed ${count} session(s)` };
    }
    getSafeReturnPath(returnToRaw) {
        if (!returnToRaw) {
            return '/test';
        }
        if (!returnToRaw.startsWith('/') || returnToRaw.startsWith('//')) {
            return '/test';
        }
        return returnToRaw;
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Get)('github'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "githubRedirect", null);
__decorate([
    (0, common_1.Get)('github/callback'),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "githubCallback", null);
__decorate([
    (0, common_1.Post)('telegram/code/request'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "telegramRequestCode", null);
__decorate([
    (0, common_1.Post)('telegram/code/verify'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [index_js_1.TelegramCodeVerifyDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "telegramVerifyCode", null);
__decorate([
    (0, common_1.Post)('telegram'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [index_js_1.TelegramAuthDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "telegramLogin", null);
__decorate([
    (0, common_1.Get)('telegram/callback'),
    __param(0, (0, common_1.Query)('id')),
    __param(1, (0, common_1.Query)('auth_date')),
    __param(2, (0, common_1.Query)('hash')),
    __param(3, (0, common_1.Query)('first_name')),
    __param(4, (0, common_1.Query)('last_name')),
    __param(5, (0, common_1.Query)('username')),
    __param(6, (0, common_1.Query)('photo_url')),
    __param(7, (0, common_1.Query)('returnTo')),
    __param(8, (0, common_1.Req)()),
    __param(9, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, Object, Object, Object, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "telegramCallback", null);
__decorate([
    (0, common_1.UseGuards)(session_guard_js_1.SessionGuard),
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
__decorate([
    (0, common_1.UseGuards)(session_guard_js_1.SessionGuard),
    (0, common_1.Get)('sessions'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "listSessions", null);
__decorate([
    (0, common_1.UseGuards)(session_guard_js_1.SessionGuard),
    (0, common_1.Delete)('sessions/:sessionId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "destroySession", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('logout/all'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logoutAll", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [github_auth_service_js_1.GithubAuthService,
        telegram_auth_service_js_1.TelegramAuthService,
        session_service_js_1.SessionService,
        prisma_service_js_1.PrismaService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map