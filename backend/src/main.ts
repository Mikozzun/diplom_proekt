import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import session from 'express-session';
import { PrismaClient } from '@prisma/client';
import { PrismaSessionStore } from './auth/prisma-session-store.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Prisma client for session store ──────────────────────
  const prisma = new PrismaClient();
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

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
}
void bootstrap();
