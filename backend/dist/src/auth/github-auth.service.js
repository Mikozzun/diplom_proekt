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
var GithubAuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubAuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_js_1 = require("../../prisma/prisma.service.js");
let GithubAuthService = GithubAuthService_1 = class GithubAuthService {
    prisma;
    logger = new common_1.Logger(GithubAuthService_1.name);
    clientId = process.env.GITHUB_CLIENT_ID ?? '';
    clientSecret = process.env.GITHUB_CLIENT_SECRET ?? '';
    callbackUrl = process.env.GITHUB_CALLBACK_URL ??
        'http://localhost:3000/auth/github/callback';
    constructor(prisma) {
        this.prisma = prisma;
    }
    getAuthorizationUrl(options = {}) {
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.callbackUrl,
            scope: 'read:user user:email',
        });
        if (options.state) {
            params.set('state', options.state);
        }
        return `https://github.com/login/oauth/authorize?${params.toString()}`;
    }
    async handleCallback(code) {
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({
                client_id: this.clientId,
                client_secret: this.clientSecret,
                code,
            }),
        });
        const tokenData = (await tokenRes.json());
        this.logger.debug(`GitHub token response: ${JSON.stringify(tokenData)}`);
        if (!tokenData.access_token) {
            throw new common_1.BadRequestException(tokenData.error_description ??
                'Failed to exchange GitHub code for token');
        }
        const userRes = await fetch('https://api.github.com/user', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
                Accept: 'application/json',
            },
        });
        const ghUser = (await userRes.json());
        this.logger.debug(`GitHub user response: ${JSON.stringify(ghUser)}`);
        if (!ghUser.id) {
            throw new common_1.BadRequestException('Failed to fetch GitHub user info');
        }
        let email = ghUser.email;
        if (!email) {
            const emailsRes = await fetch('https://api.github.com/user/emails', {
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`,
                    Accept: 'application/json',
                },
            });
            const emails = (await emailsRes.json());
            const primary = emails.find((e) => e.primary && e.verified);
            email = primary?.email ?? null;
        }
        const githubId = ghUser.id.toString();
        let user = await this.prisma.user.findUnique({
            where: { githubId },
        });
        if (!user) {
            if (email) {
                const byEmail = await this.prisma.user.findUnique({
                    where: { email },
                });
                if (byEmail) {
                    user = await this.prisma.user.update({
                        where: { id: byEmail.id },
                        data: { githubId },
                    });
                }
            }
            if (!user) {
                user = await this.prisma.user.create({
                    data: {
                        githubId,
                        email,
                        username: ghUser.login,
                        profileImage: ghUser.avatar_url,
                    },
                });
            }
        }
        this.logger.log(`GitHub login: user ${user.id} (${ghUser.login})`);
        return {
            userId: user.id.toString(),
            email: user.email,
            username: user.username,
        };
    }
};
exports.GithubAuthService = GithubAuthService;
exports.GithubAuthService = GithubAuthService = GithubAuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], GithubAuthService);
//# sourceMappingURL=github-auth.service.js.map