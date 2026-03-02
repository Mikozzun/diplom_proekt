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
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public', 'test'),
      serveRoot: '/test',
    }),
    AuthModule,
    UsersModule,
    PostsModule,
    CommentsModule,
    LikesModule,
    BookmarksModule,
    ReactionsModule,
    LogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

- `imports` — Other modules whose exported providers become available here
- `controllers` — Classes that handle incoming HTTP requests
- `providers` — Injectable classes (services, repositories, etc.)
- `ServeStaticModule` — Serves the test frontend HTML from `public/test/` at the `/test/` route

### Feature Module — `AuthModule`

```typescript
@Module({
  controllers: [AuthController],
  providers: [
    EmailAuthService,
    GithubAuthService,
    TelegramAuthService,
    SessionService,
    PrismaService,
  ],
  exports: [EmailAuthService, GithubAuthService, TelegramAuthService, SessionService],
})
export class AuthModule {}
```

- Encapsulates all authentication logic (3 auth methods + session management)
- **Provides** `PrismaService` internally (services can inject it)
- **Exports** four services so other modules can import `AuthModule` and use them

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

### Feature Module — `LikesModule`

```typescript
@Module({
  controllers: [LikesController],
  providers: [LikesService, PrismaService],
  exports: [LikesService],
})
export class LikesModule {}
```

- Like/unlike toggle for posts
- `LikesController` has 3 endpoints (toggle like, check status, count)

### Feature Module — `BookmarksModule`

```typescript
@Module({
  controllers: [BookmarksController],
  providers: [BookmarksService, PrismaService],
  exports: [BookmarksService],
})
export class BookmarksModule {}
```

- Add/remove bookmarks for posts
- `BookmarksController` has 3 endpoints (toggle bookmark, list bookmarks, check status)

### Feature Module — `ReactionsModule`

```typescript
@Module({
  controllers: [ReactionsController],
  providers: [ReactionsService, PrismaService],
  exports: [ReactionsService],
})
export class ReactionsModule {}
```

- Emoji reactions on posts (typed reactions beyond simple likes)
- `ReactionsController` has 3 endpoints (add reaction, list reactions, remove reaction)

### Feature Module — `LogsModule`

```typescript
@Module({
  controllers: [LogsController],
  providers: [LogsGateway, WebSocketLogger],
})
export class LogsModule {}
```

- Real-time log streaming via WebSocket (Socket.IO)
- `LogsController` serves a dashboard HTML page at `GET /logs`
- `LogsGateway` broadcasts log entries to connected clients
- `WebSocketLogger` is a custom NestJS `LoggerService` that pipes logs to the WebSocket gateway

### Module Dependency Graph

```
AppModule
  ├── ServeStaticModule        ← serves public/test/ at /test/
  ├── AppController + AppService
  ├── AuthModule
  │     ├── AuthController
  │     ├── EmailAuthService     ← uses PrismaService
  │     ├── GithubAuthService    ← uses PrismaService
  │     ├── TelegramAuthService  ← uses PrismaService
  │     ├── SessionService       ← uses PrismaService
  │     └── PrismaService        ← extends PrismaClient
  ├── UsersModule
  │     ├── UsersController      ← uses UsersService
  │     ├── UsersService         ← uses PrismaService
  │     └── PrismaService
  ├── PostsModule
  │     ├── PostsController      ← uses PostsService
  │     ├── PostsService         ← uses PrismaService
  │     └── PrismaService
  ├── CommentsModule
  │     ├── CommentsController   ← uses CommentsService
  │     ├── CommentsService      ← uses PrismaService
  │     └── PrismaService
  ├── LikesModule
  │     ├── LikesController      ← uses LikesService
  │     ├── LikesService         ← uses PrismaService
  │     └── PrismaService
  ├── BookmarksModule
  │     ├── BookmarksController  ← uses BookmarksService
  │     ├── BookmarksService     ← uses PrismaService
  │     └── PrismaService
  ├── ReactionsModule
  │     ├── ReactionsController  ← uses ReactionsService
  │     ├── ReactionsService     ← uses PrismaService
  │     └── PrismaService
  └── LogsModule
        ├── LogsController
        ├── LogsGateway           ← WebSocket gateway
        └── WebSocketLogger       ← Custom NestJS logger
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

The main controller with 10 endpoints. See [Authentication docs](03-authentication.md) for full endpoint reference.

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
| `EmailAuthService` | `PrismaService` | DB operations + bcrypt hashing |
| `GithubAuthService` | `PrismaService` | DB operations + GitHub API (fetch) |
| `TelegramAuthService` | `PrismaService` | DB operations + HMAC verification (node:crypto) |
| `SessionService` | `PrismaService` | DB operations (session CRUD) |
| `UsersService` | `PrismaService` | DB operations (profile & settings CRUD) |
| `PostsService` | `PrismaService` | DB operations (post CRUD, cursor pagination, ownership checks) |
| `CommentsService` | `PrismaService` | DB operations (comment CRUD, cursor pagination, ownership checks) |
| `LikesService` | `PrismaService` | DB operations (like/unlike toggle) |
| `BookmarksService` | `PrismaService` | DB operations (bookmark CRUD) |
| `ReactionsService` | `PrismaService` | DB operations (reaction CRUD) |
| `PrismaService` | — | Infrastructure (extends `PrismaClient`) |
| `WebSocketLogger` | `LogsGateway` | Custom logger → WebSocket broadcast |

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
  ├── register.dto.ts         → { email: string, password: string, username: string }
  ├── login.dto.ts            → { email: string, password: string }
  ├── telegram-auth.dto.ts    → { id: number, first_name?, last_name?, username?, photo_url?, auth_date: number, hash: string }
  └── index.ts                → Barrel re-export

src/users/dto/
  ├── update-profile.dto.ts   → { username?: string, profileImage?: string }
  ├── update-settings.dto.ts  → { theme?: string, notificationsEnabled?: boolean }
  └── index.ts                → Barrel re-export

src/posts/dto/
  ├── create-post.dto.ts      → { content?: string, imageUrl?: string, videoUrl?: string }
  ├── update-post.dto.ts      → { content?: string, imageUrl?: string, videoUrl?: string }
  └── index.ts                → Barrel re-export

src/comments/dto/
  ├── create-comment.dto.ts   → { content: string }
  ├── update-comment.dto.ts   → { content: string }
  └── index.ts                → Barrel re-export

src/reactions/dto/
  ├── create-reaction.dto.ts  → { type: ReactionType }
  └── index.ts                → Barrel re-export
```

### Barrel Export Pattern

The `index.ts` file re-exports all DTOs, enabling clean imports:

```typescript
// Instead of:
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

// You can write:
import { RegisterDto, LoginDto, TelegramAuthDto } from './dto/index.js';
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
    email?: string;
    userAgent?: string;
    ip?: string;
    createdAt?: number;
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
   │  └─ Matches @Controller('auth') + @Post('register')
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
  │    ├─ Instantiates EmailAuthService(PrismaService)
  │    ├─ Instantiates GithubAuthService(PrismaService)
  │    ├─ Instantiates TelegramAuthService(PrismaService)
  │    ├─ Instantiates SessionService(PrismaService)
  │    └─ Instantiates AuthController(EmailAuth, GithubAuth, TelegramAuth, Session)
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
  ├─ Discovers LikesModule import
  │    ├─ Instantiates LikesService(PrismaService)
  │    └─ Instantiates LikesController(LikesService)
  │
  ├─ Discovers BookmarksModule import
  │    ├─ Instantiates BookmarksService(PrismaService)
  │    └─ Instantiates BookmarksController(BookmarksService)
  │
  ├─ Discovers ReactionsModule import
  │    ├─ Instantiates ReactionsService(PrismaService)
  │    └─ Instantiates ReactionsController(ReactionsService)
  │
  ├─ Discovers LogsModule import
  │    ├─ Instantiates WebSocketLogger(LogsGateway)
  │    ├─ Instantiates LogsGateway()
  │    └─ Instantiates LogsController()
  │
  ├─ Instantiates AppService()
  └─ Instantiates AppController(AppService)
```

All instances are **singletons** by default — NestJS creates each provider once and shares it across all consumers.
