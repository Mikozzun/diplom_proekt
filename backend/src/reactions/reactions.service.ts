import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateReactionDto } from './dto/index.js';

/** Allowed reaction emoji types. */
const ALLOWED_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

@Injectable()
export class ReactionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Add a reaction to a post. If the same reaction type already exists
   * from this user, it is removed (toggle behaviour).
   */
  async toggle(postId: string, userId: string, dto: CreateReactionDto) {
    const type = dto.reactionType?.trim();

    if (!type) {
      throw new BadRequestException('Reaction type is required');
    }

    if (!ALLOWED_REACTIONS.includes(type)) {
      throw new BadRequestException(
        `Invalid reaction type. Allowed: ${ALLOWED_REACTIONS.join(', ')}`,
      );
    }

    const postBigInt = BigInt(postId);
    const userBigInt = BigInt(userId);

    // Verify the post exists
    const post = await this.prisma.post.findUnique({
      where: { id: postBigInt },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check for existing same-type reaction
    const existing = await this.prisma.reaction.findFirst({
      where: {
        userId: userBigInt,
        postId: postBigInt,
        reactionType: type,
      },
    });

    if (existing) {
      await this.prisma.reaction.delete({ where: { id: existing.id } });
      return { reacted: false, reactionType: type };
    }

    await this.prisma.reaction.create({
      data: {
        userId: userBigInt,
        postId: postBigInt,
        reactionType: type,
      },
    });

    return { reacted: true, reactionType: type };
  }

  /**
   * Remove a specific reaction.
   */
  async remove(postId: string, userId: string, reactionType: string) {
    const existing = await this.prisma.reaction.findFirst({
      where: {
        userId: BigInt(userId),
        postId: BigInt(postId),
        reactionType,
      },
    });

    if (!existing) {
      throw new NotFoundException('Reaction not found');
    }

    await this.prisma.reaction.delete({ where: { id: existing.id } });

    return { message: 'Reaction removed' };
  }

  /**
   * Get reactions for a post grouped by type with counts.
   */
  async findByPost(postId: string) {
    const postBigInt = BigInt(postId);

    // Verify the post exists
    const post = await this.prisma.post.findUnique({
      where: { id: postBigInt },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const reactions = await this.prisma.reaction.groupBy({
      by: ['reactionType'],
      where: { postId: postBigInt },
      _count: { id: true },
    });

    const grouped = reactions.map((r) => ({
      reactionType: r.reactionType,
      count: r._count.id,
    }));

    return { postId, reactions: grouped };
  }
}
