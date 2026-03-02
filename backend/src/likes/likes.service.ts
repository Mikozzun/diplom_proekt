import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

@Injectable()
export class LikesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Like a post (toggle: if already liked, unlike it).
   */
  async toggle(postId: string, userId: string) {
    const postBigInt = BigInt(postId);
    const userBigInt = BigInt(userId);

    // Verify the post exists
    const post = await this.prisma.post.findUnique({
      where: { id: postBigInt },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if already liked
    const existing = await this.prisma.like.findFirst({
      where: { userId: userBigInt, postId: postBigInt },
    });

    if (existing) {
      // Unlike
      await this.prisma.like.delete({ where: { id: existing.id } });
      return { liked: false };
    }

    // Like
    await this.prisma.like.create({
      data: { userId: userBigInt, postId: postBigInt },
    });

    return { liked: true };
  }

  /**
   * Remove a like explicitly.
   */
  async unlike(postId: string, userId: string) {
    const existing = await this.prisma.like.findFirst({
      where: { userId: BigInt(userId), postId: BigInt(postId) },
    });

    if (!existing) {
      throw new NotFoundException('Like not found');
    }

    await this.prisma.like.delete({ where: { id: existing.id } });

    return { message: 'Like removed' };
  }

  /**
   * List users who liked a post with cursor-based pagination.
   */
  async findByPost(
    postId: string,
    options: { cursor?: string; limit?: number } = {},
  ) {
    const postBigInt = BigInt(postId);

    // Verify the post exists
    const post = await this.prisma.post.findUnique({
      where: { id: postBigInt },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const take = Math.min(options.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

    const likes = await this.prisma.like.findMany({
      where: { postId: postBigInt },
      take: take + 1,
      ...(options.cursor && {
        cursor: { id: BigInt(options.cursor) },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, profileImage: true } },
      },
    });

    const hasMore = likes.length > take;
    const results = hasMore ? likes.slice(0, take) : likes;

    return {
      data: results.map((l) => this.serialize(l)),
      hasMore,
      nextCursor:
        results.length > 0 ? results[results.length - 1].id.toString() : null,
    };
  }

  private serialize(like: any) {
    return {
      id: like.id.toString(),
      userId: like.userId?.toString() ?? null,
      postId: like.postId?.toString() ?? null,
      createdAt: like.createdAt,
      user: like.user
        ? {
            id: like.user.id.toString(),
            username: like.user.username,
            profileImage: like.user.profileImage,
          }
        : null,
    };
  }
}
