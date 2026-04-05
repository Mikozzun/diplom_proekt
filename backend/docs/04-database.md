# 04 — Database

Frogger uses **PostgreSQL** (hosted on **Supabase**) with **Prisma v7** as the ORM.

## Connection Architecture

```
┌──────────────┐        ┌──────────────┐       ┌──────────────┐
│   Frontend   │  HTTP  │   Backend    │ Prisma │  PostgreSQL  │
│              │ ─────► │  (Express)   │ ─────► │  (Supabase)  │
│              │        │              │        │              │
│  No direct   │        │  Prisma ORM  │        │  15+ tables  │
│  DB access   │        │  adapter: pg │        │              │
└──────────────┘        └──────────────┘        └──────────────┘
```

> **Important:** Frontends should **never** connect directly to the database. All data access goes through the REST API. This section documents the schema for reference.

## Database Setup (Backend Only)

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a project
2. Get the connection strings from **Settings → Database**:
   - **Connection string** (pooled): for `DATABASE_URL`
   - **Direct connection**: for `DIRECT_URL`

### 2. Configure Environment

```bash
# .env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Run Migrations

```bash
npx prisma migrate dev
```

### 5. Seed Database

```bash
npm run seed
```

---

## Schema Overview

### Entity Relationship Diagram

```
User (BigInt PK)
 ├── Post (1:N)
 │    ├── Comment (1:N)
 │    ├── Like (1:N, unique per user+post)
 │    ├── Bookmark (1:N, unique per user+post)
 │    ├── Reaction (1:N, unique per user+post+type)
 │    └── Poll (1:N)
 │         └── PollResponse (1:N, unique per poll+user)
 ├── Notification (1:N)
 ├── Storage (1:N)
 ├── UserSettings (1:1)
 ├── UserActivityLog (1:N)
 ├── Report (1:N)
 ├── UserRole (N:M via Role)
 ├── Admin (1:1)
 ├── Session (1:N) — legacy JWT sessions
 ├── BaSession (1:N) — Better Auth sessions
 ├── Account (1:N) — OAuth provider accounts
 ├── PasskeyCredential (1:N) — WebAuthn credentials
 └── UserPostRandomization (1:N)

Standalone:
 ├── Verification — email/phone verification tokens
 ├── ModerationQueue — content moderation
 └── DailyMetrics — analytics
```

### All Tables

#### User

Primary user table. Uses `BigInt` autoincrement for IDs.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | BigInt | No | autoincrement | Primary key |
| name | String | No | — | Display name |
| email | String | No | — | Unique |
| emailVerified | Boolean | No | false | — |
| image | String | Yes | — | Avatar URL (from OAuth) |
| username | String | Yes | — | Unique, from username plugin |
| displayUsername | String | Yes | — | Case-sensitive display |
| phoneNumber | String | Yes | — | From phone plugin |
| phoneNumberVerified | Boolean | No | false | — |
| passkey | String | Yes | — | Passkey flag |
| profileImage | String | Yes | — | Custom profile image |
| createdAt | DateTime | No | now() | Timestamptz |
| updatedAt | DateTime | Yes | — | Timestamptz |

#### Post

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | BigInt | No | autoincrement | Primary key |
| content | String | Yes | — | Text content |
| imageUrl | String | Yes | — | Image URL |
| videoUrl | String | Yes | — | Video URL |
| userId | BigInt | Yes | — | FK → User (CASCADE) |
| createdAt | DateTime | No | now() | — |
| updatedAt | DateTime | Yes | — | — |

#### Comment

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | BigInt | No | autoincrement | Primary key |
| content | String | No | — | 1–5000 chars |
| userId | BigInt | Yes | — | FK → User (CASCADE) |
| postId | BigInt | Yes | — | FK → Post (CASCADE) |
| createdAt | DateTime | No | now() | — |
| updatedAt | DateTime | Yes | — | — |

#### Like

Unique constraint: `(userId, postId)`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | BigInt | No | autoincrement |
| userId | BigInt | Yes | — |
| postId | BigInt | Yes | — |
| createdAt | DateTime | No | now() |

#### Bookmark

Unique constraint: `(userId, postId)`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | BigInt | No | autoincrement |
| userId | BigInt | Yes | — |
| postId | BigInt | Yes | — |
| createdAt | DateTime | No | now() |

#### Reaction

Unique constraint: `(userId, postId, reactionType)`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | BigInt | No | autoincrement |
| reactionType | String | No | — |
| userId | BigInt | Yes | — |
| postId | BigInt | Yes | — |
| createdAt | DateTime | No | now() |

#### Poll

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | BigInt | No | autoincrement |
| question | String | No | — |
| options | Json | No | — |
| postId | BigInt | Yes | — |
| createdAt | DateTime | No | now() |

#### PollResponse

Unique constraint: `(pollId, userId)`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | BigInt | No | autoincrement |
| selectedOption | String | No | — |
| pollId | BigInt | Yes | — |
| userId | BigInt | Yes | — |
| createdAt | DateTime | No | now() |

#### Notification

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | BigInt | No | autoincrement |
| message | String | No | — |
| type | String | No | — |
| userId | BigInt | Yes | — |
| readAt | DateTime | Yes | — |
| createdAt | DateTime | No | now() |

#### Storage

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | BigInt | No | autoincrement |
| fileName | String | No | — |
| fileType | String | No | — |
| fileSize | BigInt | No | — |
| fileUrl | String | No | — |
| userId | BigInt | Yes | — |
| createdAt | DateTime | No | now() |

#### UserSettings

Unique constraint on `userId` (one-to-one with User).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | BigInt | No | autoincrement |
| userId | BigInt | Yes | — |
| theme | String | Yes | "light" |
| notificationsEnabled | Boolean | Yes | true |
| createdAt | DateTime | No | now() |

#### Role

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | BigInt | No | autoincrement |
| name | String | No | — |

#### UserRole

Unique constraint: `(userId, roleId)`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | BigInt | No | autoincrement |
| userId | BigInt | Yes | — |
| roleId | BigInt | Yes | — |

#### Admin

Unique constraint on `userId`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | BigInt | No | autoincrement |
| userId | BigInt | Yes | — |
| createdAt | DateTime | No | now() |

#### ModerationQueue

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | BigInt | No | autoincrement |
| contentType | String | No | — |
| contentId | BigInt | No | — |
| status | String | Yes | "pending" |
| createdAt | DateTime | No | now() |

#### DailyMetrics

Unique constraint on `date`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | BigInt | No | autoincrement |
| date | Date | No | — |
| newUsers | Int | Yes | 0 |
| activeUsers | Int | Yes | 0 |
| postsCreated | Int | Yes | 0 |
| commentsMade | Int | Yes | 0 |

#### BaSession (Better Auth Sessions)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | String | No | — |
| expiresAt | DateTime | No | — |
| token | String | No | — |
| ipAddress | String | Yes | — |
| userAgent | String | Yes | — |
| userId | BigInt | No | FK → User |
| createdAt | DateTime | No | now() |
| updatedAt | DateTime | No | — |

#### Account (OAuth Accounts)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | String | No | — |
| accountId | String | No | — |
| providerId | String | No | — |
| userId | BigInt | No | FK → User |
| accessToken | String | Yes | — |
| refreshToken | String | Yes | — |
| idToken | String | Yes | — |
| accessTokenExpiresAt | DateTime | Yes | — |
| refreshTokenExpiresAt | DateTime | Yes | — |
| scope | String | Yes | — |
| password | String | Yes | — |
| createdAt | DateTime | No | now() |
| updatedAt | DateTime | No | — |

#### Verification

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | String | No | — |
| identifier | String | No | — |
| value | String | No | — |
| expiresAt | DateTime | No | — |
| createdAt | DateTime | No | now() |
| updatedAt | DateTime | No | — |

#### Session (Legacy JWT Sessions)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | BigInt | No | autoincrement |
| userId | BigInt | No | FK → User |
| refreshToken | String | No | — |
| deviceInfo | String | Yes | — |
| ipAddress | String | Yes | — |
| expiresAt | DateTime | No | — |
| lastActive | DateTime | No | now() |
| createdAt | DateTime | No | now() |

#### PasskeyCredential

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | BigInt | No | autoincrement |
| userId | BigInt | No | FK → User |
| credentialId | String | No | Unique |
| publicKey | String | No | — |
| counter | BigInt | No | 0 |
| deviceType | String | Yes | — |
| backedUp | Boolean | No | false |
| transports | String[] | No | [] |
| createdAt | DateTime | No | now() |

---

## Prisma Client Usage (Backend Only)

```typescript
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

export const prisma = new PrismaClient({ adapter });
```

### Example Queries

```typescript
// Get all posts with user info
const posts = await prisma.post.findMany({
  include: { user: { select: { id: true, name: true, username: true } } },
  orderBy: { createdAt: 'desc' },
  take: 20,
});

// Create a post
const post = await prisma.post.create({
  data: {
    content: 'Hello world!',
    userId: BigInt(1),
  },
});

// Count likes for a post
const likeCount = await prisma.like.count({
  where: { postId: BigInt(1) },
});
```

---

## ID Format

- **User IDs**: `BigInt` (autoincrement) — serialized as strings in JSON (e.g. `"1"`, `"42"`)
- **Auth-related IDs** (BaSession, Account, Verification): `String` (UUID)
- **All other IDs**: `BigInt` (autoincrement)

The backend has a custom BigInt JSON serializer:

```typescript
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};
```

When receiving IDs from the API, they come as **strings**. When sending IDs in requests, send them as strings.
