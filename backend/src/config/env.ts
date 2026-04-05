import { config } from '@dotenvx/dotenvx';

config();

export const env = {
  databaseUrl: process.env.DATABASE_URL!,
  directUrl: process.env.DIRECT_URL!,
  sessionSecret: process.env.SESSION_SECRET!,
  jwtSecret: process.env.JWT_SECRET || process.env.SESSION_SECRET!,
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET || process.env.SESSION_SECRET! + '_refresh',
  betterAuthSecret:
    process.env.BETTER_AUTH_SECRET || process.env.SESSION_SECRET!,
  betterAuthUrl: process.env.BETTER_AUTH_URL || 'http://localhost:5000',
  frontendUrl: process.env.FRONTEND_URL!,
  corsOrigin: process.env.CORS_ORIGIN!,
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  rpId: process.env.RP_ID || 'localhost',
  rpName: process.env.RP_NAME || 'Frogger',
  rpOrigin: process.env.RP_ORIGIN || 'http://localhost:5000',
};
