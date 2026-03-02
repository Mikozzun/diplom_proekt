import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { GithubAuthService } from '../../../src/auth/github-auth.service';
import { PrismaService } from '../../../prisma/prisma.service';

// Mock global fetch
const mockFetch = jest.fn() as jest.Mock;
global.fetch = mockFetch;

describe('GithubAuthService', () => {
  let service: GithubAuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    process.env.GITHUB_CLIENT_ID = 'test-client-id';
    process.env.GITHUB_CLIENT_SECRET = 'test-client-secret';
    process.env.GITHUB_CALLBACK_URL =
      'http://localhost:3000/auth/github/callback';

    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GithubAuthService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<GithubAuthService>(GithubAuthService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getAuthorizationUrl', () => {
    it('should return a GitHub authorization URL with correct params', () => {
      const url = service.getAuthorizationUrl();

      expect(url).toContain('https://github.com/login/oauth/authorize');
      expect(url).toContain('client_id=');
      expect(url).toContain('scope=read%3Auser+user%3Aemail');
    });
  });

  describe('handleCallback', () => {
    it('should exchange code, fetch user, and create new user', async () => {
      // Mock token exchange
      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'gho_test_token',
            token_type: 'bearer',
            scope: 'read:user,user:email',
          }),
      });

      // Mock user profile fetch
      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            id: 12345,
            login: 'octocat',
            avatar_url: 'https://avatars.githubusercontent.com/u/12345',
            email: 'octocat@github.com',
          }),
      });

      // No existing user by githubId
      prisma.user.findUnique.mockResolvedValue(null);

      // Create new user
      prisma.user.create.mockResolvedValue({
        id: 1n,
        email: 'octocat@github.com',
        username: 'octocat',
        githubId: '12345',
      });

      const result = await service.handleCallback('auth-code-123');

      expect(result).toEqual({
        userId: '1',
        email: 'octocat@github.com',
        username: 'octocat',
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should return existing user if githubId already linked', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'gho_token',
            token_type: 'bearer',
            scope: '',
          }),
      });
      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            id: 12345,
            login: 'octocat',
            avatar_url: 'https://example.com/avatar.png',
            email: 'test@example.com',
          }),
      });

      prisma.user.findUnique.mockResolvedValue({
        id: 99n,
        email: 'test@example.com',
        username: 'existinguser',
        githubId: '12345',
      });

      const result = await service.handleCallback('code');

      expect(result).toEqual({
        userId: '99',
        email: 'test@example.com',
        username: 'existinguser',
      });
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when token exchange fails', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ error: 'bad_verification_code' }),
      });

      await expect(service.handleCallback('bad-code')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when user fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'gho_token',
            token_type: 'bearer',
            scope: '',
          }),
      });
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({}),
      });

      await expect(service.handleCallback('code')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should fetch emails when profile email is null', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'gho_token',
            token_type: 'bearer',
            scope: '',
          }),
      });
      // User profile with no email
      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            id: 11111,
            login: 'privateemail',
            avatar_url: 'https://example.com/avatar.png',
            email: null,
          }),
      });
      // Emails endpoint
      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve([
            { email: 'private@example.com', primary: true, verified: true },
            { email: 'other@example.com', primary: false, verified: true },
          ]),
      });

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 5n,
        email: 'private@example.com',
        username: 'privateemail',
        githubId: '11111',
      });

      const result = await service.handleCallback('code');

      expect(result.email).toBe('private@example.com');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });
});
