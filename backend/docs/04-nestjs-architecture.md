# NestJS Architecture & Components

## How NestJS Works

NestJS follows a **modular architecture** inspired by Angular. Every application is composed of:

```
Module
  ├── Controllers   — Handle HTTP requests, return responses
  ├── Providers     — Business logic (services, repositories, factories)
  └── Guards        — Route-level access control
```

NestJS uses **dependency injection (DI)** to wire everything together. You declare dependencies in constructors, and NestJS automatically creates and injects the right instances.

---

## Module System

### What Is a Module?

A module is a class annotated with `@Module()`. It groups related controllers, services, and other providers into a cohesive unit.

### Root Module — `AppModule`

```typescript
@Module({
  imports: [AuthModule, UsersModule, PostsModule, CommentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

- `imports` — Other modules whose exported providers become available here
- `controllers` — Classes that handle incoming HTTP requests
- `providers` — Injectable classes (services, repositories, etc.)

### Feature Module — `AuthModule`

```typescript
@Module({
  controllers: [AuthController],
  providers: [OtpService, WebAuthnService, SessionService, PrismaService],
  exports: [OtpService, WebAuthnService, SessionService],
})
export class AuthModule {}
```

- Encapsulates all authentication logic
- **Provides** `PrismaService` internally (services can inject it)
- **Exports** three services so other modules can import `AuthModule` and use them

### Feature Module — `UsersModule`

```typescript
@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}
```

- Manages user profile and settings CRUD
- `UsersController` has 5 endpoints (profile get/update, settings get/update, public profile)
- Uses `SessionGuard` for authenticated routes

### Feature Module — `PostsModule`

```typescript
@Module({
  controllers: [PostsController],
  providers: [PostsService, PrismaService],
  exports: [PostsService],
})
export class PostsModule {}
```

- Full post CRUD with cursor-based pagination
- `PostsController` has 6 endpoints (create, list, list by user, get, update, delete)
- Ownership checks — only post authors can update/delete

### Feature Module — `CommentsModule`

```typescript
@Module({
  controllers: [CommentsController],
  providers: [CommentsService, PrismaService],
  exports: [CommentsService],
})
export class CommentsModule {}
```

- Comment CRUD nested under posts (`/posts/:postId/comments`)
- `CommentsController` has 4 endpoints (create, list by post, update, delete)
- Ownership checks and empty-content validation

### Module Dependency Graph

```
AppModule
  ├── AppController + AppService
  ├── AuthModule
  │     ├── AuthController
  │     ├── OtpService        ← uses PrismaService
  │     ├── WebAuthnService    ← uses PrismaService
  │     ├── SessionService     ← uses PrismaService
  │     └── PrismaService      ← extends PrismaClient
  ├── UsersModule
  │     ├── UsersController    ← uses UsersService
  │     ├── UsersService       ← uses PrismaService
  │     └── PrismaService
  ├── PostsModule
  │     ├── PostsController    ← uses PostsService
  │     ├── PostsService       ← uses PrismaService
  │     └── PrismaService
  └── CommentsModule
        ├── CommentsController ← uses CommentsService
        ├── CommentsService    ← uses PrismaService
        └── PrismaService
```

---

## Controllers

### What Is a Controller?

A controller handles incoming **HTTP requests** and returns **responses**. NestJS routes are defined declaratively using decorators:

```typescript
@Controller('auth')  // All routes prefixed with /auth
export class AuthController {

  @Post('otp/send')           // POST /auth/otp/send
  @HttpCode(HttpStatus.OK)    // Return 200 instead of default 201
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.otpService.sendOtp(dto.phoneNumber);
  }
}
```

### Key Decorators

| Decorator | Purpose | Example |
|---|---|---|
| `@Controller('prefix')` | Sets route prefix | `@Controller('auth')` → `/auth/*` |
| `@Get()`, `@Post()`, `@Delete()` | HTTP method | `@Get('me')` → `GET /auth/me` |
| `@Body()` | Extracts request body | `@Body() dto: SendOtpDto` |
| `@Req()` | Injects the raw Express Request | `@Req() req: Request` |
| `@Param('id')` | Extracts URL parameter | `@Param('sessionId') id: string` |
| `@HttpCode(200)` | Override default status code | POST defaults to 201; override to 200 |
| `@UseGuards(Guard)` | Attach a guard | `@UseGuards(SessionGuard)` |

### `AppController`

```typescript
@Controller()           // No prefix → handles root routes
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()                // GET /
  getHello(): string {
    return this.appService.getHello();
  }
}
```

The simplest controller — takes no input, delegates to `AppService`, returns a string.

### `AuthController`

The main controller with 9 endpoints. See [Authentication docs](03-authentication.md) for full endpoint reference.

**Pattern:** The controller is a **thin orchestration layer**. It:
1. Extracts input from the request (body, params, session)
2. Calls one or more services
3. Formats and returns the response

Business logic lives in services, not controllers.

### `UsersController`

5 endpoints under the `/users` prefix:

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/users/profile` | Yes | Get own profile (phone, username, avatar) |
| `PATCH` | `/users/profile` | Yes | Update username or profile image |
| `GET` | `/users/settings` | Yes | Get own settings (theme, notifications) |
| `PATCH` | `/users/settings` | Yes | Update settings (upserts defaults if missing) |
| `GET` | `/users/:id` | No | Get public profile with post count |

### `PostsController`

6 endpoints under the `/posts` prefix:

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/posts` | Yes | Create a post (text, image, or video) |
| `GET` | `/posts` | No | List posts with cursor pagination (`?cursor=&limit=`) |
| `GET` | `/posts/user/:userId` | No | List posts by a specific user |
| `GET` | `/posts/:id` | No | Get a single post with comment/like counts |
| `PATCH` | `/posts/:id` | Yes | Update own post (ownership check) |
| `DELETE` | `/posts/:id` | Yes | Delete own post (ownership check) |

**Cursor Pagination:** Fetches `limit + 1` rows; if the extra row exists, `hasMore: true`. Response: `{ data, hasMore, nextCursor }`.

### `CommentsController`

4 endpoints using mixed route prefixes (controller has no prefix):

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/posts/:postId/comments` | Yes | Add a comment to a post |
| `GET` | `/posts/:postId/comments` | No | List comments for a post (cursor pagination) |
| `PATCH` | `/comments/:id` | Yes | Edit own comment (ownership check) |
| `DELETE` | `/comments/:id` | Yes | Delete own comment (ownership check) |

---

## Services (Providers)

### What Is a Service?

A service is a class annotated with `@Injectable()`. It contains **business logic** and is injected into controllers or other services via the constructor.

```typescript
@Injectable()
export class OtpService {
  constructor(private readonly prisma: PrismaService) {}
  // methods...
}
```

### Service Patterns in This Project

| Service | Dependencies | Pattern |
|---|---|---|
| `AppService` | None | Pure logic (returns "Hello World!") |
| `OtpService` | `PrismaService` | DB operations (create/query OTP records) |
| `WebAuthnService` | `PrismaService` | DB + external library (`@simplewebauthn/server`) |
| `SessionService` | `PrismaService` | DB operations (session CRUD) |
| `UsersService` | `PrismaService` | DB operations (profile & settings CRUD) |
| `PostsService` | `PrismaService` | DB operations (post CRUD, cursor pagination, ownership checks) |
| `CommentsService` | `PrismaService` | DB operations (comment CRUD, cursor pagination, ownership checks) |
| `PrismaService` | — | Infrastructure (extends `PrismaClient`) |

### Constructor Injection

NestJS automatically resolves and injects dependencies:

```typescript
@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}
  //          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //  NestJS sees PrismaService in the constructor,
  //  finds it in the module's providers, and injects the instance.
}
```

The `private readonly` shorthand both declares a class field and assigns the injected value.

### Logger

NestJS includes a built-in `Logger` class:

```typescript
private readonly logger = new Logger(OtpService.name);
// Output: [OtpService] [DEV] OTP for +1234567890: 123456
```

The argument to `Logger()` sets the **context** prefix in log output.

---

## Guards

### What Is a Guard?

A guard is a class that implements `CanActivate`. It decides whether a request should be handled by the route handler. Guards run **after middleware** but **before interceptors and pipes**.

```
Request → Middleware → Guards → Pipes → Handler → Interceptors → Response
```

### `SessionGuard`

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

- `ExecutionContext` provides access to the underlying request/response
- Returns `true` to allow, or throws `UnauthorizedException` (401) to deny
- Applied with `@UseGuards(SessionGuard)` on individual routes or entire controllers

### Guard vs. Middleware

| Aspect | Middleware | Guard |
|---|---|---|
| **Access to DI** | Limited | Full (can inject services) |
| **Metadata access** | No | Yes (can read `@SetMetadata()` decorators) |
| **NestJS integration** | Separate registration | `@UseGuards()` decorator |
| **Granularity** | Route patterns | Per-route, per-controller, or global |

---

## DTOs (Data Transfer Objects)

### What Is a DTO?

A DTO defines the **expected shape** of data entering the application. In NestJS, DTOs are typically plain classes (not interfaces) because classes persist at runtime, enabling validation pipes.

### This Project's DTOs

```
src/auth/dto/
  ├── send-otp.dto.ts              → { phoneNumber: string }
  ├── verify-otp.dto.ts            → { phoneNumber: string, code: string }
  ├── verify-registration.dto.ts   → { phoneNumber: string, credential: RegistrationResponseJSON }
  ├── verify-authentication.dto.ts → { credential: AuthenticationResponseJSON }
  └── index.ts                     → Barrel re-export

src/users/dto/
  ├── update-profile.dto.ts        → { username?: string, profileImage?: string }
  ├── update-settings.dto.ts       → { theme?: string, notificationsEnabled?: boolean }
  └── index.ts                     → Barrel re-export

src/posts/dto/
  ├── create-post.dto.ts           → { content?: string, imageUrl?: string, videoUrl?: string }
  ├── update-post.dto.ts           → { content?: string, imageUrl?: string, videoUrl?: string }
  └── index.ts                     → Barrel re-export

src/comments/dto/
  ├── create-comment.dto.ts        → { content: string }
  ├── update-comment.dto.ts        → { content: string }
  └── index.ts                     → Barrel re-export
```

### Barrel Export Pattern

The `index.ts` file re-exports all DTOs, enabling clean imports:

```typescript
// Instead of:
import { SendOtpDto } from './dto/send-otp.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';

// You can write:
import { SendOtpDto, VerifyOtpDto } from './dto/index.js';
```

---

## Type Augmentation (`session.d.ts`)

### What Is Declaration Merging?

TypeScript allows you to **extend** existing interfaces by declaring them again in the same module scope. This is called **declaration merging**.

### How We Augment `express-session`

```typescript
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    phoneNumber?: string;
    userAgent?: string;
    ip?: string;
    createdAt?: number;
    verifiedPhone?: string;
  }
}
```

After this augmentation, `req.session.userId` is recognized by TypeScript everywhere — in controllers, services, and tests — without any casting.

### Why `?` (Optional)

All fields are optional because sessions start empty. The `SessionGuard` ensures `userId` exists before protected handlers run.

---

## Request Lifecycle

A complete request through the NestJS pipeline:

```
1. HTTP Request arrives
      │
2. Express middleware (express-session)
   │  └─ PrismaSessionStore.get(sid) → loads session from PostgreSQL
   │  └─ Populates req.session
      │
3. NestJS Routing
   │  └─ Matches @Controller('auth') + @Post('otp/send')
      │
4. Guards (@UseGuards)
   │  └─ SessionGuard.canActivate()
   │     └─ Checks req.session.userId
   │     └─ Throws UnauthorizedException if missing
      │
5. Pipes (if configured)
   │  └─ ValidationPipe would validate DTOs here
      │
6. Controller method
   │  └─ @Body() dto extracted from request body
   │  └─ Calls service methods
   │  └─ Returns response object
      │
7. Interceptors (if configured)
      │
8. Response serialization
   │  └─ Object → JSON
      │
9. Express middleware (response phase)
   │  └─ PrismaSessionStore.set(sid, session) → persists session changes
      │
10. HTTP Response sent
```

---

## The Bootstrap File (`main.ts`)

The entry point configures and starts the application:

```typescript
async function bootstrap() {
  // 1. Create the NestJS application from the root module
  const app = await NestFactory.create(AppModule);

  // 2. Create a standalone Prisma client for the session store
  const prisma = new PrismaClient();
  await prisma.$connect();

  // 3. Attach express-session middleware with PostgreSQL backing
  app.use(session({
    store: new PrismaSessionStore(prisma),
    secret: process.env.SESSION_SECRET || 'change-me-in-production',
    // ... cookie options
  }));

  // 4. Enable CORS for the frontend
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,  // Required for Set-Cookie to work cross-origin
  });

  // 5. Start listening
  await app.listen(process.env.PORT ?? 3000);
}
```

### Why a Separate PrismaClient?

The `PrismaSessionStore` needs a `PrismaClient` instance, but it's configured **before** NestJS modules are initialized (it's Express-level middleware). The `PrismaService` inside NestJS DI is a separate instance used by services.

---

## Dependency Injection Flow

```
NestFactory.create(AppModule)
  │
  ├─ Reads @Module metadata
  ├─ Discovers AuthModule import
  │    ├─ Instantiates PrismaService (new PrismaClient + $connect)
  │    ├─ Instantiates OtpService(PrismaService)
  │    ├─ Instantiates WebAuthnService(PrismaService)
  │    ├─ Instantiates SessionService(PrismaService)
  │    └─ Instantiates AuthController(OtpService, WebAuthnService, SessionService)
  │
  ├─ Discovers UsersModule import
  │    ├─ Instantiates PrismaService (singleton)
  │    ├─ Instantiates UsersService(PrismaService)
  │    └─ Instantiates UsersController(UsersService)
  │
  ├─ Discovers PostsModule import
  │    ├─ Instantiates PrismaService (singleton)
  │    ├─ Instantiates PostsService(PrismaService)
  │    └─ Instantiates PostsController(PostsService)
  │
  ├─ Discovers CommentsModule import
  │    ├─ Instantiates PrismaService (singleton)
  │    ├─ Instantiates CommentsService(PrismaService)
  │    └─ Instantiates CommentsController(CommentsService)
  │
  ├─ Instantiates AppService()
  └─ Instantiates AppController(AppService)
```

All instances are **singletons** by default — NestJS creates each provider once and shares it across all consumers.
