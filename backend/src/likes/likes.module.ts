import { Module } from '@nestjs/common';
import { LikesController } from './likes.controller.js';
import { LikesService } from './likes.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Module({
  controllers: [LikesController],
  providers: [LikesService, PrismaService],
  exports: [LikesService],
})
export class LikesModule {}
