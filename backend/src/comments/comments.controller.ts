import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { CommentsService } from './comments.service.js';
import { SessionGuard } from '../auth/guards/session.guard.js';
import { CreateCommentDto, UpdateCommentDto } from './dto/index.js';

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * POST /posts/:postId/comments — add a comment (authenticated).
   */
  @UseGuards(SessionGuard)
  @Post('posts/:postId/comments')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('postId') postId: string,
    @Req() req: Request,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(postId, req.session.userId!, dto);
  }

  /**
   * GET /posts/:postId/comments — list comments for a post (public, cursor-paginated).
   */
  @Get('posts/:postId/comments')
  findByPost(
    @Param('postId') postId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.commentsService.findByPost(postId, {
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /**
   * PATCH /comments/:id — edit own comment (authenticated).
   */
  @UseGuards(SessionGuard)
  @Patch('comments/:id')
  update(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.update(id, req.session.userId!, dto);
  }

  /**
   * DELETE /comments/:id — delete own comment (authenticated).
   */
  @UseGuards(SessionGuard)
  @Delete('comments/:id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.commentsService.remove(id, req.session.userId!);
  }
}
