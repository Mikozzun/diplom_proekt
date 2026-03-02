import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

@Injectable()
export class BookmarksService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Bookmark a post (toggle: if already bookmarked, remove it).
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

    // Check if already bookmarked
    const existing = await this.prisma.bookmark.findFirst({
      where: { userId: userBigInt, postId: postBigInt },
    });

    if (existing) {
      await this.prisma.bookmark.delete({ where: { id: existing.id } });
      return { bookmarked: false };
    }

    await this.prisma.bookmark.create({
      data: { userId: userBigInt, postId: postBigInt },
    });

    return { bookmarked: true };
  }

  /**
   * Remove a bookmark explicitly.
   */
  async remove(postId: string, userId: string) {
    const existing = await this.prisma.bookmark.findFirst({
      where: { userId: BigInt(userId), postId: BigInt(postId) },
    });

    if (!existing) {
      throw new NotFoundException('Bookmark not found');
    }

    await this.prisma.bookmark.delete({ where: { id: existing.id } });

    return { message: 'Bookmark removed' };
  }

  /**
   * List the current user's bookmarks with cursor-based pagination.
   */
  async findByUser(
    userId: string,
    options: { cursor?: string; limit?: number } = {},
  ) {
    const take = Math.min(options.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId: BigInt(userId) },
      take: take + 1,
      ...(options.cursor && {
        cursor: { id: BigInt(options.cursor) },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
          include: {
            user: {
              select: { id: true, username: true, profileImage: true },
            },
            _count: { select: { comments: true, likes: true } },
          },
        },
      },
    });

    const hasMore = bookmarks.length > take;
    const results = hasMore ? bookmarks.slice(0, take) : bookmarks;

    return {
      data: results.map((b) => this.serialize(b)),
      hasMore,
      nextCursor:
        results.length > 0 ? results[results.length - 1].id.toString() : null,
    };
  }

  private serialize(bookmark: any) {
    return {
      id: bookmark.id.toString(),
      createdAt: bookmark.createdAt,
      post: bookmark.post
        ? {
            id: bookmark.post.id.toString(),
            userId: bookmark.post.userId?.toString() ?? null,
            content: bookmark.post.content,
            imageUrl: bookmark.post.imageUrl,
            videoUrl: bookmark.post.videoUrl,
            createdAt: bookmark.post.createdAt,
            author: bookmark.post.user
              ? {
                  id: bookmark.post.user.id.toString(),
                  username: bookmark.post.user.username,
                  profileImage: bookmark.post.user.profileImage,
                }
              : null,
            commentCount: bookmark.post._count?.comments ?? 0,
            likeCount: bookmark.post._count?.likes ?? 0,
          }
        : null,
    };
  }
}
