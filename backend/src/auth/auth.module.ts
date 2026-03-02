import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { EmailAuthService } from './email-auth.service.js';
import { GithubAuthService } from './github-auth.service.js';
import { TelegramAuthService } from './telegram-auth.service.js';
import { SessionService } from './session.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Module({
  controllers: [AuthController],
  providers: [
    EmailAuthService,
    GithubAuthService,
    TelegramAuthService,
    SessionService,
    PrismaService,
  ],
  exports: [
    EmailAuthService,
    GithubAuthService,
    TelegramAuthService,
    SessionService,
  ],
})
export class AuthModule {}
