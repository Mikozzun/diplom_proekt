# 05 — Environment & Deployment

## Environment Variables

Create a `.env` file in the project root (never commit it).

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection (pooled) | `postgresql://postgres.[ref]:[pw]@...pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | PostgreSQL direct connection | `postgresql://postgres.[ref]:[pw]@...supabase.com:5432/postgres` |
| `SESSION_SECRET` | Fallback for JWT + Better Auth secrets | Random 64-char string |
| `FRONTEND_URL` | Your frontend origin | `https://myapp.com` |
| `CORS_ORIGIN` | Allowed CORS origin | `https://myapp.com` |

### Optional / Defaults

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `JWT_SECRET` | JWT access token secret | Falls back to `SESSION_SECRET` |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | `SESSION_SECRET + '_refresh'` |
| `BETTER_AUTH_SECRET` | Better Auth encryption secret | Falls back to `SESSION_SECRET` |
| `BETTER_AUTH_URL` | Better Auth base URL | `http://localhost:5000` |
| `RP_ID` | WebAuthn relying party ID | `localhost` |
| `RP_NAME` | WebAuthn relying party name | `Frogger` |
| `RP_ORIGIN` | WebAuthn relying party origin | `http://localhost:5000` |

### OAuth Credentials

| Variable | Description |
|----------|-------------|
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

### `.env.example`

```bash
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
SESSION_SECRET="generate-a-random-64-char-string"
FRONTEND_URL="http://localhost:3000"
CORS_ORIGIN="http://localhost:3000"
PORT=5000
NODE_ENV=development

# OAuth (optional — only needed for social login)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# WebAuthn (optional — only needed for passkey login)
RP_ID="localhost"
RP_NAME="Frogger"
RP_ORIGIN="http://localhost:5000"
```

---

## Connecting a Frontend

### Step 1: Set CORS Origin

The backend only accepts requests from the domain specified in `CORS_ORIGIN`:

```bash
# .env (local dev)
CORS_ORIGIN="http://localhost:3000"

# Production
CORS_ORIGIN="https://myapp.com"
```

> Only **one** origin is supported. To support multiple origins, modify `app.ts` to use a function:
>
> ```typescript
> cors({
>   origin: ['https://myapp.com', 'http://localhost:3000'],
>   credentials: true,
> })
> ```

### Step 2: Set Frontend URL

```bash
FRONTEND_URL="https://myapp.com"
```

### Step 3: Add Trusted Origin (Better Auth)

Edit `src/lib/auth.ts` and add your frontend domain to `trustedOrigins`:

```typescript
trustedOrigins: [
  process.env.BETTER_AUTH_URL || 'http://localhost:5000',
  'http://localhost:4000',
  'http://localhost:3000',       // ← add local frontend
  'https://myapp.com',           // ← add production frontend
],
```

### Step 4: Set Better Auth URL (Production)

```bash
BETTER_AUTH_URL="https://frogger-backend.fly.dev"
```

### Step 5: Configure OAuth Callback URLs

In each OAuth provider's dashboard, update the callback URL:

- **GitHub**: `https://frogger-backend.fly.dev/api/auth/callback/github`
- **Google**: `https://frogger-backend.fly.dev/api/auth/callback/google`

---

## Local Development

### Prerequisites

- Node.js 20+
- PostgreSQL (or Supabase project)

### Setup

```bash
cd backend
cp .env.example .env    # fill in your values
npm install
npx prisma generate
npx prisma migrate dev
npm run dev              # starts on port 5000
```

### Available Scripts

| Script | Command |
|--------|---------|
| `npm run dev` | Start with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled output |
| `npm run seed` | Seed database |
| `npm run lint` | Run ESLint |

---

## Fly.io Deployment

### Current Configuration (`fly.toml`)

```toml
app = 'frogger-backend'
primary_region = 'ams'

[deploy]
  release_command = 'npx tsx prisma/seed.ts'

[http_service]
  internal_port = 5000
  force_https = true
  auto_stop_machines = 'stop'
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  memory = '512mb'
  cpu_kind = 'shared'
  cpus = 1

[checks]
  [checks.health]
    port = 5000
    type = 'http'
    interval = '15s'
    timeout = '5s'
    grace_period = '10s'
    method = 'GET'
    path = '/health'
```

### Set Secrets on Fly.io

```powershell
flyctl secrets set DATABASE_URL="..." DIRECT_URL="..." SESSION_SECRET="..." FRONTEND_URL="..." CORS_ORIGIN="..." BETTER_AUTH_URL="https://frogger-backend.fly.dev" GITHUB_CLIENT_ID="..." GITHUB_CLIENT_SECRET="..." GOOGLE_CLIENT_ID="..." GOOGLE_CLIENT_SECRET="..."
```

### Deploy

```powershell
flyctl deploy --ha=false --no-cache --strategy immediate --wait-timeout 300
```

### Verify

```powershell
Invoke-WebRequest -Uri "https://frogger-backend.fly.dev/health"
# Expected: {"status":"ok","timestamp":"..."}
```

### Useful Commands

| Command | Description |
|---------|-------------|
| `flyctl status` | Machine state + version |
| `flyctl logs` | Live log tail |
| `flyctl ssh console` | SSH into container |
| `flyctl secrets list` | List secret names |
| `flyctl scale memory 1024` | Scale memory to 1 GB |

---

## Production Checklist

Before going live with the frontend, verify:

- [ ] `CORS_ORIGIN` set to frontend production domain
- [ ] `FRONTEND_URL` set to frontend production domain
- [ ] Frontend domain added to `trustedOrigins` in `auth.ts`
- [ ] OAuth callback URLs updated for all providers
- [ ] `SESSION_SECRET` / `BETTER_AUTH_SECRET` are strong random strings (64+ chars)
- [ ] `BETTER_AUTH_URL` set to `https://frogger-backend.fly.dev`
- [ ] `RP_ID` / `RP_ORIGIN` updated for production domain (if using passkeys)
- [ ] Health check passing: `GET /health` → `200`
- [ ] HTTPS enforced (`force_https = true` in fly.toml)
- [ ] `.env` is in `.gitignore`

---

## Architecture Notes

### Trust Proxy

```typescript
app.set('trust proxy', 1);
```

This is required for Fly.io's reverse proxy so that `secure` cookies and correct client IP detection work behind TLS termination.

### Helmet

Helmet security headers are applied to all API routes but **skipped** for:
- `/admin` — AdminJS dashboard
- `/auth` — Auth UI (Vite SPA)
- `/` and `*.html` — Static pages

### Rate Limiting

| Scope | Limit | Window |
|-------|-------|--------|
| Global (`/api/*`) | 100 requests | 15 minutes |
| Auth (`/api/auth/*`) | 20 requests | 15 minutes |

### Body Parsing

JSON body parsing (`10mb` limit) is skipped for:
- `/admin` — AdminJS handles its own parsing
- `/api/auth/*` — Better Auth handles its own parsing
