# Configuration & Build

## TypeScript Configuration

### `tsconfig.json` — Main Config

```jsonc
{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "target": "ES2023",
    // ...
  }
}
```

| Option | Value | Purpose |
|---|---|---|
| `module` | `nodenext` | Emit ESM-compatible modules with `.js` extensions in imports |
| `moduleResolution` | `nodenext` | Resolve imports the way Node.js does (requires `.js` extensions) |
| `target` | `ES2023` | Compilation target — uses modern JS features natively |
| `resolvePackageJsonExports` | `true` | Uses `exports` field in `package.json` for path resolution |
| `esModuleInterop` | `true` | Enables `import x from 'cjs-module'` syntax |
| `declaration` | `true` | Generate `.d.ts` type declaration files |
| `emitDecoratorMetadata` | `true` | **Required by NestJS** — emits type metadata for DI |
| `experimentalDecorators` | `true` | **Required by NestJS** — enables `@Decorator()` syntax |
| `outDir` | `./dist` | Compiled output directory |
| `sourceMap` | `true` | Generate source maps for debugging |
| `incremental` | `true` | Faster rebuilds (caches previous compilation) |
| `skipLibCheck` | `true` | Skip type-checking `node_modules` `.d.ts` files |
| `strictNullChecks` | `true` | `null` and `undefined` are distinct types |
| `noImplicitAny` | `false` | Allow implicit `any` (relaxed for faster development) |

### Why `.js` Extensions in Imports?

With `moduleResolution: "nodenext"`, TypeScript requires explicit file extensions in relative imports:

```typescript
// Source file (TypeScript)
import { AppModule } from './app.module.js';   // ← .js extension

// This resolves to ./app.module.ts at compile time
// and ./app.module.js at runtime (after compilation)
```

This is the standard Node.js ESM resolution behavior. Jest's `moduleNameMapper` strips these extensions during testing (see Testing section).

### `tsconfig.build.json` — Build Config

```jsonc
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

This extends the main config but **excludes** test files and output directories from compilation. Used by `nest build`.

---

## NestJS CLI Configuration (`nest-cli.json`)

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

| Option | Purpose |
|---|---|
| `collection` | Schematics collection for `nest generate` commands |
| `sourceRoot` | Root directory for source files |
| `deleteOutDir: true` | Clean `dist/` before each build |

---

## ESLint Configuration (`eslint.config.mjs`)

Uses the **ESLint flat config** format (ESLint 9+) with TypeScript support:

```javascript
export default tseslint.config(
  { ignores: ['eslint.config.mjs'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/require-await': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
);
```

### Key Decisions

| Rule | Setting | Reason |
|---|---|---|
| `no-explicit-any` | `off` | Prisma's generated types and test mocks use `any` extensively |
| `no-unsafe-*` (5 rules) | `off` | Prisma Client's generated types trigger false positives with type-checked rules |
| `no-floating-promises` | `warn` | Catch forgotten `await` on async calls |
| `no-misused-promises` | `warn` | Prevent passing promises where void is expected |
| `require-await` | `warn` | Flag async functions that don't use `await` |
| `prettier/prettier` | `error` | Enforce consistent formatting |

### How Type-Checked Linting Works

The `recommendedTypeChecked` preset uses the TypeScript compiler to understand types during linting. This enables powerful rules (like detecting unhandled promises) but requires:

```javascript
parserOptions: {
  projectService: true,           // Use TypeScript's project service
  tsconfigRootDir: import.meta.dirname,  // Find tsconfig.json here
}
```

---

## CORS Configuration

```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
});
```

| Setting | Value | Purpose |
|---|---|---|
| `origin` | Frontend URL | Only allow requests from the frontend |
| `credentials: true` | Always | Required for cross-origin cookies (session cookie) |

> Without `credentials: true`, the browser won't include the `connect.sid` session cookie in cross-origin requests, and authentication will silently fail.

> **Note:** When serving the test frontend from the backend itself (via `ServeStaticModule`), CORS is not needed for those requests since they are same-origin. The CORS setting remains for any separate frontend deployments.

---

## Deployment Configuration

### Dockerfile

Multi-stage build for production:

```dockerfile
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY public ./public
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/src/main.js"]
```

Key decisions:
- **Two-stage build** — `builder` installs all deps + compiles; `runner` copies only what's needed
- `npx prisma generate` — Required in the builder stage so the generated Prisma Client is included in `node_modules`
- `COPY public ./public` — Copies the test frontend so `ServeStaticModule` can serve it
- `dist/src/main.js` — The compiled entry point (entrypoint is `src/main.ts` → `dist/src/main.js`)

### Fly.io (`fly.toml`)

```toml
app = 'frogger-backend'
primary_region = 'ams'

[build]

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = 'stop'
  auto_start_machines = true
  min_machines_running = 0
```

The app is deployed to Fly.io's Amsterdam region. `internal_port = 3000` matches the NestJS listen port. HTTPS is enforced via `force_https = true`.

### Environment Variables (Production)

Fly.io secrets are set via `fly secrets set`:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase pooled connection (port 6543) |
| `DIRECT_URL` | Supabase direct connection (port 5432) |
| `SESSION_SECRET` | Secure random session signing key |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `GITHUB_CALLBACK_URL` | `https://frogger-backend.fly.dev/auth/github/callback` |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token for login widget |
| `FRONTEND_URL` | `https://frogger-backend.fly.dev/test` |
| `CORS_ORIGIN` | `https://frogger-backend.fly.dev` |
| `NODE_ENV` | `production` |
