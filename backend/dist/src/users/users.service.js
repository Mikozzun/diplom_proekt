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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_js_1 = require("../../prisma/prisma.service.js");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: BigInt(userId) },
            select: {
                id: true,
                email: true,
                username: true,
                profileImage: true,
                createdAt: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return {
            id: user.id.toString(),
            email: user.email,
            username: user.username,
            profileImage: user.profileImage,
            createdAt: user.createdAt,
        };
    }
    async getPublicProfile(targetUserId) {
        const user = await this.prisma.user.findUnique({
            where: { id: BigInt(targetUserId) },
            select: {
                id: true,
                username: true,
                profileImage: true,
                createdAt: true,
                _count: {
                    select: { posts: true },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return {
            id: user.id.toString(),
            username: user.username,
            profileImage: user.profileImage,
            createdAt: user.createdAt,
            postCount: user._count.posts,
        };
    }
    async updateProfile(userId, dto) {
        const data = {};
        if (dto.username !== undefined)
            data.username = dto.username;
        if (dto.profileImage !== undefined)
            data.profileImage = dto.profileImage;
        if (Object.keys(data).length === 0) {
            return this.getProfile(userId);
        }
        const user = await this.prisma.user.update({
            where: { id: BigInt(userId) },
            data,
            select: {
                id: true,
                email: true,
                username: true,
                profileImage: true,
                createdAt: true,
            },
        });
        return {
            id: user.id.toString(),
            email: user.email,
            username: user.username,
            profileImage: user.profileImage,
            createdAt: user.createdAt,
        };
    }
    async getSettings(userId) {
        let settings = await this.prisma.userSettings.findUnique({
            where: { userId: BigInt(userId) },
        });
        if (!settings) {
            settings = await this.prisma.userSettings.create({
                data: { userId: BigInt(userId) },
            });
        }
        return {
            id: settings.id.toString(),
            theme: settings.theme,
            notificationsEnabled: settings.notificationsEnabled,
            createdAt: settings.createdAt,
        };
    }
    async updateSettings(userId, dto) {
        const settings = await this.prisma.userSettings.upsert({
            where: { userId: BigInt(userId) },
            update: {
                ...(dto.theme !== undefined && { theme: dto.theme }),
                ...(dto.notificationsEnabled !== undefined && {
                    notificationsEnabled: dto.notificationsEnabled,
                }),
            },
            create: {
                userId: BigInt(userId),
                theme: dto.theme ?? 'light',
                notificationsEnabled: dto.notificationsEnabled ?? true,
            },
        });
        return {
            id: settings.id.toString(),
            theme: settings.theme,
            notificationsEnabled: settings.notificationsEnabled,
            createdAt: settings.createdAt,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map