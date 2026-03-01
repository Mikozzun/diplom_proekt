import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateCommentDto, UpdateCommentDto } from './dto/index.js';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Add a comment to a post.
   */
  async create(postId: string, userId: string, dto: CreateCommentDto) {
    if (!dto.content?.trim()) {
      throw new BadRequestException('Comment content cannot be empty');
    }

    // Verify the post exists
    const post = await this.prisma.post.findUnique({
      where: { id: BigInt(postId) },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const comment = await this.prisma.comment.create({
      data: {
        postId: BigInt(postId),
        userId: BigInt(userId),
        content: dto.content.trim(),
      },
      include: {
        user: { select: { id: true, username: true, profileImage: true } },
      },
    });

    return this.serialize(comment);
  }

  /**
   * List comments for a post with cursor-based pagination.
   */
  async findByPost(
    postId: string,
    options: { cursor?: string; limit?: number } = {},
  ) {
    // Verify the post exists
    const post = await this.prisma.post.findUnique({
      where: { id: BigInt(postId) },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const take = Math.min(options.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

    const comments = await this.prisma.comment.findMany({
      where: { postId: BigInt(postId) },
      take: take + 1,
      ...(options.cursor && {
        cursor: { id: BigInt(options.cursor) },
        skip: 1,
      }),
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, username: true, profileImage: true } },
      },
    });

    const hasMore = comments.length > take;
    const results = hasMore ? comments.slice(0, take) : comments;

    return {
      data: results.map((c) => this.serialize(c)),
      hasMore,
      nextCursor:
        results.length > 0 ? results[results.length - 1].id.toString() : null,
    };
  }

  /**
   * Update a comment (owner only).
   */
  async update(commentId: string, userId: string, dto: UpdateCommentDto) {
    if (!dto.content?.trim()) {
      throw new BadRequestException('Comment content cannot be empty');
    }

    const comment = await this.prisma.comment.findUnique({
      where: { id: BigInt(commentId) },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId?.toString() !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    const updated = await this.prisma.comment.update({
      where: { id: BigInt(commentId) },
      data: {
        content: dto.content.trim(),
        updatedAt: new Date(),
      },
      include: {
        user: { select: { id: true, username: true, profileImage: true } },
      },
    });

    return this.serialize(updated);
  }

  /**
   * Delete a comment (owner only).
   */
  async remove(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: BigInt(commentId) },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId?.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.delete({ where: { id: BigInt(commentId) } });

    return { message: 'Comment deleted' };
  }

  /**
   * Convert BigInt fields to strings for JSON serialization.
   */
  private serialize(comment: any) {
    return {
      id: comment.id.toString(),
      postId: comment.postId?.toString() ?? null,
      userId: comment.userId?.toString() ?? null,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: comment.user
        ? {
            id: comment.user.id.toString(),
            username: comment.user.username,
            profileImage: comment.user.profileImage,
          }
        : null,
    };
  }
}
