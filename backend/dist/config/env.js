"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenvx_1 = require("@dotenvx/dotenvx");
(0, dotenvx_1.config)();
exports.env = {
    databaseUrl: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
    sessionSecret: process.env.SESSION_SECRET,
    jwtSecret: process.env.JWT_SECRET || process.env.SESSION_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.SESSION_SECRET + '_refresh',
    clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || '',
    clerkSecretKey: process.env.CLERK_SECRET_KEY || '',
    clerkJwksUrl: process.env.CLERK_JWKS_URL || '',
    clerkFrontendApi: process.env.CLERK_FRONTEND_API || '',
    frontendUrl: process.env.FRONTEND_URL,
    corsOrigin: process.env.CORS_ORIGIN,
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    rpId: process.env.RP_ID || 'localhost',
    rpName: process.env.RP_NAME || 'Frogger',
    rpOrigin: process.env.RP_ORIGIN || 'http://localhost:3000',
};
//# sourceMappingURL=env.js.map