import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreatePostDto, UpdatePostDto } from './dto/index.js';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new post.
   */
  async create(userId: string, dto: CreatePostDto) {
    if (!dto.content && !dto.imageUrl && !dto.videoUrl) {
      throw new BadRequestException(
        'Post must have at least content, image, or video',
      );
    }

    const post = await this.prisma.post.create({
      data: {
        userId: BigInt(userId),
        content: dto.content,
        imageUrl: dto.imageUrl,
        videoUrl: dto.videoUrl,
      },
      include: {
        user: { select: { id: true, username: true, profileImage: true } },
        _count: { select: { comments: true, likes: true } },
      },
    });

    return this.serialize(post);
  }

  /**
   * List posts with cursor-based pagination.
   */
  async findAll(options: { cursor?: string; limit?: number } = {}) {
    const take = Math.min(options.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

    const posts = await this.prisma.post.findMany({
      take: take + 1, // fetch one extra to detect "hasMore"
      ...(options.cursor && {
        cursor: { id: BigInt(options.cursor) },
        skip: 1, // skip the cursor itself
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, profileImage: true } },
        _count: { select: { comments: true, likes: true } },
      },
    });

    const hasMore = posts.length > take;
    const results = hasMore ? posts.slice(0, take) : posts;

    return {
      data: results.map((p) => this.serialize(p)),
      hasMore,
      nextCursor:
        results.length > 0 ? results[results.length - 1].id.toString() : null,
    };
  }

  /**
   * List posts by a specific user.
   */
  async findByUser(
    targetUserId: string,
    options: { cursor?: string; limit?: number } = {},
  ) {
    const take = Math.min(options.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

    const posts = await this.prisma.post.findMany({
      where: { userId: BigInt(targetUserId) },
      take: take + 1,
      ...(options.cursor && {
        cursor: { id: BigInt(options.cursor) },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, profileImage: true } },
        _count: { select: { comments: true, likes: true } },
      },
    });

    const hasMore = posts.length > take;
    const results = hasMore ? posts.slice(0, take) : posts;

    return {
      data: results.map((p) => this.serialize(p)),
      hasMore,
      nextCursor:
        results.length > 0 ? results[results.length - 1].id.toString() : null,
    };
  }

  /**
   * Get a single post by ID.
   */
  async findOne(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: BigInt(postId) },
      include: {
        user: { select: { id: true, username: true, profileImage: true } },
        _count: { select: { comments: true, likes: true } },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.serialize(post);
  }

  /**
   * Update a post (owner only).
   */
  async update(postId: string, userId: string, dto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({
      where: { id: BigInt(postId) },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId?.toString() !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    const updated = await this.prisma.post.update({
      where: { id: BigInt(postId) },
      data: {
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.videoUrl !== undefined && { videoUrl: dto.videoUrl }),
        updatedAt: new Date(),
      },
      include: {
        user: { select: { id: true, username: true, profileImage: true } },
        _count: { select: { comments: true, likes: true } },
      },
    });

    return this.serialize(updated);
  }

  /**
   * Delete a post (owner only).
   */
  async remove(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: BigInt(postId) },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId?.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.post.delete({ where: { id: BigInt(postId) } });

    return { message: 'Post deleted' };
  }

  /**
   * Convert BigInt fields to strings for JSON serialization.
   */
  private serialize(post: any) {
    return {
      id: post.id.toString(),
      userId: post.userId?.toString() ?? null,
      content: post.content,
      imageUrl: post.imageUrl,
      videoUrl: post.videoUrl,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: post.user
        ? {
            id: post.user.id.toString(),
            username: post.user.username,
            profileImage: post.user.profileImage,
          }
        : null,
      commentCount: post._count?.comments ?? 0,
      likeCount: post._count?.likes ?? 0,
    };
  }
}
