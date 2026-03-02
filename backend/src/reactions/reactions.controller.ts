import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { ReactionsService } from './reactions.service.js';
import { SessionGuard } from '../auth/guards/session.guard.js';
import { CreateReactionDto } from './dto/index.js';

@Controller('posts/:postId/reactions')
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  /**
   * POST /posts/:postId/reactions — add/toggle a reaction.
   */
  @UseGuards(SessionGuard)
  @Post()
  @HttpCode(HttpStatus.OK)
  toggle(
    @Param('postId') postId: string,
    @Req() req: Request,
    @Body() dto: CreateReactionDto,
  ) {
    return this.reactionsService.toggle(postId, req.session.userId!, dto);
  }

  /**
   * DELETE /posts/:postId/reactions?type=❤️ — remove a reaction.
   */
  @UseGuards(SessionGuard)
  @Delete()
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('postId') postId: string,
    @Req() req: Request,
    @Query('type') type: string,
  ) {
    return this.reactionsService.remove(postId, req.session.userId!, type);
  }

  /**
   * GET /posts/:postId/reactions — list reactions grouped by type.
   */
  @Get()
  findByPost(@Param('postId') postId: string) {
    return this.reactionsService.findByPost(postId);
  }
}
