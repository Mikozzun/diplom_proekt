import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UpdateProfileDto, UpdateSettingsDto } from './dto/index.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get a user's own profile (includes settings).
   */
  async getProfile(userId: string) {
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
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id.toString(),
      email: user.email,
      username: user.username,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
    };
  }

  /**
   * Get a public profile by user ID (no phone number).
   */
  async getPublicProfile(targetUserId: string) {
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
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id.toString(),
      username: user.username,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      postCount: user._count.posts,
    };
  }

  /**
   * Update own profile fields (username, profileImage).
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: Record<string, unknown> = {};
    if (dto.username !== undefined) data.username = dto.username;
    if (dto.profileImage !== undefined) data.profileImage = dto.profileImage;

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

  /**
   * Get settings for the authenticated user.
   */
  async getSettings(userId: string) {
    let settings = await this.prisma.userSettings.findUnique({
      where: { userId: BigInt(userId) },
    });

    if (!settings) {
      // Create default settings if they don't exist
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

  /**
   * Update settings for the authenticated user.
   */
  async updateSettings(userId: string, dto: UpdateSettingsDto) {
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
}
