import { Module } from '@nestjs/common';
import { ReactionsController } from './reactions.controller.js';
import { ReactionsService } from './reactions.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Module({
  controllers: [ReactionsController],
  providers: [ReactionsService, PrismaService],
  exports: [ReactionsService],
})
export class ReactionsModule {}
