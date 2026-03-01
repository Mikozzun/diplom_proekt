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
import { PostsService } from './posts.service.js';
import { SessionGuard } from '../auth/guards/session.guard.js';
import { CreatePostDto, UpdatePostDto } from './dto/index.js';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  /**
   * POST /posts — create a new post (authenticated).
   */
  @UseGuards(SessionGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req: Request, @Body() dto: CreatePostDto) {
    return this.postsService.create(req.session.userId!, dto);
  }

  /**
   * GET /posts — list posts (public, cursor-paginated).
   */
  @Get()
  findAll(@Query('cursor') cursor?: string, @Query('limit') limit?: string) {
    return this.postsService.findAll({
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /**
   * GET /posts/user/:userId — list posts by a user (public).
   */
  @Get('user/:userId')
  findByUser(
    @Param('userId') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postsService.findByUser(userId, {
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /**
   * GET /posts/:id — get a single post (public).
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  /**
   * PATCH /posts/:id — update own post (authenticated).
   */
  @UseGuards(SessionGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.update(id, req.session.userId!, dto);
  }

  /**
   * DELETE /posts/:id — delete own post (authenticated).
   */
  @UseGuards(SessionGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.postsService.remove(id, req.session.userId!);
  }
}
