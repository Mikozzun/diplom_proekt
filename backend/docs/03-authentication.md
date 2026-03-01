# Authentication System

## Architecture Overview

The authentication system is **passwordless**, combining two independent factors:

1. **OTP (One-Time Password)** — Proves ownership of a phone number
2. **WebAuthn / Passkeys** — Cryptographic proof of device possession

Sessions are managed with **express-session** backed by a **custom PostgreSQL store** (no Redis dependency).

```
┌─────────────────────────────────────────────────────────────────────┐
│                     REGISTRATION FLOW                               │
│                                                                     │
│  Client                        Server                              │
│  ──────                        ──────                              │
│  1. Enter phone number ──────▶ POST /auth/otp/send                 │
│                                 └─▶ Generate OTP, store in DB       │
│                                 └─▶ Log to console (dev) / SMS      │
│                                                                     │
│  2. Enter received code ─────▶ POST /auth/otp/verify               │
│                                 └─▶ Verify OTP in DB               │
│                                 └─▶ Mark phone verified in session  │
│                                 └─▶ Generate WebAuthn challenge     │
│                                 ◀── Return registration options     │
│                                                                     │
│  3. navigator.credentials      POST /auth/register/verify          │
│     .create() ───────────────▶  └─▶ Verify attestation             │
│                                  └─▶ Create/find User record        │
│                                  └─▶ Store Credential (public key)  │
│                                  └─▶ Auto-login (create session)    │
│                                  ◀── { verified, userId }           │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        LOGIN FLOW                                   │
│                                                                     │
│  Client                        Server                              │
│  ──────                        ──────                              │
│  1. Click "Login" ───────────▶ GET /auth/login/options             │
│                                 └─▶ Generate authentication options │
│                                 └─▶ Store challenge in memory       │
│                                 ◀── Return authentication options   │
│                                                                     │
│  2. navigator.credentials      POST /auth/login/verify             │
│     .get() ──────────────────▶  └─▶ Look up credential in DB       │
│                                  └─▶ Verify assertion + counter     │
│                                  └─▶ Update counter (anti-replay)   │
│                                  └─▶ Create session                 │
│                                  ◀── { verified, userId }           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Map

| File                        | Type              | Responsibility                             |
| --------------------------- | ----------------- | ------------------------------------------ |
| `auth.module.ts`          | Module            | Wires controllers, services, and providers |
| `auth.controller.ts`      | Controller        | 9 HTTP endpoints                           |
| `otp.service.ts`          | Service           | OTP generation & verification              |
| `webauthn.service.ts`     | Service           | Passkey registration & authentication      |
| `session.service.ts`      | Service           | Session CRUD helpers                       |
| `prisma-session-store.ts` | Store             | Express-session PostgreSQL adapter         |
| `guards/session.guard.ts` | Guard             | Route protection                           |
| `dto/*.dto.ts`            | DTO               | Request body validation types              |
| `types/session.d.ts`      | Type augmentation | Adds custom fields to SessionData          |

---

## OTP Service (`otp.service.ts`)

### Purpose

Generates and verifies 6-digit one-time codes. This is the first step in registration — it proves the user owns the phone number before any passkey is created.

### How It Works

```
sendOtp(phoneNumber)
  │
  ├─ Generate random 6-digit code using crypto.randomInt()
  ├─ Calculate expiresAt = now + 5 minutes
  ├─ INSERT INTO otp_challenges (phoneNumber, code, expiresAt)
  └─ Log code to console (dev) / send via SMS (production)

verifyOtp(phoneNumber, code)
  │
  ├─ SELECT FROM otp_challenges WHERE phone=X AND code=Y
  │    AND verified=false AND expiresAt >= now
  │    ORDER BY createdAt DESC
  │
  ├─ If not found → return false
  └─ If found → UPDATE SET verified=true → return true
```

### Security Properties

| Property                           | Implementation                                               |
| ---------------------------------- | ------------------------------------------------------------ |
| **Cryptographic randomness** | `crypto.randomInt(100_000, 999_999)` — uses Node's CSPRNG |
| **One-time use**             | `verified` flag prevents code reuse                        |
| **Expiration**               | 5-minute TTL (`OTP_TTL_MS = 5 * 60 * 1000`)                |
| **Latest-first**             | `orderBy: { createdAt: 'desc' }` uses the most recent code |

### Production Considerations

The `sendOtp` method currently logs the code to console. In production, replace the `this.logger.log(...)` call with an SMS provider integration (Twilio, AWS SNS, etc.):

```typescript
// Replace this:
this.logger.log(`[DEV] OTP for ${phoneNumber}: ${code}`);

// With something like:
await this.smsProvider.send(phoneNumber, `Your code: ${code}`);
```

---

## WebAuthn Service (`webauthn.service.ts`)

### Purpose

Handles the cryptographic passkey lifecycle using the `@simplewebauthn/server` library, which implements the [WebAuthn Level 2](https://www.w3.org/TR/webauthn-2/) specification.

### Configuration

```typescript
rpName = process.env.RP_NAME || 'Frogger';     // Displayed in browser prompts
rpID   = process.env.RP_ID   || 'localhost';    // Must match request origin domain
origin = process.env.ORIGIN  || 'http://localhost:3000';
```

> **Critical:** In production, `rpID` must match the domain (e.g. `example.com`) and `origin` must match the full URL (e.g. `https://example.com`). A mismatch will cause all verifications to fail.

### Challenge Store

Challenges are stored in an **in-memory `Map`** keyed by purpose:

```
challengeStore:
  "reg:+1234567890"   → "abc123..."    // Registration challenge for phone
  "auth:xyz789..."    → "xyz789..."    // Authentication challenge
```

> **Limitation:** In-memory challenges are lost on server restart and don't work with multiple server instances. For production multi-instance deployments, replace with a Redis or DB-backed store.

### Registration Flow (Detail)

#### Step 1: `generateRegistrationOptions(phoneNumber)`

1. Look up existing user and their credentials (if any)
2. Build `excludeCredentials` list so the browser won't re-register the same authenticator
3. Call `@simplewebauthn/server.generateRegistrationOptions()` with:
   - `rpName`, `rpID` — Relying Party identity
   - `userName` — the phone number
   - `attestationType: 'none'` — we don't need hardware attestation
   - `authenticatorSelection.residentKey: 'preferred'` — prefer discoverable credentials
   - `authenticatorSelection.userVerification: 'preferred'` — request biometric/PIN if available
4. Store the challenge: `challengeStore.set("reg:+1234567890", challenge)`
5. Return the options object to the client

#### Step 2: `verifyRegistration(phoneNumber, credential)`

1. Retrieve the expected challenge from the store
2. Call `verifyRegistrationResponse()` — this validates:
   - The challenge matches
   - The origin matches
   - The RP ID matches
   - The attestation signature is valid
3. On success:
   - Find or create the User record
   - Store the Credential (public key, counter, transports)
4. Clean up the challenge from the store (even on failure, via `finally`)

### Authentication Flow (Detail)

#### Step 1: `generateAuthenticationOptions()`

1. Call `@simplewebauthn/server.generateAuthenticationOptions()` with:
   - `allowCredentials: []` — empty array enables **discoverable credentials** (the browser shows all available passkeys)
   - `userVerification: 'preferred'`
2. Store: `challengeStore.set("auth:" + challenge, challenge)`

#### Step 2: `verifyAuthentication(credential)`

1. Look up the stored credential by `credential.id` (the browser sends back which key was used)
2. Find the matching challenge in the store
3. Call `verifyAuthenticationResponse()` — validates the assertion signature against the stored public key
4. Update the **signature counter** — this is critical for replay attack prevention:
   ```typescript
   await prisma.credential.update({
     where: { id: storedCredential.id },
     data: { counter: BigInt(verification.authenticationInfo.newCounter) },
   });
   ```
5. Return the authenticated user

### Error Handling

All WebAuthn operations wrap `@simplewebauthn/server` calls in try/catch and re-throw as `BadRequestException` with descriptive messages. The original error is logged at `error` level.

---

## Session Management

### Session Type Augmentation (`types/session.d.ts`)

Express-session's `SessionData` interface is extended with custom fields via [declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html):

```typescript
declare module 'express-session' {
  interface SessionData {
    userId?: string;        // Authenticated user ID (BigInt as string)
    phoneNumber?: string;   // User's phone number
    userAgent?: string;     // Browser/device string for session listing
    ip?: string;            // IP address at login time
    createdAt?: number;     // Unix timestamp of session creation
    verifiedPhone?: string; // Phone verified in OTP step (pre-registration)
  }
}
```

This augmentation makes `req.session.userId` etc. type-safe across the entire codebase.

### Session Service (`session.service.ts`)

Provides high-level session operations:

| Method                                      | Description                                                          |
| ------------------------------------------- | -------------------------------------------------------------------- |
| `createSession(req, userId, phoneNumber)` | Populates `req.session` fields after successful auth               |
| `listUserSessions(userId)`                | Queries all non-expired sessions, filters by `userId` in JSON data |
| `destroySession(sessionId)`               | Deletes a specific session from the DB                               |
| `destroyAllUserSessions(userId)`          | Finds and deletes all sessions for a user (bulk logout)              |

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
1. User authenticates (OTP+WebAuthn or passkey login)
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

### Why Not a Middleware?

In NestJS, **guards** are preferred over middleware for authentication because:

- They integrate with the NestJS lifecycle (modules, dependency injection, metadata)
- They can be applied per-route, per-controller, or globally
- They work with `@UseGuards()` decorator — clear and declarative
- They have access to `ExecutionContext` (route metadata, handler reference)

---

## Auth Controller Endpoints

### Registration

| Method   | Path                      | Auth | Description                                         |
| -------- | ------------------------- | ---- | --------------------------------------------------- |
| `POST` | `/auth/otp/send`        | None | Send OTP to phone number                            |
| `POST` | `/auth/otp/verify`      | None | Verify OTP, return WebAuthn registration challenge  |
| `POST` | `/auth/register/verify` | None | Verify passkey attestation, create user, auto-login |

### Login

| Method   | Path                    | Auth | Description                              |
| -------- | ----------------------- | ---- | ---------------------------------------- |
| `GET`  | `/auth/login/options` | None | Get WebAuthn authentication challenge    |
| `POST` | `/auth/login/verify`  | None | Verify passkey assertion, create session |

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

DTOs define the shape of request bodies. They are plain TypeScript classes:

### `SendOtpDto`

```typescript
export class SendOtpDto {
  phoneNumber: string;
}
```

### `VerifyOtpDto`

```typescript
export class VerifyOtpDto {
  phoneNumber: string;
  code: string;
}
```

### `VerifyRegistrationDto`

```typescript
export class VerifyRegistrationDto {
  phoneNumber: string;
  credential: RegistrationResponseJSON;  // from @simplewebauthn/server
}
```

### `VerifyAuthenticationDto`

```typescript
export class VerifyAuthenticationDto {
  credential: AuthenticationResponseJSON;  // from @simplewebauthn/server
}
```

The `credential` fields use types from `@simplewebauthn/server`, ensuring type safety between the browser's WebAuthn API responses and the server's verification logic.

> **Note:** These DTOs don't currently use `class-validator` decorators. To add runtime validation, install `class-validator` + `class-transformer`, add decorators like `@IsString()`, and enable `ValidationPipe` globally in `main.ts`.

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
