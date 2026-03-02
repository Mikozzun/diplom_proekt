import { Module } from '@nestjs/common';
import { BookmarksController } from './bookmarks.controller.js';
import { BookmarksService } from './bookmarks.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Module({
  controllers: [BookmarksController],
  providers: [BookmarksService, PrismaService],
  exports: [BookmarksService],
})
export class BookmarksModule {}
