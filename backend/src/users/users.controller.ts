import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service.js';
import { SessionGuard } from '../auth/guards/session.guard.js';
import { UpdateProfileDto, UpdateSettingsDto } from './dto/index.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /users/profile — get own profile (authenticated).
   */
  @UseGuards(SessionGuard)
  @Get('profile')
  getProfile(@Req() req: Request) {
    return this.usersService.getProfile(req.session.userId!);
  }

  /**
   * PATCH /users/profile — update own profile (authenticated).
   */
  @UseGuards(SessionGuard)
  @Patch('profile')
  updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.session.userId!, dto);
  }

  /**
   * GET /users/settings — get own settings (authenticated).
   */
  @UseGuards(SessionGuard)
  @Get('settings')
  getSettings(@Req() req: Request) {
    return this.usersService.getSettings(req.session.userId!);
  }

  /**
   * PATCH /users/settings — update own settings (authenticated).
   */
  @UseGuards(SessionGuard)
  @Patch('settings')
  updateSettings(@Req() req: Request, @Body() dto: UpdateSettingsDto) {
    return this.usersService.updateSettings(req.session.userId!, dto);
  }

  /**
   * GET /users/:id — get public profile (no auth required).
   */
  @Get(':id')
  getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }
}
