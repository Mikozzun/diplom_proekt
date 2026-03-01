# Project Overview

## What Is This Project?

**Frogger Backend** is a social-platform API built with [NestJS](https://nestjs.com/) (v11) and [TypeScript](https://www.typescriptlang.org/) (v5.7). It provides a passwordless authentication system (OTP + WebAuthn passkeys), session management backed by PostgreSQL, and a data model for posts, comments, polls, notifications, and more.

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Runtime** | Node.js | ≥ 18 | JavaScript runtime |
| **Framework** | NestJS | 11.0.1 | Modular, decorator-driven HTTP framework |
| **Language** | TypeScript | 5.7.3 | Static typing, ESM-style module resolution |
| **ORM** | Prisma | 7.4.1 | PostgreSQL client with type-safe queries |
| **Database** | PostgreSQL | — | Primary data store (via Prisma Accelerate) |
| **Auth** | @simplewebauthn/server | 13.2.3 | WebAuthn / passkey registration & login |
| **Sessions** | express-session | 1.19.0 | Cookie-based sessions, custom Prisma store |
| **Testing** | Jest + ts-jest | 30 / 29 | Unit & E2E testing |
| **Linting** | ESLint + Prettier | 9 / 3 | Code quality & formatting |
| **Realtime** | Socket.IO / @nestjs/websockets | 4.8 / 11.1 | WebSocket support (scaffolded) |

---

## Folder Structure

```
backend/
├── docs/                          # ← You are here
├── prisma/
│   ├── schema.prisma              # Database models (22 tables)
│   └── prisma.service.ts          # NestJS-injectable PrismaClient
├── src/
│   ├── main.ts                    # Application bootstrap & middleware
│   ├── app.module.ts              # Root module
│   ├── app.controller.ts          # Root GET / endpoint
│   ├── app.service.ts             # Root service
│   ├── auth/
│   │   ├── auth.module.ts         # Auth feature module
│   │   ├── auth.controller.ts     # 9 REST endpoints
│   │   ├── otp.service.ts         # OTP generation & verification
│   │   ├── webauthn.service.ts    # Passkey registration & authentication
│   │   ├── session.service.ts     # Session CRUD helpers
│   │   ├── prisma-session-store.ts# express-session Store via Prisma
│   │   ├── guards/
│   │   │   ├── session.guard.ts   # Reusable auth guard
│   │   │   └── index.ts           # Barrel re-export
│   │   ├── dto/
│   │   │   ├── send-otp.dto.ts
│   │   │   ├── verify-otp.dto.ts
│   │   │   ├── verify-registration.dto.ts
│   │   │   ├── verify-authentication.dto.ts
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
│   └── comments/
│       ├── comments.module.ts     # Comments feature module
│       ├── comments.controller.ts # 4 REST endpoints
│       ├── comments.service.ts    # Comment CRUD with pagination & ownership
│       └── dto/
│           ├── create-comment.dto.ts
│           ├── update-comment.dto.ts
│           └── index.ts           # Barrel re-export
├── test/
│   ├── unit/                      # 130 unit tests
│   │   ├── app.controller.spec.ts
│   │   ├── auth/
│   │   │   ├── otp.service.spec.ts
│   │   │   ├── webauthn.service.spec.ts
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
│   │   └── comments/
│   │       ├── comments.service.spec.ts
│   │       └── comments.controller.spec.ts
│   ├── e2e/                       # 11 E2E tests
│   │   ├── app.e2e-spec.ts
│   │   └── auth.e2e-spec.ts
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
| `npm run start:prod` | `node dist/main` | Run compiled output |
| `npm test` | `jest` | Run unit tests (130 specs) |
| `npm run test:e2e` | `jest --config ./test/jest-e2e.json` | Run E2E tests (11 specs) |
| `npm run test:cov` | `jest --coverage` | Unit tests with coverage report |
| `npm run lint` | `eslint ... --fix` | Lint & auto-fix all source |
| `npm run format` | `prettier --write ...` | Format source with Prettier |

---

## Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string (Prisma) |
| `SESSION_SECRET` | **Yes** (in prod) | `change-me-in-production` | Secret for signing session cookies |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed CORS origin (frontend URL) |
| `PORT` | No | `3000` | HTTP listen port |
| `NODE_ENV` | No | — | `production` enables secure cookies |
| `RP_NAME` | No | `Frogger` | WebAuthn Relying Party name |
| `RP_ID` | No | `localhost` | WebAuthn Relying Party ID (domain) |
| `ORIGIN` | No | `http://localhost:3000` | WebAuthn expected origin |

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
