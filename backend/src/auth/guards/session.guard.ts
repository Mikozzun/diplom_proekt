import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

/**
 * Guard that checks for a valid express-session.
 * Attach to any controller / route that requires authentication.
 *
 * Usage:
 *   @UseGuards(SessionGuard)
 *   @Get('profile')
 *   getProfile(@Req() req) { ... }
 */
@Injectable()
export class SessionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (!request.session.userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    return true;
  }
}
