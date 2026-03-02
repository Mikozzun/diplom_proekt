# Authentication System

## Architecture Overview

The authentication system supports **three independent methods**:

1. **Email + Password** — Traditional registration and login with bcrypt-hashed passwords
2. **GitHub OAuth** — Authorization code flow; redirects to GitHub, exchanges code for token
3. **Telegram Login Widget** — HMAC-SHA-256 verification of Telegram-provided auth data

Sessions are managed with **express-session** backed by a **custom PostgreSQL store** (no Redis dependency).

```
┌──────────────────────────────────────────────────────────────────────┐
│                 EMAIL + PASSWORD REGISTRATION                        │
│                                                                      │
│  Client                         Server                               │
│  ──────                         ──────                               │
│  1. Enter email, password, ───▶ POST /auth/register                  │
│     username                     └─▶ Check email uniqueness          │
│                                  └─▶ Hash password (bcrypt, 10 rds)  │
│                                  └─▶ Create User record              │
│                                  └─▶ Auto-login (create session)     │
│                                  ◀── { userId, email, username }     │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                 EMAIL + PASSWORD LOGIN                                │
│                                                                      │
│  Client                         Server                               │
│  ──────                         ──────                               │
│  1. Enter email, password ────▶ POST /auth/login                     │
│                                  └─▶ Find user by email              │
│                                  └─▶ Verify password (bcrypt.compare)│
│                                  └─▶ Create session                  │
│                                  ◀── { userId, email, username }     │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                 GITHUB OAUTH FLOW                                    │
│                                                                      │
│  Client                         Server                               │
│  ──────                         ──────                               │
│  1. Click "Login with GitHub" ▶ GET /auth/github                     │
│                                  └─▶ Redirect to GitHub authorize URL│
│                                                                      │
│  2. User authorizes on GitHub                                        │
│     GitHub redirects to ────────▶ GET /auth/github/callback?code=X   │
│                                  └─▶ Exchange code for access_token  │
│                                  └─▶ Fetch GitHub user + email       │
│                                  └─▶ Upsert user (by githubId)      │
│                                  └─▶ Create session                  │
│                                  └─▶ Redirect to FRONTEND_URL/auth/success │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                 TELEGRAM LOGIN                                       │
│                                                                      │
│  Client                         Server                               │
│  ──────                         ──────                               │
│  1. Telegram Login Widget ────▶ POST /auth/telegram                  │
│     sends signed data            └─▶ Verify HMAC-SHA-256 hash       │
│                                  └─▶ Check auth_date ≤ 5 min ago    │
│                                  └─▶ Upsert user (by telegramId)    │
│                                  └─▶ Create session                  │
│                                  ◀── { userId, email, username }     │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Component Map

| File                          | Type              | Responsibility                                    |
| ----------------------------- | ----------------- | ------------------------------------------------- |
| `auth.module.ts`            | Module            | Wires controllers, services, and providers         |
| `auth.controller.ts`        | Controller        | 10 HTTP endpoints (3 auth methods + session mgmt) |
| `email-auth.service.ts`     | Service           | Email+Password register & login (bcrypt)           |
| `github-auth.service.ts`    | Service           | GitHub OAuth authorization code flow               |
| `telegram-auth.service.ts`  | Service           | Telegram Login Widget HMAC verification            |
| `session.service.ts`        | Service           | Session CRUD helpers                               |
| `prisma-session-store.ts`   | Store             | Express-session PostgreSQL adapter                 |
| `guards/session.guard.ts`   | Guard             | Route protection                                   |
| `dto/register.dto.ts`       | DTO               | Email+password registration validation             |
| `dto/login.dto.ts`          | DTO               | Email+password login validation                    |
| `dto/telegram-auth.dto.ts`  | DTO               | Telegram widget data validation                    |
| `types/session.d.ts`        | Type augmentation | Adds custom fields to SessionData                  |

---

## Email Auth Service (`email-auth.service.ts`)

### Purpose

Handles traditional email + password authentication using [bcrypt](https://github.com/kelektiv/node.bcrypt.js) for password hashing.

### Registration Flow

```
register(email, password, username)
  │
  ├─ Check if email already exists → ConflictException if taken
  ├─ Hash password with bcrypt (10 salt rounds)
  ├─ INSERT INTO users (email, passwordHash, username)
  └─ Return { userId, email, username }
```

### Login Flow

```
login(email, password)
  │
  ├─ SELECT FROM users WHERE email = ?
  ├─ If not found or no passwordHash → UnauthorizedException
  ├─ Compare password with stored hash (bcrypt.compare)
  ├─ If mismatch → UnauthorizedException
  └─ Return { userId, email, username }
```

### Security Properties

| Property                | Implementation                                         |
| ----------------------- | ------------------------------------------------------ |
| **Password hashing**    | bcrypt with 10 salt rounds (adaptive cost function)    |
| **Generic errors**      | "Invalid email or password" — no user enumeration      |
| **Uniqueness**          | Email is `@unique` in Prisma schema                    |
| **Validation**          | DTOs use `class-validator`: `@IsEmail()`, `@MinLength(8)`, `@MaxLength(128)` |

---

## GitHub Auth Service (`github-auth.service.ts`)

### Purpose

Implements the [GitHub OAuth Authorization Code flow](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps). Exchanges authorization codes for access tokens, fetches user profile + email, and upserts the user in the database.

### Configuration

```typescript
clientId     = process.env.GITHUB_CLIENT_ID
clientSecret = process.env.GITHUB_CLIENT_SECRET
callbackUrl  = process.env.GITHUB_CALLBACK_URL ?? 'http://localhost:3000/auth/github/callback'
```

### Flow (Detail)

#### Step 1: `getAuthorizationUrl()`

Builds a URL to `https://github.com/login/oauth/authorize` with:
- `client_id` — identifies the OAuth App
- `redirect_uri` — server callback URL
- `scope` — `read:user user:email` (profile + private email access)

#### Step 2: `handleCallback(code)`

1. **Exchange code for token** — POST to `https://github.com/login/oauth/access_token`
2. **Fetch user profile** — GET `https://api.github.com/user` with Bearer token
3. **Fetch primary email** — If profile email is null, GET `https://api.github.com/user/emails` and pick the primary verified email
4. **Upsert user**:
   - Find by `githubId` → if found, return existing user
   - If not found and email matches existing account → link `githubId` to that account
   - Otherwise → create new user with `githubId`, email, username, avatar

### Account Linking

GitHub OAuth handles the case where a user already registered via email:

```typescript
if (email) {
  const byEmail = await this.prisma.user.findUnique({ where: { email } });
  if (byEmail) {
    // Link GitHub to existing account instead of creating a duplicate
    user = await this.prisma.user.update({
      where: { id: byEmail.id },
      data: { githubId },
    });
  }
}
```

---

## Telegram Auth Service (`telegram-auth.service.ts`)

### Purpose

Verifies data from the [Telegram Login Widget](https://core.telegram.org/widgets/login) using HMAC-SHA-256, and upserts the user.

### Configuration

```typescript
botToken = process.env.TELEGRAM_BOT_TOKEN
```

> **Important:** The Telegram Login Widget must be configured in BotFather with the correct domain. The widget checks that the page's domain matches the authorized domain.

### Verification Algorithm

Following [Telegram's documentation](https://core.telegram.org/widgets/login#checking-authorization):

```
verifyAuth(data):
  │
  ├─ Extract hash from data, get remaining fields
  ├─ Build data-check-string:
  │    Sort remaining keys alphabetically
  │    Join as "key=value\nkey=value\n..."
  ├─ secret_key = SHA-256(bot_token)
  ├─ computed_hash = HMAC-SHA-256(data_check_string, secret_key)
  └─ Return computed_hash === hash
```

### Authentication Flow

```
authenticate(data):
  │
  ├─ Verify HMAC hash → UnauthorizedException if invalid
  ├─ Check auth_date is within 5 minutes → UnauthorizedException if expired
  ├─ Build display name from username / first_name + last_name / tg_{id}
  ├─ Find user by telegramId → if found, return
  └─ Create new user with telegramId, username, profileImage
```

### Security Properties

| Property                    | Implementation                                              |
| --------------------------- | ----------------------------------------------------------- |
| **HMAC verification**       | SHA-256 secret key derived from bot token + HMAC-SHA-256    |
| **Freshness check**         | `auth_date` must be within 300 seconds (5 minutes)          |
| **Cryptographic integrity** | Uses Node.js `crypto` module (CSPRNG-backed)                |

---

## Session Management

### Session Type Augmentation (`types/session.d.ts`)

Express-session's `SessionData` interface is extended with custom fields via [declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html):

```typescript
declare module 'express-session' {
  interface SessionData {
    userId?: string;     // Authenticated user ID (BigInt as string)
    email?: string;      // User's email address
    userAgent?: string;  // Browser/device string for session listing
    ip?: string;         // IP address at login time
    createdAt?: number;  // Unix timestamp of session creation
  }
}
```

This augmentation makes `req.session.userId` etc. type-safe across the entire codebase.

### Session Service (`session.service.ts`)

Provides high-level session operations:

| Method                                | Description                                                          |
| ------------------------------------- | -------------------------------------------------------------------- |
| `createSession(req, userId, email)` | Populates `req.session` fields after successful auth               |
| `listUserSessions(userId)`          | Queries all non-expired sessions, filters by `userId` in JSON data |
| `destroySession(sessionId)`         | Deletes a specific session from the DB                               |
| `destroyAllUserSessions(userId)`    | Finds and deletes all sessions for a user (bulk logout)              |

> **Note:** `listUserSessions` scans all active sessions and filters by parsing JSON — this is fine for moderate session counts but may need optimization (e.g. a `userId` column) at scale.

### Prisma Session Store (`prisma-session-store.ts`)

A custom implementation of `express-session.Store` that persists sessions to PostgreSQL via Prisma instead of the default in-memory store.

```typescript
class PrismaSessionStore extends Store {
  get(sid, callback)      // Read session from DB
  set(sid, session, cb)   // Upsert session (create or update)
  destroy(sid, cb)        // Delete session
  touch(sid, session, cb) // Refresh expiry without changing data
  cleanup()               // Delete expired sessions (runs every 15 min)
  close()                 // Stop the cleanup timer
}
```

**Design decisions:**

| Decision                                     | Rationale                                                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Arrow function methods (`get = (...)`)     | Avoids `this` binding issues with the Store superclass                                           |
| Automatic cleanup via `setInterval`        | Prevents expired sessions from accumulating. 15-minute interval balances DB load vs. storage waste |
| `P2025` error suppression in `destroy()` | `delete()` throws if the row doesn't exist; sessions may already be cleaned up                   |
| Default TTL of 7 days                        | `cookie.maxAge` takes precedence when set; the TTL is a fallback                                 |

### Session Lifecycle

```
1. User authenticates (Email+Password / GitHub OAuth / Telegram)
      │
      ▼
2. SessionService.createSession() populates req.session
      │
      ▼
3. express-session calls PrismaSessionStore.set()
      │ → UPSERT INTO sessions (id, data, expiresAt)
      ▼
4. Response includes Set-Cookie: connect.sid=<sessionId>
      │
      ▼
5. Subsequent requests include Cookie: connect.sid=<sessionId>
      │
      ▼
6. express-session calls PrismaSessionStore.get()
      │ → SELECT FROM sessions WHERE id = <sessionId>
      │ → Parse JSON data back into req.session
      ▼
7. SessionGuard checks req.session.userId
      │ → If present: allow through
      │ → If absent: throw UnauthorizedException
```

---

## Session Guard (`guards/session.guard.ts`)

A NestJS **route guard** that protects endpoints requiring authentication:

```typescript
@Injectable()
export class SessionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (!request.session.userId) {
      throw new UnauthorizedException('Not authenticated');
    }
    return true;
  }
}
```

### Usage

```typescript
@UseGuards(SessionGuard)
@Get('me')
me(@Req() req: Request) { ... }
```

Guards run **before** the route handler. If `canActivate` returns `false` or throws, the request is rejected with the appropriate HTTP status (401 in this case).

---

## Auth Controller Endpoints

### Email + Password

| Method   | Path              | Auth | Description                              |
| -------- | ----------------- | ---- | ---------------------------------------- |
| `POST` | `/auth/register` | None | Register with email, password, username  |
| `POST` | `/auth/login`    | None | Login with email and password            |

### GitHub OAuth

| Method  | Path                       | Auth | Description                                   |
| ------- | -------------------------- | ---- | --------------------------------------------- |
| `GET` | `/auth/github`           | None | Redirect to GitHub authorization page         |
| `GET` | `/auth/github/callback`  | None | Handle OAuth callback, create session, redirect to frontend |

### Telegram Login

| Method   | Path              | Auth | Description                                 |
| -------- | ----------------- | ---- | ------------------------------------------- |
| `POST` | `/auth/telegram` | None | Verify Telegram widget data, create session |

### Session Management

| Method     | Path                   | Auth             | Description                                |
| ---------- | ---------------------- | ---------------- | ------------------------------------------ |
| `GET`    | `/auth/me`           | `SessionGuard` | Get current session info                   |
| `GET`    | `/auth/sessions`     | `SessionGuard` | List all active sessions                   |
| `DELETE` | `/auth/sessions/:id` | `SessionGuard` | Destroy a specific session (remote logout) |
| `POST`   | `/auth/logout`       | `SessionGuard` | Destroy current session                    |
| `POST`   | `/auth/logout/all`   | `SessionGuard` | Destroy all user sessions                  |

### Security: Session Ownership Check

When destroying a session via `DELETE /auth/sessions/:id`, the controller verifies the target session belongs to the requesting user:

```typescript
const userSessions = await this.sessionService.listUserSessions(userId);
const ownsSession = userSessions.some(s => s.sessionId === sessionId);
if (!ownsSession) {
  throw new BadRequestException('Session not found');
}
```

This prevents users from destroying other users' sessions.

---

## DTOs (Data Transfer Objects)

DTOs define the shape of request bodies and use `class-validator` decorators for runtime validation (enabled via `ValidationPipe` in `main.ts`).

### `RegisterDto`

```typescript
export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128)
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  username!: string;
}
```

### `LoginDto`

```typescript
export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
```

### `TelegramAuthDto`

```typescript
export class TelegramAuthDto {
  @IsNumber()
  id!: number;

  @IsOptional() @IsString()
  first_name?: string;

  @IsOptional() @IsString()
  last_name?: string;

  @IsOptional() @IsString()
  username?: string;

  @IsOptional() @IsString()
  photo_url?: string;

  @IsNumber()
  auth_date!: number;

  @IsString()
  hash!: string;
}
```

---

## Session Cookie Configuration

Configured in `main.ts`:

```typescript
app.use(session({
  store: new PrismaSessionStore(prisma),
  secret: process.env.SESSION_SECRET || 'change-me-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,    // JS cannot access the cookie (XSS protection)
    secure: process.env.NODE_ENV === 'production',  // HTTPS-only in prod
    sameSite: 'lax',   // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
  },
}));
```

| Setting                      | Value           | Why                                                         |
| ---------------------------- | --------------- | ----------------------------------------------------------- |
| `httpOnly: true`           | Always          | Prevents client-side JS from reading the session cookie     |
| `secure: true`             | Production only | Ensures cookie is only sent over HTTPS                      |
| `sameSite: 'lax'`          | Always          | Prevents cookie from being sent in cross-site POST requests |
| `resave: false`            | Always          | Don't re-save session if not modified (reduces DB writes)   |
| `saveUninitialized: false` | Always          | Don't create sessions for unauthenticated users             |
| `maxAge: 7 days`           | Default         | Session duration (can be overridden per-session)            |
