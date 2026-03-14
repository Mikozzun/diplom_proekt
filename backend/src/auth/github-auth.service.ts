import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  email: string | null;
}

interface GitHubAuthorizationOptions {
  state?: string;
}

@Injectable()
export class GithubAuthService {
  private readonly logger = new Logger(GithubAuthService.name);

  private readonly clientId = process.env.GITHUB_CLIENT_ID ?? '';
  private readonly clientSecret = process.env.GITHUB_CLIENT_SECRET ?? '';
  private readonly callbackUrl =
    process.env.GITHUB_CALLBACK_URL ??
    'http://localhost:3000/auth/github/callback';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Build the GitHub OAuth authorization URL.
   */
  getAuthorizationUrl(options: GitHubAuthorizationOptions = {}): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.callbackUrl,
      scope: 'read:user user:email',
    });

    if (options.state) {
      params.set('state', options.state);
    }

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange the authorization code for an access token,
   * fetch GitHub user info, and upsert into our database.
   */
  async handleCallback(code: string) {
    // 1. Exchange code for access token
    const tokenRes = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
        }),
      },
    );

    const tokenData = (await tokenRes.json()) as GitHubTokenResponse & {
      error?: string;
      error_description?: string;
    };
    this.logger.debug(`GitHub token response: ${JSON.stringify(tokenData)}`);
    if (!tokenData.access_token) {
      throw new BadRequestException(
        tokenData.error_description ??
          'Failed to exchange GitHub code for token',
      );
    }

    // 2. Fetch GitHub user profile
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/json',
      },
    });

    const ghUser = (await userRes.json()) as GitHubUser;
    this.logger.debug(`GitHub user response: ${JSON.stringify(ghUser)}`);
    if (!ghUser.id) {
      throw new BadRequestException('Failed to fetch GitHub user info');
    }

    // 3. Fetch primary email if not public
    let email = ghUser.email;
    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: 'application/json',
        },
      });
      const emails = (await emailsRes.json()) as {
        email: string;
        primary: boolean;
        verified: boolean;
      }[];
      const primary = emails.find((e) => e.primary && e.verified);
      email = primary?.email ?? null;
    }

    const githubId = ghUser.id.toString();

    // 4. Upsert user
    let user = await this.prisma.user.findUnique({
      where: { githubId },
    });

    if (!user) {
      // Check if email exists on another account
      if (email) {
        const byEmail = await this.prisma.user.findUnique({
          where: { email },
        });
        if (byEmail) {
          // Link GitHub to existing email account
          user = await this.prisma.user.update({
            where: { id: byEmail.id },
            data: { githubId },
          });
        }
      }

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            githubId,
            email,
            username: ghUser.login,
            profileImage: ghUser.avatar_url,
          },
        });
      }
    }

    this.logger.log(`GitHub login: user ${user.id} (${ghUser.login})`);

    return {
      userId: user.id.toString(),
      email: user.email,
      username: user.username,
    };
  }
}
