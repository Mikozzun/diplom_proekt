import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import session from 'express-session';
import { PrismaClient } from '@prisma/client';
import { PrismaSessionStore } from './auth/prisma-session-store.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Prisma client for session store ──────────────────────
  const prisma = new PrismaClient({
    accelerateUrl: process.env.DATABASE_URL,
  });
  await prisma.$connect();

  // ── Express-session with PostgreSQL store ────────────────
  app.use(
    session({
      store: new PrismaSessionStore(prisma),
      secret: process.env.SESSION_SECRET || 'change-me-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true, // Prevents XSS: JS cannot read cookie
        secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
        sameSite: 'lax', // CSRF protection
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    }),
  );

  // ── CORS (adjust origin for your frontend) ──────────────
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true, // Required for cookies
  });

  // ── Real-time log broadcasting ──────────────────────────
  const { LogsGateway } = await import('./logs/logs.gateway.js');
  const { WebSocketLogger } = await import('./logs/websocket-logger.js');
  const logsGateway = app.get(LogsGateway);
  app.useLogger(new WebSocketLogger(logsGateway));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Live logs dashboard: http://localhost:${port}/logs`);
}
void bootstrap();
