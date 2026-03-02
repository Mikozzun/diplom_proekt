# Backend TODO

## Legend

- [ ] Not started

- [~] In progress

- [X] Done

---

## 1. Security Hardening (Critical)

- [ ] Add global `ValidationPipe` in `main.ts` (install `class-transformer`)
- [ ] Add `class-validator` decorators to all DTOs (`@IsString`, `@IsEmail`, `@IsNotEmpty`)
- [ ] Install and configure `helmet` for security headers
- [ ] Install `@nestjs/throttler` — rate-limit auth endpoints to prevent brute-force
- [ ] Generate a real `SESSION_SECRET` (64+ random chars) and add to `.env`
- [ ] Add `.env` to `.gitignore` (currently may be tracked with API keys)
- [X] Create `.env.example` template with placeholder values
- [ ] Add CSRF protection (double-submit cookie or `csurf`)
- [ ] Add input sanitization for user-generated content (posts, comments)

---

## 2. Global Infrastructure

- [ ] Create a `PrismaModule` (`@Global()`) so PrismaService is shared across all modules instead of re-declared
- [ ] Consolidate the two `PrismaClient` instances (one in `main.ts`, one in `PrismaService`) into one shared instance
- [ ] Install `@nestjs/config` — replace raw `process.env` access with validated `ConfigService`
- [ ] Add environment variable validation schema (Joi or Zod) for startup checks
- [ ] Set global API prefix: `app.setGlobalPrefix('api/v1')`
- [ ] Create custom `HttpExceptionFilter` for consistent error response format
- [ ] Add request logging middleware or interceptor
- [ ] Install `@nestjs/swagger` for auto-generated API documentation
- [ ] Add health check endpoint (`@nestjs/terminus` — DB, memory, disk checks)
- [ ] Create shared pagination DTO and helper (offset/cursor-based)
- [ ] Add BigInt serialization interceptor (Prisma BigInt → string in JSON responses)

---

## 3. Deployment

- [X] Create Dockerfile (multi-stage Node 20 build)
- [X] Create fly.toml configuration
- [X] Create .dockerignore
- [X] Deploy to Fly.io (`frogger-backend.fly.dev`)
- [X] Set production secrets (DATABASE_URL, SESSION_SECRET, GITHUB_*, TELEGRAM_BOT_TOKEN, etc.)
- [X] Serve test frontend from backend (`/test/` route via `@nestjs/serve-static`)

---

## 4. Feature Modules

### 4.1 Auth Module

- [X] Create `AuthModule`, `AuthController`
- [X] Email + Password registration (bcrypt hashing) — `POST /auth/register`
- [X] Email + Password login — `POST /auth/login`
- [X] GitHub OAuth (authorization code flow) — `GET /auth/github`, `GET /auth/github/callback`
- [X] Telegram Login Widget verification — `POST /auth/telegram`
- [X] Session management (`GET /auth/me`, `GET /auth/sessions`, `DELETE /auth/sessions/:id`)
- [X] Logout / Logout all — `POST /auth/logout`, `POST /auth/logout/all`
- [X] Custom PrismaSessionStore for express-session
- [X] SessionGuard for route protection
- [X] Write unit tests (EmailAuthService, GithubAuthService, TelegramAuthService, SessionService, AuthController, PrismaSessionStore, SessionGuard)
- [X] Write E2E tests

### 4.2 Users Module

- [X] Create `UsersModule`, `UsersController`, `UsersService`
- [X] `GET /users/profile` — get own profile
- [X] `PATCH /users/profile` — update username, profile image
- [X] `GET /users/:id` — get public profile
- [X] `GET /users/settings` — get user settings
- [X] `PATCH /users/settings` — update theme, notification preferences
- [X] Write unit tests for UsersService
- [X] Write unit tests for UsersController

### 4.3 Posts Module

- [X] Create `PostsModule`, `PostsController`, `PostsService`
- [X] `POST /posts` — create post (text, image, video)
- [X] `GET /posts` — list posts with pagination (feed)
- [X] `GET /posts/:id` — get single post with comments count, likes count
- [X] `PATCH /posts/:id` — update own post
- [X] `DELETE /posts/:id` — delete own post
- [X] `GET /posts/user/:userId` — list posts by user
- [X] Add ownership check (can only edit/delete own posts)
- [X] Write tests

### 4.4 Comments Module

- [X] Create `CommentsModule`, `CommentsController`, `CommentsService`
- [X] `POST /posts/:postId/comments` — add comment
- [X] `GET /posts/:postId/comments` — list comments with pagination
- [X] `PATCH /comments/:id` — edit own comment
- [X] `DELETE /comments/:id` — delete own comment
- [X] Write tests

### 4.5 Likes Module

- [X] Create `LikesModule`, `LikesController`, `LikesService`
- [X] `POST /posts/:postId/likes` — like a post (toggle)
- [X] `DELETE /posts/:postId/likes` — unlike a post
- [X] `GET /posts/:postId/likes` — list users who liked
- [X] Write tests

### 4.6 Bookmarks Module

- [X] Create `BookmarksModule`, `BookmarksController`, `BookmarksService`
- [X] `POST /posts/:postId/bookmark` — bookmark a post (toggle)
- [X] `DELETE /posts/:postId/bookmark` — remove bookmark
- [X] `GET /bookmarks` — list user's bookmarks with pagination
- [X] Write tests

### 4.7 Reactions Module

- [X] Create `ReactionsModule`, `ReactionsController`, `ReactionsService`
- [X] `POST /posts/:postId/reactions` — add reaction (type: emoji, toggle)
- [X] `DELETE /posts/:postId/reactions?type=` — remove reaction
- [X] `GET /posts/:postId/reactions` — list reactions grouped by type
- [X] Write tests

### 4.8 Logs Module

- [X] Create `LogsModule`, `LogsController`, `LogsGateway`
- [X] WebSocket-based real-time log broadcasting
- [X] `GET /logs` — log dashboard page

### 4.9 Polls Module

- [ ] Create `PollsModule`, `PollsController`, `PollsService`
- [ ] `POST /posts/:postId/poll` — create poll (question + options)
- [ ] `POST /polls/:pollId/vote` — submit vote
- [ ] `GET /polls/:pollId/results` — get poll results
- [ ] Prevent duplicate votes per user
- [ ] Write tests

### 4.10 Storage / File Upload Module

- [ ] Create `StorageModule`, `StorageController`, `StorageService`
- [ ] Configure Multer for file uploads (image types, size limits)
- [ ] `POST /upload` — upload file, return URL
- [ ] `DELETE /storage/:id` — delete uploaded file
- [ ] Integrate with Posts (attach images/videos to post creation)
- [ ] Add file type validation and virus scanning considerations
- [ ] Write tests

### 4.11 Notifications Module

- [ ] Create `NotificationsModule`, `NotificationsController`, `NotificationsService`
- [ ] `GET /notifications` — list user's notifications with pagination
- [ ] `PATCH /notifications/:id/read` — mark as read
- [ ] `POST /notifications/read-all` — mark all as read
- [ ] Create `NotificationsGateway` (WebSocket) for real-time push
- [ ] Trigger notifications on: like, comment, reaction, poll response
- [ ] Write tests

### 4.12 Roles & Authorization Module

- [ ] Create `RolesModule`, `RolesService`
- [ ] Create `RolesGuard` with `@Roles('admin', 'moderator')` decorator
- [ ] `GET /admin/roles` — list roles
- [ ] `POST /admin/roles/:userId` — assign role to user
- [ ] `DELETE /admin/roles/:userId/:roleId` — revoke role
- [ ] Add admin-only route protection across relevant endpoints
- [ ] Write tests

### 4.13 Moderation Module

- [ ] Create `ModerationModule`, `ModerationController`, `ModerationService`
- [ ] `POST /reports` — user submits a report
- [ ] `GET /admin/moderation` — list moderation queue (admin only)
- [ ] `PATCH /admin/moderation/:id` — approve/reject content
- [ ] Auto-populate moderation queue from reports
- [ ] Write tests

### 4.14 Analytics Module

- [ ] Create `AnalyticsModule`, `AnalyticsService`
- [ ] Create activity logging interceptor (auto-log user actions)
- [ ] `GET /admin/analytics/daily` — daily metrics (admin only)
- [ ] `GET /admin/analytics/users` — user activity logs (admin only)
- [ ] Cron job or scheduled task for daily metrics aggregation
- [ ] Write tests

---

## 5. WebSocket Gateway

- [ ] Create `NotificationsGateway` using installed `@nestjs/websockets` + `socket.io`
- [ ] Authenticate WebSocket connections using session cookie
- [ ] Emit events: `new-notification`, `post-liked`, `new-comment`
- [ ] Handle connection/disconnection lifecycle
- [ ] Write tests

---

## Current Progress

| Area                                          | Status          |
| --------------------------------------------- | --------------- |
| Database schema (22 models)                   | [x] Done        |
| Auth system (Email+Password, GitHub, Telegram)| [x] Done        |
| Session store (PostgreSQL, no Redis)          | [x] Done        |
| Session guard                                 | [x] Done        |
| ESLint configuration                          | [x] Done        |
| Unit tests (165)                              | [x] Done        |
| E2E tests (63)                                | [x] Done        |
| Project documentation (6 files)               | [x] Done        |
| Users module                                  | [x] Done        |
| Posts module                                   | [x] Done        |
| Comments module                               | [x] Done        |
| Social features (likes, bookmarks, reactions) | [x] Done        |
| Logs module (WebSocket dashboard)             | [x] Done        |
| Deployment (Fly.io)                           | [x] Done        |
| Test frontend (served from backend /test/)    | [x] Done        |
| Polls module                                  | [ ] Not started |
| File upload                                   | [ ] Not started |
| Notifications + WebSocket                     | [ ] Not started |
| Roles & authorization                         | [ ] Not started |
| Moderation                                    | [ ] Not started |
| Analytics                                     | [ ] Not started |
| Validation (class-validator)                  | [ ] Not started |
| Security hardening                            | [ ] Not started |
