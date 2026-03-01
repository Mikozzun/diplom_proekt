import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../../../src/users/users.controller';
import { UsersService } from '../../../src/users/users.service';
import type { Request } from 'express';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    getProfile: jest.Mock;
    getPublicProfile: jest.Mock;
    updateProfile: jest.Mock;
    getSettings: jest.Mock;
    updateSettings: jest.Mock;
  };

  const mockRequest = (userId?: string): Request => {
    return {
      session: { userId },
      sessionID: 'test-session-id',
      headers: { 'user-agent': 'TestAgent' },
      ip: '127.0.0.1',
    } as unknown as Request;
  };

  beforeEach(async () => {
    usersService = {
      getProfile: jest.fn(),
      getPublicProfile: jest.fn(),
      updateProfile: jest.fn(),
      getSettings: jest.fn(),
      updateSettings: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  describe('GET /users/profile', () => {
    it('should return own profile', async () => {
      const profile = {
        id: '1',
        username: 'alice',
        phoneNumber: '+1234567890',
        profileImage: null,
      };
      usersService.getProfile.mockResolvedValue(profile);
      const req = mockRequest('1');

      const result = await controller.getProfile(req);

      expect(result).toEqual(profile);
      expect(usersService.getProfile).toHaveBeenCalledWith('1');
    });
  });

  describe('PATCH /users/profile', () => {
    it('should update own profile', async () => {
      const updated = { id: '1', username: 'new-name' };
      usersService.updateProfile.mockResolvedValue(updated);
      const req = mockRequest('1');

      const result = await controller.updateProfile(req, {
        username: 'new-name',
      });

      expect(result).toEqual(updated);
      expect(usersService.updateProfile).toHaveBeenCalledWith('1', {
        username: 'new-name',
      });
    });
  });

  describe('GET /users/settings', () => {
    it('should return own settings', async () => {
      const settings = { id: '10', theme: 'dark', notificationsEnabled: true };
      usersService.getSettings.mockResolvedValue(settings);
      const req = mockRequest('1');

      const result = await controller.getSettings(req);

      expect(result).toEqual(settings);
    });
  });

  describe('PATCH /users/settings', () => {
    it('should update own settings', async () => {
      const settings = { id: '10', theme: 'dark', notificationsEnabled: false };
      usersService.updateSettings.mockResolvedValue(settings);
      const req = mockRequest('1');

      const result = await controller.updateSettings(req, { theme: 'dark' });

      expect(result).toEqual(settings);
      expect(usersService.updateSettings).toHaveBeenCalledWith('1', {
        theme: 'dark',
      });
    });
  });

  describe('GET /users/:id', () => {
    it('should return public profile', async () => {
      const profile = { id: '2', username: 'bob', postCount: 3 };
      usersService.getPublicProfile.mockResolvedValue(profile);

      const result = await controller.getPublicProfile('2');

      expect(result).toEqual(profile);
      expect(usersService.getPublicProfile).toHaveBeenCalledWith('2');
    });
  });
});
