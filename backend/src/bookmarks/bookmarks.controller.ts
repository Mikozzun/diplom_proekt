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
import { BookmarksService } from './bookmarks.service.js';
import { SessionGuard } from '../auth/guards/session.guard.js';

@Controller()
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  /**
   * POST /posts/:postId/bookmark — toggle bookmark.
   */
  @UseGuards(SessionGuard)
  @Post('posts/:postId/bookmark')
  @HttpCode(HttpStatus.OK)
  toggle(@Param('postId') postId: string, @Req() req: Request) {
    return this.bookmarksService.toggle(postId, req.session.userId!);
  }

  /**
   * DELETE /posts/:postId/bookmark — explicit remove.
   */
  @UseGuards(SessionGuard)
  @Delete('posts/:postId/bookmark')
  @HttpCode(HttpStatus.OK)
  remove(@Param('postId') postId: string, @Req() req: Request) {
    return this.bookmarksService.remove(postId, req.session.userId!);
  }

  /**
   * GET /bookmarks — list user's bookmarks with pagination.
   */
  @UseGuards(SessionGuard)
  @Get('bookmarks')
  findMyBookmarks(
    @Req() req: Request,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bookmarksService.findByUser(req.session.userId!, {
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
