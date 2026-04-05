# 01 — Getting Started

## Prerequisites

- **Node.js** 22+ (LTS)
- **npm** 10+ or **pnpm**
- **PostgreSQL** 15+ (or a Supabase project)
- **Git**

## Backend Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 22 |
| Framework | Express.js | 4.21 |
| Language | TypeScript | 5.7 |
| Database | PostgreSQL (Supabase) | 15+ |
| ORM | Prisma | 7.6 |
| Auth | Better Auth | 1.5.6 |
| Admin | AdminJS | 7.8 |
| Validation | Zod | 3.24 |
| Deployment | Fly.io | — |

## Production Endpoints

| URL | Description |
|-----|-------------|
| `https://frogger-backend.fly.dev` | Home page |
| `https://frogger-backend.fly.dev/api` | REST API base |
| `https://frogger-backend.fly.dev/api/auth` | Better Auth API |
| `https://frogger-backend.fly.dev/auth` | Built-in Auth UI |
| `https://frogger-backend.fly.dev/admin` | AdminJS panel |
| `https://frogger-backend.fly.dev/health` | Health check |

## Quick Start — Connect a Frontend

### 1. Install Better Auth Client

```bash
npm install better-auth
```

### 2. Create Auth Client

```typescript
// src/lib/auth-client.ts
import { createAuthClient } from 'better-auth/react';
import { usernameClient, phoneNumberClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: 'https://frogger-backend.fly.dev', // or http://localhost:5000 for local dev
  plugins: [usernameClient(), phoneNumberClient()],
});

export const { signUp, signIn, signOut, useSession } = authClient;
```

### 3. Sign Up a User

```typescript
const result = await authClient.signUp.email({
  email: 'user@example.com',
  password: 'securePassword123',
  name: 'John Doe',
  username: 'johndoe', // optional, from username plugin
});
```

### 4. Make Authenticated API Calls

After sign-in, Better Auth sets a session cookie. Include credentials in fetch:

```typescript
const response = await fetch('https://frogger-backend.fly.dev/api/posts', {
  credentials: 'include', // sends the session cookie
});
const data = await response.json();
```

Or use a Bearer token (JWT):

```typescript
const response = await fetch('https://frogger-backend.fly.dev/api/posts', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

### 5. Set Up CORS (for local development)

Your frontend origin must be allowed by the backend. The backend's CORS is controlled by the `CORS_ORIGIN` environment variable. For local development, the backend currently allows:

- `http://localhost:4000` (auth UI dev)
- Whatever is set in `CORS_ORIGIN` on Fly.io

If your frontend runs on a different port, ask the backend admin to add your origin to `CORS_ORIGIN`.

## Project Structure Reference

```
backend/
├── src/
│   ├── app.ts              # Express app configuration
│   ├── index.ts             # Server entry point
│   ├── config/
│   │   ├── database.ts      # Prisma client
│   │   └── env.ts           # Environment variables
│   ├── lib/
│   │   └── auth.ts          # Better Auth setup
│   ├── controllers/         # Request handlers
│   ├── services/            # Business logic
│   ├── routes/              # Route definitions
│   ├── middleware/           # Auth, validation, rate limiting
│   ├── utils/               # JWT, pagination, WebAuthn helpers
│   └── types/               # TypeScript types
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Seed data
├── public/                  # Static files
│   ├── auth/                # Built auth UI
│   ├── index.html           # Home page
│   ├── privacy.html         # Privacy policy
│   └── terms.html           # Terms of service
└── docs/                    # This documentation
```

## Running the Backend Locally

```bash
# Clone and install
cd backend
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database credentials and secrets

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npm run seed

# Start dev server (port 5000)
npm run dev
```

The backend listens on **port 5000** by default.
