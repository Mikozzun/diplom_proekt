import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { OtpService } from './otp.service.js';
import { WebAuthnService } from './webauthn.service.js';
import { SessionService } from './session.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Module({
  controllers: [AuthController],
  providers: [OtpService, WebAuthnService, SessionService, PrismaService],
  exports: [OtpService, WebAuthnService, SessionService],
})
export class AuthModule {}
