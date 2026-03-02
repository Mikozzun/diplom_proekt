import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { LikesService } from './likes.service.js';
import { SessionGuard } from '../auth/guards/session.guard.js';

@Controller('posts/:postId/likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  /**
   * POST /posts/:postId/likes — toggle like (like if not liked, unlike if already liked).
   */
  @UseGuards(SessionGuard)
  @Post()
  @HttpCode(HttpStatus.OK)
  toggle(@Param('postId') postId: string, @Req() req: Request) {
    return this.likesService.toggle(postId, req.session.userId!);
  }

  /**
   * DELETE /posts/:postId/likes — explicit unlike.
   */
  @UseGuards(SessionGuard)
  @Delete()
  @HttpCode(HttpStatus.OK)
  unlike(@Param('postId') postId: string, @Req() req: Request) {
    return this.likesService.unlike(postId, req.session.userId!);
  }

  /**
   * GET /posts/:postId/likes — list users who liked the post.
   */
  @Get()
  findByPost(
    @Param('postId') postId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.likesService.findByPost(postId, {
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
