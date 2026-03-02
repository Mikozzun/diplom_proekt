# Testing

## Overview

The project has **228 tests** organized into two categories:

| Category | Location | Count | Config | Runner |
|---|---|---|---|---|
| **Unit tests** | `test/unit/` | 165 | `package.json` → `jest` section | `npm test` |
| **E2E tests** | `test/e2e/` | 63 | `test/jest-e2e.json` | `npm run test:e2e` |

All tests use **Jest 30** with **ts-jest** for TypeScript compilation.

---

## Test Structure

```
test/
├── unit/
│   ├── app.controller.spec.ts              (1 test)
│   ├── auth/
│   │   ├── email-auth.service.spec.ts      (8 tests)
│   │   ├── github-auth.service.spec.ts     (11 tests)
│   │   ├── telegram-auth.service.spec.ts   (9 tests)
│   │   ├── session.service.spec.ts         (11 tests)
│   │   ├── auth.controller.spec.ts         (20 tests)
│   │   ├── prisma-session-store.spec.ts    (16 tests)
│   │   └── guards/
│   │       └── session.guard.spec.ts       (6 tests)
│   ├── users/
│   │   ├── users.service.spec.ts           (10 tests)
│   │   └── users.controller.spec.ts        (5 tests)
│   ├── posts/
│   │   ├── posts.service.spec.ts           (16 tests)
│   │   └── posts.controller.spec.ts        (7 tests)
│   ├── comments/
│   │   ├── comments.service.spec.ts        (14 tests)
│   │   └── comments.controller.spec.ts     (6 tests)
│   ├── likes/
│   │   ├── likes.service.spec.ts           (8 tests)
│   │   └── likes.controller.spec.ts        (5 tests)
│   ├── bookmarks/
│   │   ├── bookmarks.service.spec.ts       (8 tests)
│   │   └── bookmarks.controller.spec.ts    (5 tests)
│   └── reactions/
│       ├── reactions.service.spec.ts       (5 tests)
│       └── reactions.controller.spec.ts    (4 tests)
├── e2e/
│   ├── app.e2e-spec.ts                     (1 test)
│   ├── auth.e2e-spec.ts                    (22 tests)
│   └── integration.e2e-spec.ts             (40 tests)
└── jest-e2e.json
```

---

## Jest Configuration

### Unit Tests (`package.json`)

```json
{
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": ".",
    "testRegex": "test/unit/.*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "moduleNameMapper": {
      "^(\\.{1,2}/.*)\\.js$": "$1"
    },
    "collectCoverageFrom": ["src/**/*.(t|j)s"],
    "coverageDirectory": "coverage",
    "testEnvironment": "node"
  }
}
```

| Option | Value | Purpose |
|---|---|---|
| `rootDir` | `.` | Resolve paths from the project root |
| `testRegex` | `test/unit/.*\\.spec\\.ts$` | Only match `.spec.ts` files in `test/unit/` |
| `transform` | `ts-jest` | Compile TypeScript on-the-fly |
| `moduleNameMapper` | Strip `.js` extensions | Required because source uses `.js` imports for `nodenext` resolution, but Jest resolves `.ts` files |
| `collectCoverageFrom` | `src/**/*` | Coverage reports skip test files |
| `testEnvironment` | `node` | Use Node.js APIs (not jsdom) |

### The `.js` Extension Problem

TypeScript with `moduleResolution: "nodenext"` requires `.js` extensions in imports:

```typescript
import { PrismaService } from '../../prisma/prisma.service.js';
```

But Jest resolves files by their actual extension (`.ts`). The `moduleNameMapper` rule strips `.js`:

```
"^(\\.{1,2}/.*)\\.js$": "$1"
```

This transforms `../../prisma/prisma.service.js` → `../../prisma/prisma.service`, and Jest finds the `.ts` file.

### E2E Tests (`test/jest-e2e.json`)

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "..",
  "testEnvironment": "node",
  "testRegex": "test/e2e/.*\\.e2e-spec\\.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "moduleNameMapper": { "^(\\.{1,2}/.*)\\.js$": "$1" }
}
```

Same setup, but `rootDir: ".."` (points to project root from `test/`) and `testRegex` matches `.e2e-spec.ts` files in `test/e2e/`.

---

## Unit Testing Patterns

### 1. Test Module Setup (NestJS Testing Utilities)

Every service/controller test creates an isolated NestJS module with mocked dependencies:

```typescript
import { Test, TestingModule } from '@nestjs/testing';

let service: OtpService;
let prisma: { otpChallenge: { create: jest.Mock; findFirst: jest.Mock; update: jest.Mock } };

beforeEach(async () => {
  prisma = {
    otpChallenge: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      OtpService,
      { provide: PrismaService, useValue: prisma },
      //         ↑ Token to replace     ↑ Mock implementation
    ],
  }).compile();

  service = module.get<OtpService>(OtpService);
});
```

**Key concept:** `{ provide: PrismaService, useValue: prisma }` tells NestJS DI to inject the mock object wherever `PrismaService` is requested. The real database is never touched.

### 2. Mocking Prisma

Each Prisma model method is mocked with `jest.fn()`:

```typescript
const prisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

// In the test:
prisma.user.findUnique.mockResolvedValue(null); // No existing user
prisma.user.create.mockResolvedValue({
  id: 1n,
  email: 'test@example.com',
  username: 'testuser',
  passwordHash: '$2b$10$...',
});
```

### 3. Testing Async Service Methods

```typescript
it('should login with valid credentials', async () => {
  prisma.user.findUnique.mockResolvedValue({
    id: 1n,
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: '$2b$10$hashedvalue',
  });

  // bcrypt.compare is also mocked in the test setup
  const result = await service.login('test@example.com', 'password123');

  expect(result.userId).toBe('1');
  expect(result.email).toBe('test@example.com');
  expect(prisma.user.findUnique).toHaveBeenCalledWith({
    where: { email: 'test@example.com' },
  });
});
```

**Pattern:**
1. **Arrange** — Configure mock return values
2. **Act** — Call the method under test
3. **Assert** — Check the result AND verify the mock was called with expected arguments

### 4. Testing Controllers with Mocked Services

```typescript
const emailAuth = { register: jest.fn(), login: jest.fn() };
const githubAuth = { getAuthorizationUrl: jest.fn(), handleCallback: jest.fn() };
const telegramAuth = { authenticate: jest.fn() };

const module = await Test.createTestingModule({
  controllers: [AuthController],
  providers: [
    { provide: EmailAuthService, useValue: emailAuth },
    { provide: GithubAuthService, useValue: githubAuth },
    { provide: TelegramAuthService, useValue: telegramAuth },
    { provide: SessionService, useValue: sessionService },
  ],
}).compile();
```

Controllers are tested by mocking all services, so you verify **orchestration logic** (error handling, session manipulation, response formatting) without testing business logic again.

### 5. Mocking Express Request

```typescript
const mockRequest = (): Request => {
  const session = {
    userId: undefined,
    email: undefined,
    destroy: jest.fn((cb) => cb()),
  };
  return {
    session,
    sessionID: 'test-session-id',
    headers: { 'user-agent': 'TestAgent' },
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
  } as unknown as Request;
};
```

The `as unknown as Request` double-cast is necessary because we only implement the fields we need, not the entire Express Request interface.

### 6. Testing Guards

```typescript
const createMockContext = (session: Record<string, unknown>): ExecutionContext => ({
  switchToHttp: () => ({
    getRequest: () => ({ session }),
  }),
} as unknown as ExecutionContext);

it('should return true when session has userId', () => {
  const context = createMockContext({ userId: 'user-42' });
  expect(guard.canActivate(context)).toBe(true);
});

it('should throw UnauthorizedException when userId is undefined', () => {
  const context = createMockContext({});
  expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
});
```

### 7. Testing Callback-Based APIs (Session Store)

The `PrismaSessionStore` uses callback patterns (required by `express-session.Store`):

```typescript
it('should return session data for a valid session', (done) => {
  prisma.session.findUnique.mockResolvedValue({
    id: 'sid-1',
    data: JSON.stringify(sessionData),
    expiresAt: new Date(Date.now() + 86400000),
  });

  store.get('sid-1', (err, session) => {
    expect(err).toBeNull();
    expect(session).toBeDefined();
    expect(session.userId).toBe('user-1');
    done();  // ← Signal async completion
  });
});
```

The `done` callback tells Jest to wait for the asynchronous assertion.

### 8. Fake Timers (Session Store Cleanup)

```typescript
beforeEach(() => {
  jest.useFakeTimers();   // Replace setTimeout/setInterval
  store = new PrismaSessionStore(prisma, 86400000);
});

afterEach(() => {
  store.close();
  jest.useRealTimers();   // Restore real timers
});

it('should delete expired sessions on timer tick', async () => {
  prisma.session.deleteMany.mockResolvedValue({ count: 5 });

  jest.advanceTimersByTime(15 * 60 * 1000);  // Fast-forward 15 minutes
  await Promise.resolve();  // Flush microtask queue

  expect(prisma.session.deleteMany).toHaveBeenCalledWith({
    where: { expiresAt: { lt: expect.any(Date) } },
  });
});
```

### 9. Mocking External Modules (`jest.mock`)

The email auth service uses `bcrypt` for password hashing. This is mocked at the module level:

```typescript
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Later, in tests:
(bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashed');
(bcrypt.compare as jest.Mock).mockResolvedValue(true);
```

Similarly, the Telegram auth service uses Node.js `crypto` module which can be mocked for deterministic HMAC testing.

---

## E2E Testing Patterns

### 1. Full Application Bootstrap

E2E tests create a real NestJS application but mock the database:

```typescript
const moduleFixture = await Test.createTestingModule({
  imports: [AppModule],  // The real module tree
})
  .overrideProvider(PrismaService)  // Replace Prisma globally
  .useValue(mockPrisma)
  .compile();

app = moduleFixture.createNestApplication();

// Attach session middleware (same as main.ts)
app.use(session({
  secret: 'test-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: false },
}));

await app.init();
```

### 2. HTTP Assertions with Supertest

```typescript
const response = await request(app.getHttpServer())
  .post('/auth/register')
  .send({ email: 'test@example.com', password: 'password123', username: 'testuser' })
  .expect(HttpStatus.CREATED);

expect(response.body).toHaveProperty('userId');
expect(response.body.email).toBe('test@example.com');
```

### 3. Cookie/Session Persistence with Agent

To maintain cookies across requests (simulating a browser session):

```typescript
const agent = request.agent(app.getHttpServer());

// Request 1: Login (sets session cookie)
await agent.post('/auth/login')
  .send({ email: 'test@example.com', password: 'password123' });

// Request 2: Uses same cookie automatically
await agent.get('/auth/me');
```

### 4. Testing Protected Routes

```typescript
it('GET /auth/me should return 401', async () => {
  await request(app.getHttpServer())
    .get('/auth/me')
    .expect(HttpStatus.UNAUTHORIZED);
});
```

Without a session cookie, the `SessionGuard` rejects the request with 401.

---

## Test Coverage by Component

| Component | Tests | What's Covered |
|---|---|---|
| **EmailAuthService** (8) | Registration (success, duplicate email), login (success, wrong password, no user), bcrypt hashing, validation |
| **GithubAuthService** (11) | Authorization URL generation, code exchange (success, failure), user profile fetch, email fetch, user upsert, account linking |
| **TelegramAuthService** (9) | HMAC verification (valid, invalid), auth_date freshness, user upsert by telegramId, display name fallback |
| **SessionService** (11) | Session creation (IP fallback), listing with JSON parsing, malformed data handling, single/bulk session destruction |
| **AuthController** (20) | All 10 endpoints, error paths (invalid credentials, missing code, session ownership), session destruction success/failure |
| **PrismaSessionStore** (16) | get/set/destroy/touch operations, expired session cleanup, error handling, P2025 suppression, timer management |
| **SessionGuard** (6) | Allow with userId, reject undefined/null/empty, error message, edge cases |
| **UsersService** (10) | getProfile, getPublicProfile (with post count), updateProfile (username, image, empty DTO), getSettings (existing + auto-create defaults), updateSettings (theme, notifications) |
| **UsersController** (5) | GET/PATCH profile, GET/PATCH settings, GET public profile — all with mocked service |
| **PostsService** (16) | Create (content, image-only, empty rejection), findAll (pagination, hasMore detection, cursor, MAX_PAGE_SIZE cap), findByUser, findOne (not found), update/delete (ownership, not found, forbidden) |
| **PostsController** (7) | POST create, GET list (no cursor, with cursor+limit), GET by user, GET single, PATCH update, DELETE remove |
| **CommentsService** (14) | Create (success, empty content, post not found), findByPost (pagination, hasMore, post not found, cursor), update (success, empty, not found, forbidden), remove (success, not found, forbidden) |
| **CommentsController** (6) | POST create, GET list (no cursor, with cursor+limit), PATCH update, DELETE remove |
| **LikesService** (8) | Toggle like (create, delete), check like status, count likes, error handling |
| **LikesController** (5) | POST toggle, GET status, GET count — with auth guard |
| **BookmarksService** (8) | Toggle bookmark (create, delete), list bookmarks, check status, error handling |
| **BookmarksController** (5) | POST toggle, GET list, GET status — with auth guard |
| **ReactionsService** (5) | Add reaction, list reactions, remove reaction, error handling |
| **ReactionsController** (4) | POST add, GET list, DELETE remove — with auth guard |
| **AppController** (1) | GET / returns "Hello World!" |
| **E2E App** (1) | Full HTTP GET / through the real app pipeline |
| **E2E Auth** (22) | Email register/login, protected routes return 401, session management, GitHub callback path, Telegram auth |
| **E2E Integration** (40) | Full CRUD flows for posts, comments, likes, bookmarks, reactions across authenticated sessions |

---

## Running Tests

```bash
# Run all unit tests
npm test

# Run with verbose output
npx jest --verbose

# Run a specific test file
npx jest test/unit/auth/email-auth.service.spec.ts

# Run with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e

# Run E2E with verbose output
npx jest --config ./test/jest-e2e.json --verbose

# Watch mode (re-run on file changes)
npm run test:watch
```
