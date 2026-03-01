# Database Models & Prisma

## Overview

The data layer uses **Prisma 7.4** as the ORM, connected to **PostgreSQL** via Prisma Accelerate. The schema is defined in `prisma/schema.prisma` and contains **22 models** organized into six logical groups.

---

## Prisma Configuration

### `prisma.config.ts`

Prisma 7 introduced a TypeScript-based configuration file that replaces environment-level datasource configuration:

```typescript
import 'dotenv/config';
import { defineConfig, env } from '@prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: env('DATABASE_URL') },
});
```

- `env('DATABASE_URL')` reads the connection string from `.env` and **throws** if missing.
- This file is the single source of truth for the database URL at migration time.

### `prisma/prisma.service.ts`

The `PrismaService` is a NestJS-injectable wrapper around `PrismaClient`:

```typescript
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit()    { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}
```

**Key design points:**

| Aspect | Detail |
|---|---|
| **Inheritance** | Extends `PrismaClient` directly — all query methods (`prisma.user.findMany()`, etc.) are available through DI |
| **Lifecycle hooks** | `OnModuleInit` / `OnModuleDestroy` ensure the connection pool opens at startup and closes gracefully on shutdown |
| **Location** | Lives in `prisma/` (not `src/`) because it's co-located with `schema.prisma` |
| **Injection** | Provided by `AuthModule` (and any future module that needs DB access) |

---

## Schema Conventions

All models follow consistent conventions:

| Convention | Example | Reason |
|---|---|---|
| `@id @default(autoincrement())` | `id BigInt` | PostgreSQL `BIGSERIAL` primary key |
| `@map("snake_case")` on fields | `userId → @map("user_id")` | TypeScript uses camelCase, DB columns stay snake_case |
| `@@map("table_name")` on models | `User → @@map("users")` | Model names are PascalCase, table names are pluralized snake_case |
| `DateTime? @default(now())` | `createdAt` | Auto-populated timestamps, nullable for flexibility |
| `onDelete: Cascade` | `Credential` → `User` | Deleting a user removes their credentials |

---

## Entity-Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        USERS & AUTHENTICATION                               │
│                                                                              │
│  ┌──────────┐   1:N   ┌──────────────┐                                       │
│  │   User   │────────▶│  Credential  │  (WebAuthn public keys)               │
│  │          │   1:N   ├──────────────┤                                       │
│  │          │────────▶│ OtpChallenge │  (standalone, no FK to User)           │
│  │          │   1:1   ├──────────────┤                                       │
│  │          │────────▶│   Admin      │                                       │
│  │          │   1:N   ├──────────────┤                                       │
│  │          │────────▶│  UserRole    │◀────────│ Role │                       │
│  │          │   1:1   ├──────────────┤                                       │
│  │          │────────▶│ UserSettings │                                       │
│  └──────────┘                                                                │
│       │                                                                      │
│       │ 1:N                       ┌──────────┐  (standalone)                  │
│       │                           │  Session  │  (express-session store)      │
│       ▼                           └──────────┘                               │
│  ┌──────────┐   1:N   ┌──────────┐                                           │
│  │   Post   │────────▶│ Comment  │                                           │
│  │          │   1:N   ├──────────┤                                           │
│  │          │────────▶│   Like   │                                           │
│  │          │   1:N   ├──────────┤                                           │
│  │          │────────▶│ Bookmark │                                           │
│  │          │   1:N   ├──────────┤                                           │
│  │          │────────▶│ Reaction │                                           │
│  │          │   1:N   ├──────────┤                                           │
│  │          │────────▶│   Poll   │──1:N──▶│ PollResponse │                   │
│  └──────────┘         └──────────┘                                           │
│                                                                              │
│  ┌──────────────┐   ┌───────────────┐   ┌───────────────────────────┐        │
│  │ Notification │   │    Storage    │   │ UserPostRandomization     │        │
│  │ Report       │   │ DailyMetrics  │   │ UserActivityLog           │        │
│  │              │   │ ModerationQ.  │   │                           │        │
│  └──────────────┘   └───────────────┘   └───────────────────────────┘        │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Model Reference

### Group 1: Users & Authentication

#### `User` → `users`

The central entity. Every person who registers gets a User record.

| Field | Type | Notes |
|---|---|---|
| `id` | `BigInt` | Auto-incrementing PK |
| `phoneNumber` | `String` | Unique identifier (used for OTP + WebAuthn) |
| `passkey` | `String` | Legacy column — not used with WebAuthn |
| `username` | `String` | Display name (defaults to phone number at creation) |
| `profileImage` | `String?` | Optional avatar URL |
| `createdAt` | `DateTime?` | Registration timestamp |

**Relations:** A User has many Posts, Comments, Likes, Bookmarks, Reactions, Notifications, Storage files, ActivityLogs, PollResponses, Reports, UserRoles, Credentials, and UserPostRandomizations. One-to-one with Admin and UserSettings.

#### `Credential` → `credentials`

Stores WebAuthn public key credentials (passkeys).

| Field | Type | Notes |
|---|---|---|
| `id` | `BigInt` | PK |
| `userId` | `BigInt` | FK → `users.id` (Cascade delete) |
| `credentialId` | `String` | `@unique` — the browser-generated credential ID |
| `credentialPublicKey` | `Bytes` | CBOR-encoded public key |
| `counter` | `BigInt` | Signature counter (replay protection) |
| `transports` | `String[]` | e.g. `["internal", "hybrid"]` |
| `createdAt` | `DateTime?` | When the passkey was registered |

A User can have multiple credentials (e.g. phone + laptop + security key).

#### `OtpChallenge` → `otp_challenges`

Stores one-time password challenges. **No FK to User** — OTPs are created before the user exists.

| Field | Type | Notes |
|---|---|---|
| `phoneNumber` | `String` | Phone the OTP was sent to |
| `code` | `String` | 6-digit code |
| `expiresAt` | `DateTime` | TTL (5 minutes from creation) |
| `verified` | `Boolean` | Set to `true` once used |

Has a composite index on `(phoneNumber, code)` for fast lookup.

#### `Session` → `sessions`

Express-session storage (replaces Redis). Used by `PrismaSessionStore`.

| Field | Type | Notes |
|---|---|---|
| `id` (`sid`) | `String` | The express-session session ID |
| `data` | `String` | JSON-serialized SessionData |
| `expiresAt` | `DateTime` | When the session auto-expires |

#### `Admin` → `admins`

| Field | Notes |
|---|---|
| `userId` | `@unique` FK → User (1:1) |

#### `Role` → `roles`

Simple role name (e.g. "admin", "moderator").

#### `UserRole` → `user_roles`

Many-to-many join table between User and Role.

#### `UserSettings` → `user_settings`

| Field | Default |
|---|---|
| `theme` | `"light"` |
| `notificationsEnabled` | `true` |

One-to-one with User (`@unique` on `userId`).

---

### Group 2: Posts & Content

#### `Post` → `posts`

| Field | Type | Notes |
|---|---|---|
| `content` | `String?` | Text body |
| `imageUrl` | `String?` | Attached image |
| `videoUrl` | `String?` | Attached video |
| `updatedAt` | `DateTime?` | Manual update tracking |

#### `Comment` → `comments`

Belongs to a User and a Post. Has `content`, `createdAt`, `updatedAt`.

#### `Like` → `likes`

Simple User ↔ Post join. Tracks which users liked which posts.

#### `Bookmark` → `bookmarks`

Same shape as Like but semantically different (saved for later).

#### `Reaction` → `reactions`

Like a Like but with a type field (`reactionType` — e.g. "❤️", "😂", "😡").

---

### Group 3: Polls

#### `Poll` → `polls`

Attached to a Post. Has a `question` (String) and `options` (JSON — flexible array of choices).

#### `PollResponse` → `poll_responses`

Records a user's `selectedOption` for a given Poll.

---

### Group 4: Notifications

#### `Notification` → `notifications`

| Field | Notes |
|---|---|
| `type` | e.g. "like", "comment", "follow" |
| `message` | Human-readable notification text |
| `readAt` | `null` = unread |

---

### Group 5: Storage & Files

#### `Storage` → `storage`

Metadata for uploaded files:

| Field | Notes |
|---|---|
| `fileName` | Original file name |
| `fileType` | MIME type |
| `fileSize` | Size in bytes (`BigInt`) |
| `fileUrl` | URL/path to the stored file |

---

### Group 6: Moderation & Analytics

#### `Report` → `reports`

User-submitted reports with `reportType` and optional `description`.

#### `ModerationQueue` → `moderation_queue`

Items pending moderation review. Standalone (no FK to User).

| Field | Notes |
|---|---|
| `contentType` | "post", "comment", etc. |
| `contentId` | ID of the flagged content |
| `status` | Default `"pending"` |

#### `UserActivityLog` → `user_activity_log`

Tracks user actions (e.g. "login", "post_created") with timestamps.

#### `DailyMetrics` → `daily_metrics`

Aggregated daily analytics:

| Field | Notes |
|---|---|
| `date` | `@db.Date` — date without time |
| `newUsers`, `activeUsers`, `postsCreated`, `commentsMade` | Integer counters |

#### `UserPostRandomization` → `user_post_randomization`

Controls the randomized feed order per user:

| Field | Notes |
|---|---|
| `randomOrder` | Integer for sorting |

---

## Common Prisma Operations

### Basic CRUD

```typescript
// Create a user
const user = await prisma.user.create({
  data: { phoneNumber: '+1234567890', username: 'alice', passkey: '' },
});

// Find with relations
const userWithPosts = await prisma.user.findFirst({
  where: { phoneNumber: '+1234567890' },
  include: { posts: true, credentials: true },
});

// Update
await prisma.credential.update({
  where: { id: credentialId },
  data: { counter: BigInt(newCounter) },
});

// Delete with cascading
await prisma.user.delete({ where: { id: userId } });
// → Also deletes all Credentials (onDelete: Cascade)
```

### Upsert (Session Store)

```typescript
await prisma.session.upsert({
  where: { id: sessionId },
  update: { data: jsonString, expiresAt },
  create: { id: sessionId, data: jsonString, expiresAt },
});
```

### Filtering & Ordering

```typescript
// Find unexpired, unverified OTP
const challenge = await prisma.otpChallenge.findFirst({
  where: {
    phoneNumber,
    code,
    verified: false,
    expiresAt: { gte: new Date() },  // not expired
  },
  orderBy: { createdAt: 'desc' },    // latest first
});
```

### Batch Delete

```typescript
// Cleanup expired sessions
await prisma.session.deleteMany({
  where: { expiresAt: { lt: new Date() } },
});
```

---

## Working with BigInt

PostgreSQL `BIGSERIAL` maps to TypeScript `BigInt`. This has a few implications:

1. **JSON serialization** — `BigInt` cannot be serialized with `JSON.stringify()` by default. Convert to string first:
   ```typescript
   return { userId: user.id.toString() };
   ```

2. **Prisma queries** — Pass `BigInt` literals:
   ```typescript
   await prisma.credential.update({
     where: { id: 5n },  // note the 'n' suffix
     data: { counter: BigInt(newCounter) },
   });
   ```

3. **`Bytes` fields** — `credentialPublicKey` is stored as `Buffer`:
   ```typescript
   // Writing
   data: { credentialPublicKey: Buffer.from(publicKey) }
   // Reading
   const key = new Uint8Array(storedCredential.credentialPublicKey);
   ```

---

## Migration Workflow

```bash
# Create a new migration after editing schema.prisma
npx prisma migrate dev --name add_polls

# Apply migrations in production
npx prisma migrate deploy

# Reset database (drops & recreates)
npx prisma migrate reset

# Generate client after schema changes
npx prisma generate

# Open Prisma Studio (GUI)
npx prisma studio
```
