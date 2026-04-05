# 02 — Authentication

Frogger uses **Better Auth v1.5.6** for authentication. It supports email/password, GitHub OAuth, Google OAuth, username login, and phone number OTP.

## Authentication Methods

| Method | Status | Notes |
|--------|--------|-------|
| Email & Password | ✅ Active | Default method |
| GitHub OAuth | ✅ Active | Requires GitHub OAuth App |
| Google OAuth | ✅ Active | Requires Google Cloud credentials |
| Username & Password | ✅ Active | Via `username()` plugin |
| Phone Number OTP | ⚠️ Partial | SMS provider not yet integrated |
| Passkey / WebAuthn | ✅ Active | FIDO2 passwordless login |

## Better Auth Client Setup

### Installation

```bash
npm install better-auth
```

### React / Vite

```typescript
// src/lib/auth-client.ts
import { createAuthClient } from 'better-auth/react';
import { usernameClient, phoneNumberClient } from 'better-auth/client/plugins';

const baseURL = import.meta.env.DEV
  ? 'http://localhost:5000'   // local backend
  : 'https://frogger-backend.fly.dev'; // production

export const authClient = createAuthClient({
  baseURL,
  plugins: [usernameClient(), phoneNumberClient()],
});

export const { signUp, signIn, signOut, useSession } = authClient;
```

### Next.js

```typescript
// src/lib/auth-client.ts
import { createAuthClient } from 'better-auth/react';
import { usernameClient, phoneNumberClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://frogger-backend.fly.dev',
  plugins: [usernameClient(), phoneNumberClient()],
});

export const { signUp, signIn, signOut, useSession } = authClient;
```

### Vanilla JavaScript

```typescript
// auth-client.ts
import { createAuthClient } from 'better-auth/client';
import { usernameClient, phoneNumberClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: 'https://frogger-backend.fly.dev',
  plugins: [usernameClient(), phoneNumberClient()],
});
```

> **Note:** Use `better-auth/react` for React projects (includes `useSession` hook). Use `better-auth/client` for non-React projects.

---

## Sign Up

### Email & Password

```typescript
const { data, error } = await authClient.signUp.email({
  email: 'user@example.com',
  password: 'mySecurePassword123',
  name: 'John Doe',
});

if (error) {
  console.error('Sign up failed:', error.message);
} else {
  console.log('User created:', data.user);
  // Session cookie is set automatically
}
```

### With Username (plugin)

```typescript
const { data, error } = await authClient.signUp.email({
  email: 'user@example.com',
  password: 'mySecurePassword123',
  name: 'John Doe',
  username: 'johndoe',         // unique username
  displayUsername: 'JohnDoe',  // display version (case-sensitive)
});
```

---

## Sign In

### Email & Password

```typescript
const { data, error } = await authClient.signIn.email({
  email: 'user@example.com',
  password: 'mySecurePassword123',
});

if (error) {
  console.error('Sign in failed:', error.message);
} else {
  console.log('Signed in:', data.user);
}
```

### Username & Password

```typescript
const { data, error } = await authClient.signIn.username({
  username: 'johndoe',
  password: 'mySecurePassword123',
});
```

### GitHub OAuth

```typescript
// Redirects the user to GitHub for authorization
await authClient.signIn.social({
  provider: 'github',
  callbackURL: '/dashboard', // where to redirect after sign-in
});
```

### Google OAuth

```typescript
await authClient.signIn.social({
  provider: 'google',
  callbackURL: '/dashboard',
});
```

---

## Sign Out

```typescript
await authClient.signOut();
// Session cookie is cleared
```

---

## Session Management

### React Hook (recommended)

```tsx
import { useSession } from '../lib/auth-client';

function Dashboard() {
  const { data: session, isPending, error } = useSession();

  if (isPending) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!session?.user) return <div>Not signed in</div>;

  return (
    <div>
      <h1>Welcome, {session.user.name}</h1>
      <p>Email: {session.user.email}</p>
      <p>User ID: {session.user.id}</p>
      <p>Joined: {new Date(session.user.createdAt).toLocaleDateString()}</p>
      {session.user.image && (
        <img src={session.user.image} alt="Avatar" />
      )}
    </div>
  );
}
```

### Manual Session Check

```typescript
// GET /api/auth/get-session (with credentials)
const res = await fetch('https://frogger-backend.fly.dev/api/auth/get-session', {
  credentials: 'include',
});
const session = await res.json();

if (session?.user) {
  console.log('Authenticated as:', session.user.name);
} else {
  console.log('Not authenticated');
}
```

### Session Object Shape

```typescript
interface Session {
  user: {
    id: string;           // BigInt as string (e.g. "1")
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    username: string | null;
    displayUsername: string | null;
    phoneNumber: string | null;
    phoneNumberVerified: boolean;
    profileImage: string | null;
    createdAt: string;    // ISO 8601
    updatedAt: string;    // ISO 8601
  };
  session: {
    id: string;           // UUID
    userId: string;
    token: string;
    expiresAt: string;    // ISO 8601
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
    updatedAt: string;
  };
}
```

---

## Authentication Methods

The backend supports **two** authentication mechanisms. Both work on all `/api/*` endpoints:

### 1. Cookie-Based (Better Auth Sessions) — Recommended

After calling `signIn` or `signUp` via the Better Auth client, a secure HTTP-only cookie is set automatically. Include `credentials: 'include'` in all fetch requests:

```typescript
const res = await fetch('https://frogger-backend.fly.dev/api/posts', {
  credentials: 'include',
});
```

### 2. Bearer Token (JWT)

The backend also accepts JWT Bearer tokens. Generate tokens via the auth service login endpoint or use the legacy JWT system:

```typescript
const res = await fetch('https://frogger-backend.fly.dev/api/posts', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

**JWT Token Details:**
- Access token: expires in **15 minutes**
- Refresh token: expires in **30 days**

### Authentication Middleware Behavior

The backend has three auth middleware levels:

| Middleware | Behavior |
|-----------|----------|
| `authenticate` | **Required** — returns 401 if no valid session/token |
| `optionalAuth` | **Optional** — attaches user if present, continues regardless |
| `requireAdmin` | **Required + Admin** — returns 403 if user is not an admin |

---

## OAuth Setup (for self-hosted backend)

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App:
   - **Application name**: Frogger
   - **Homepage URL**: `https://your-domain.com`
   - **Authorization callback URL**: `https://your-domain.com/api/auth/callback/github`
3. Copy `Client ID` and `Client Secret`
4. Set environment variables:
   ```bash
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   ```

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID:
   - **Application type**: Web application
   - **Authorized JavaScript origins**: `https://your-domain.com`
   - **Authorized redirect URIs**: `https://your-domain.com/api/auth/callback/google`
3. Set environment variables:
   ```bash
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

### OAuth Callback URL Pattern

Better Auth automatically handles OAuth callbacks at:

```
{BETTER_AUTH_URL}/api/auth/callback/{provider}
```

Examples:
- `https://frogger-backend.fly.dev/api/auth/callback/github`
- `https://frogger-backend.fly.dev/api/auth/callback/google`

---

## Better Auth API Endpoints

Better Auth exposes these endpoints automatically at `/api/auth/*`:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/sign-up/email` | Email sign up |
| POST | `/api/auth/sign-in/email` | Email sign in |
| POST | `/api/auth/sign-in/social` | Social OAuth sign in |
| POST | `/api/auth/sign-out` | Sign out (clear session) |
| GET | `/api/auth/get-session` | Get current session |
| GET | `/api/auth/callback/:provider` | OAuth callback handler |

---

## Passkey / WebAuthn Authentication

### Register a Passkey

```typescript
// 1. Get registration options from server
const startRes = await fetch('/api/passkeys/register/start', {
  method: 'POST',
  credentials: 'include',
});
const options = await startRes.json();

// 2. Create credential using browser WebAuthn API
const credential = await navigator.credentials.create({
  publicKey: options.data,
});

// 3. Send credential to server
const finishRes = await fetch('/api/passkeys/register/finish', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(credential),
});
```

### Authenticate with Passkey

```typescript
// 1. Get authentication options
const startRes = await fetch('/api/passkeys/auth/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'johndoe' }),
});
const options = await startRes.json();

// 2. Get assertion from browser
const assertion = await navigator.credentials.get({
  publicKey: options.data,
});

// 3. Verify with server
const finishRes = await fetch('/api/passkeys/auth/finish', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(assertion),
});
```

---

## Trusted Origins

The backend only allows authentication requests from trusted origins:

```typescript
trustedOrigins: [
  process.env.BETTER_AUTH_URL || 'http://localhost:5000',
  'http://localhost:4000',
]
```

If your frontend is hosted on a different domain, you must add it to `trustedOrigins` in `backend/src/lib/auth.ts` and redeploy.

---

## Common Auth Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` | No valid session or JWT | Sign in first, ensure `credentials: 'include'` |
| `403 Forbidden` | User is not an admin | Only admin routes require admin role |
| `CORS error` | Frontend origin not allowed | Add origin to `CORS_ORIGIN` env var |
| `redirect_uri mismatch` | OAuth callback URL doesn't match | Update callback URL in GitHub/Google settings |
| `Too many auth attempts` | Rate limited (20/15min) | Wait and retry |
