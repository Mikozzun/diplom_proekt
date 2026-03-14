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
var TelegramAuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramAuthService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const prisma_service_js_1 = require("../../prisma/prisma.service.js");
let TelegramAuthService = TelegramAuthService_1 = class TelegramAuthService {
    prisma;
    logger = new common_1.Logger(TelegramAuthService_1.name);
    botToken = process.env.TELEGRAM_BOT_TOKEN ?? '';
    botUsername = process.env.TELEGRAM_BOT_USERNAME ?? 'frogger_authbot';
    codeTtlMs = 5 * 60 * 1000;
    botBaseUrl = process.env.TELEGRAM_BOT_INTERNAL_URL ??
        `http://127.0.0.1:${process.env.BOT_PORT ?? '3001'}`;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createLoginCode() {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const ttlSeconds = Math.floor(this.codeTtlMs / 1000);
        await this.registerCodeInBot(code, ttlSeconds);
        return {
            code,
            expiresInSeconds: ttlSeconds,
            botStartUrl: `https://t.me/${this.botUsername}?start=login_${code}`,
            instruction: 'Open the bot link, press Start (or send /start login_CODE), then verify the same code here.',
        };
    }
    async authenticateWithCode(code) {
        const matchedUser = await this.consumeCodeFromBot(code);
        if (!matchedUser?.id) {
            throw new common_1.UnauthorizedException('Code not confirmed by bot yet. Open the bot link and press Start, then retry.');
        }
        return this.upsertTelegramUser({
            id: matchedUser.id,
            username: matchedUser.username,
            first_name: matchedUser.first_name,
            last_name: matchedUser.last_name,
            photo_url: matchedUser.photo_url,
        });
    }
    verifyAuth(data) {
        const { hash, ...rest } = data;
        const checkString = Object.keys(rest)
            .sort()
            .map((key) => `${key}=${rest[key]}`)
            .join('\n');
        const secretKey = (0, node_crypto_1.createHash)('sha256').update(this.botToken).digest();
        const hmac = (0, node_crypto_1.createHmac)('sha256', secretKey)
            .update(checkString)
            .digest('hex');
        return hmac === hash;
    }
    async authenticate(data) {
        if (!this.verifyAuth(data)) {
            throw new common_1.UnauthorizedException('Invalid Telegram auth data');
        }
        const now = Math.floor(Date.now() / 1000);
        if (now - data.auth_date > 300) {
            throw new common_1.UnauthorizedException('Telegram auth data expired');
        }
        return this.upsertTelegramUser(data);
    }
    async upsertTelegramUser(data) {
        const telegramId = data.id.toString();
        const displayName = data.username ??
            [data.first_name, data.last_name].filter(Boolean).join(' ') ??
            `tg_${data.id}`;
        let user = await this.prisma.user.findUnique({ where: { telegramId } });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    telegramId,
                    username: displayName,
                    profileImage: data.photo_url ?? null,
                },
            });
        }
        this.logger.log(`Telegram login: user ${user.id} (${displayName})`);
        return {
            userId: user.id.toString(),
            email: user.email,
            username: user.username,
        };
    }
    async registerCodeInBot(code, ttlSeconds) {
        const payload = await this.callBotApi('/codes/register', {
            code,
            ttlSeconds,
        });
        if (!payload?.ok) {
            throw new common_1.UnauthorizedException(payload?.message ?? 'Failed to register Telegram login code');
        }
    }
    async consumeCodeFromBot(code) {
        const payload = await this.callBotApi('/codes/consume', { code });
        if (!payload?.ok) {
            return null;
        }
        return payload.user;
    }
    async callBotApi(path, body) {
        if (!this.botToken) {
            throw new common_1.UnauthorizedException('Telegram bot token is not configured');
        }
        try {
            const res = await fetch(`${this.botBaseUrl}${path}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(body),
            });
            return (await res.json());
        }
        catch {
            this.logger.error('Telegram bot service is unreachable');
            throw new common_1.UnauthorizedException('Telegram bot service is unavailable. Please try again in a few seconds.');
        }
    }
};
exports.TelegramAuthService = TelegramAuthService;
exports.TelegramAuthService = TelegramAuthService = TelegramAuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], TelegramAuthService);
//# sourceMappingURL=telegram-auth.service.js.map