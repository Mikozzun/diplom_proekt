import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { username, phoneNumber } from 'better-auth/plugins';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { initFeedForUser } from '../scripts/randomize-feed';

export const auth = betterAuth({
  basePath: '/api/auth',
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:5000',
  rateLimit: {
    // Keep protection enabled, but avoid false 429s during OAuth redirects.
    enabled: true,
    window: 60,
    max: 300,
    customRules: {
      '/sign-in/social': { window: 60, max: 600 },
      '/callback/*': { window: 60, max: 600 },
    },
  },
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Init randomized feed for newly registered user
          try {
            await initFeedForUser(BigInt(user.id));
          } catch (err) {
            console.error(`Failed to init feed for user ${user.id}:`, err);
          }
        },
      },
    },
  },
  user: {
    modelName: 'User',
    additionalFields: {
      passkey: {
        type: 'string',
        required: false,
        input: false,
      },
      profileImage: {
        type: 'string',
        required: false,
      },
    },
  },
  session: {
    modelName: 'BaSession',
  },
  account: {
    modelName: 'Account',
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  advanced: {
    database: {
      generateId: (options) => {
        if (options.model === 'user') {
          return false;
        }
        return crypto.randomUUID();
      },
    },
  },
  plugins: [
    username(),
    phoneNumber({
      sendOTP: ({ phoneNumber, code }, ctx) => {
        // TODO: integrate SMS provider (Twilio, etc.)
        console.log(`[DEV] OTP for ${phoneNumber}: ${code}`);
      },
      signUpOnVerification: {
        getTempEmail: (phone) =>
          `${phone.replace(/\+/g, '')}@phone.frogger.local`,
      },
    }),
  ],
  trustedOrigins: Array.from(
    new Set([
      env.betterAuthUrl,
      env.frontendUrl,
      'http://localhost:4000',
      ...env.corsOrigin
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
    ]),
  ),
});
