# Project Overview

## What Is This Project?

**Frogger Backend** is a social-platform API built with [NestJS](https://nestjs.com/) (v11) and [TypeScript](https://www.typescriptlang.org/) (v5.7). It provides a multi-method authentication system (Email+Password, GitHub OAuth, Telegram Login Widget), session management backed by PostgreSQL, and a data model for posts, comments, likes, bookmarks, reactions, polls, notifications, and more.

The backend is deployed to **Fly.io** at `https://frogger-backend.fly.dev`.

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Runtime** | Node.js | 20(LTS) | JavaScript runtime |
| **Framework** | NestJS | 11.0.1 | Modular, decorator-driven HTTP framework |
| **Language** | TypeScript | 5.7.3 | Static typing, ESM-style module resolution |
| **ORM** | Prisma | 7.4.1 | PostgreSQL client with type-safe queries |
| **Database** | PostgreSQL | — | Primary data store (Supabase, `@prisma/adapter-pg`) |
| **Auth** | bcrypt | 6.0.0 | Password hashing for email+password auth |
| **Sessions** | express-session | 1.19.0 | Cookie-based sessions, custom Prisma store |
| **Testing** | Jest + ts-jest | 30 / 29 | Unit & E2E testing |
| **Linting** | ESLint + Prettier | 9 / 3 | Code quality & formatting |
| **Realtime** | Socket.IO / @nestjs/websockets | 4.8 / 11.1 | WebSocket log broadcasting |
| **Static Files** | @nestjs/serve-static | — | Serves test frontend at `/test/` |
| **Deployment** | Fly.io + Docker | — | Production hosting |

---

## Folder Structure

```
backend/
├── docs/                          # ← You are here
├── public/
│   └── test/
│       ├── index.html             # Auth test frontend (served at /test/)
│       └── auth/success/
│           └── index.html         # GitHub OAuth redirect landing
├── prisma/
│   ├── schema.prisma              # Database models (22 tables)
│   └── prisma.service.ts          # NestJS-injectable PrismaClient
├── src/
│   ├── main.ts                    # Application bootstrap & middleware
│   ├── app.module.ts              # Root module (+ ServeStaticModule)
│   ├── app.controller.ts          # Root GET / endpoint
│   ├── app.service.ts             # Root service
│   ├── auth/
│   │   ├── auth.module.ts         # Auth feature module
│   │   ├── auth.controller.ts     # 10 REST endpoints
│   │   ├── email-auth.service.ts  # Email+Password registration & login (bcrypt)
│   │   ├── github-auth.service.ts # GitHub OAuth authorization code flow
│   │   ├── telegram-auth.service.ts # Telegram Login Widget HMAC verification
│   │   ├── session.service.ts     # Session CRUD helpers
│   │   ├── prisma-session-store.ts# express-session Store via Prisma
│   │   ├── guards/
│   │   │   ├── session.guard.ts   # Reusable auth guard
│   │   │   └── index.ts           # Barrel re-export
│   │   ├── dto/
│   │   │   ├── register.dto.ts
│   │   │   ├── login.dto.ts
│   │   │   ├── telegram-auth.dto.ts
│   │   │   └── index.ts           # Barrel re-export
│   │   └── types/
│   │       └── session.d.ts       # SessionData augmentation
│   ├── users/
│   │   ├── users.module.ts        # Users feature module
│   │   ├── users.controller.ts    # 5 REST endpoints
│   │   ├── users.service.ts       # Profile & settings business logic
│   │   └── dto/
│   │       ├── update-profile.dto.ts
│   │       ├── update-settings.dto.ts
│   │       └── index.ts           # Barrel re-export
│   ├── posts/
│   │   ├── posts.module.ts        # Posts feature module
│   │   ├── posts.controller.ts    # 6 REST endpoints
│   │   ├── posts.service.ts       # Post CRUD with pagination & ownership
│   │   └── dto/
│   │       ├── create-post.dto.ts
│   │       ├── update-post.dto.ts
│   │       └── index.ts           # Barrel re-export
│   ├── comments/
│   │   ├── comments.module.ts     # Comments feature module
│   │   ├── comments.controller.ts # 4 REST endpoints
│   │   ├── comments.service.ts    # Comment CRUD with pagination & ownership
│   │   └── dto/
│   │       ├── create-comment.dto.ts
│   │       ├── update-comment.dto.ts
│   │       └── index.ts           # Barrel re-export
│   ├── likes/
│   │   ├── likes.module.ts        # Likes feature module
│   │   ├── likes.controller.ts    # 3 REST endpoints
│   │   └── likes.service.ts       # Like/unlike logic
│   ├── bookmarks/
│   │   ├── bookmarks.module.ts    # Bookmarks feature module
│   │   ├── bookmarks.controller.ts # 3 REST endpoints
│   │   └── bookmarks.service.ts   # Bookmark logic
│   ├── reactions/
│   │   ├── reactions.module.ts    # Reactions feature module
│   │   ├── reactions.controller.ts # 3 REST endpoints
│   │   ├── reactions.service.ts   # Reaction logic
│   │   └── dto/
│   │       ├── create-reaction.dto.ts
│   │       └── index.ts           # Barrel re-export
│   └── logs/
│       ├── logs.module.ts         # Logs feature module
│       ├── logs.controller.ts     # GET /logs dashboard
│       ├── logs.gateway.ts        # WebSocket gateway for log streaming
│       └── websocket-logger.ts    # Custom NestJS logger → WebSocket
├── test/
│   ├── unit/                      # 165 unit tests (20 suites)
│   │   ├── app.controller.spec.ts
│   │   ├── auth/
│   │   │   ├── email-auth.service.spec.ts
│   │   │   ├── github-auth.service.spec.ts
│   │   │   ├── telegram-auth.service.spec.ts
│   │   │   ├── session.service.spec.ts
│   │   │   ├── auth.controller.spec.ts
│   │   │   ├── prisma-session-store.spec.ts
│   │   │   └── guards/
│   │   │       └── session.guard.spec.ts
│   │   ├── users/
│   │   │   ├── users.service.spec.ts
│   │   │   └── users.controller.spec.ts
│   │   ├── posts/
│   │   │   ├── posts.service.spec.ts
│   │   │   └── posts.controller.spec.ts
│   │   ├── comments/
│   │   │   ├── comments.service.spec.ts
│   │   │   └── comments.controller.spec.ts
│   │   ├── likes/
│   │   │   ├── likes.service.spec.ts
│   │   │   └── likes.controller.spec.ts
│   │   ├── bookmarks/
│   │   │   ├── bookmarks.service.spec.ts
│   │   │   └── bookmarks.controller.spec.ts
│   │   └── reactions/
│   │       ├── reactions.service.spec.ts
│   │       └── reactions.controller.spec.ts
│   ├── e2e/                       # 63 E2E tests (3 suites)
│   │   ├── app.e2e-spec.ts
│   │   ├── auth.e2e-spec.ts
│   │   └── integration.e2e-spec.ts
│   └── jest-e2e.json              # E2E Jest config
├── db_scheme/
│   └── db_schema.csv              # Original CSV schema reference
├── package.json                   # Dependencies, scripts & Jest config
├── tsconfig.json                  # TypeScript compiler settings
├── tsconfig.build.json            # Build-specific TS config
├── nest-cli.json                  # Nest CLI settings
├── prisma.config.ts               # Prisma 7 config (datasource URL)
└── eslint.config.mjs              # ESLint flat config
```

---

## Key npm Scripts

| Script | Command | Description |
|---|---|---|
| `npm run start:dev` | `nest start --watch` | Start with hot-reload |
| `npm run build` | `nest build` | Compile TypeScript to `dist/` |
| `npm run start:prod` | `node dist/src/main.js` | Run compiled output |
| `npm test` | `jest` | Run unit tests (165 specs) |
| `npm run test:e2e` | `jest --config ./test/jest-e2e.json` | Run E2E tests (63 specs) |
| `npm run test:cov` | `jest --coverage` | Unit tests with coverage report |
| `npm run lint` | `eslint ... --fix` | Lint & auto-fix all source |
| `npm run format` | `prettier --write ...` | Format source with Prettier |

---

## Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | — | PostgreSQL pooled connection string (port 6543) |
| `DIRECT_URL` | **Yes** | — | PostgreSQL direct connection (port 5432, for Prisma CLI) |
| `SESSION_SECRET` | **Yes** (in prod) | `change-me-in-production` | Secret for signing session cookies |
| `GITHUB_CLIENT_ID` | **Yes** | — | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | **Yes** | — | GitHub OAuth App client secret |
| `GITHUB_CALLBACK_URL` | **Yes** | — | GitHub OAuth redirect URI (e.g. `http://localhost:3000/auth/github/callback`) |
| `TELEGRAM_BOT_TOKEN` | **Yes** | — | Telegram bot token for Login Widget HMAC verification |
| `FRONTEND_URL` | No | `http://localhost:5173` | Frontend URL (used for GitHub OAuth redirect after login) |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed CORS origin |
| `PORT` | No | `3000` | HTTP listen port |
| `NODE_ENV` | No | — | `production` enables secure cookies |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env   # then fill in DATABASE_URL

# 3. Generate Prisma client & run migrations
npx prisma generate
npx prisma migrate dev

# 4. Start development server
npm run start:dev

# 5. Run tests
npm test               # unit
npm run test:e2e       # end-to-end
```
