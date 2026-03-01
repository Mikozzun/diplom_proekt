# Backend TODO

## Legend

- [ ] Not started

- [~] In progress

- [X] Done

---

## 1. Security Hardening (Critical)

- [ ] Add global `ValidationPipe` in `main.ts` (install `class-validator` + `class-transformer`)
- [ ] Add `class-validator` decorators to all DTOs (`@IsString`, `@IsPhoneNumber`, `@IsNotEmpty`)
- [ ] Install and configure `helmet` for security headers
- [ ] Install `@nestjs/throttler` — rate-limit OTP endpoint to prevent brute-force / SMS bombing
- [ ] Generate a real `SESSION_SECRET` (64+ random chars) and add to `.env`
- [ ] Add `.env` to `.gitignore` (currently may be tracked with API keys)
- [ ] Create `.env.example` template with placeholder values
- [ ] Add CSRF protection (double-submit cookie or `csurf`)
- [ ] Add input sanitization for user-generated content (posts, comments)
- [ ] Add `ClassSerializerInterceptor` globally to strip sensitive fields (`passkey`, `credentialPublicKey`)

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
- [ ] Remove unused dependencies: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`

---

## 3. Feature Modules

### 3.1 Users Module

- [X] Create `UsersModule`, `UsersController`, `UsersService`
- [X] `GET /users/profile` — get own profile
- [X] `PATCH /users/profile` — update username, profile image
- [X] `GET /users/:id` — get public profile
- [X] `GET /users/settings` — get user settings
- [X] `PATCH /users/settings` — update theme, notification preferences
- [X] Write unit tests for UsersService
- [X] Write unit tests for UsersController

### 3.2 Posts Module

- [X] Create `PostsModule`, `PostsController`, `PostsService`
- [X] `POST /posts` — create post (text, image, video)
- [X] `GET /posts` — list posts with pagination (feed)
- [X] `GET /posts/:id` — get single post with comments count, likes count
- [X] `PATCH /posts/:id` — update own post
- [X] `DELETE /posts/:id` — delete own post
- [X] `GET /posts/user/:userId` — list posts by user
- [X] Add ownership check (can only edit/delete own posts)
- [X] Write tests

### 3.3 Comments Module

- [X] Create `CommentsModule`, `CommentsController`, `CommentsService`
- [X] `POST /posts/:postId/comments` — add comment
- [X] `GET /posts/:postId/comments` — list comments with pagination
- [X] `PATCH /comments/:id` — edit own comment
- [X] `DELETE /comments/:id` — delete own comment
- [X] Write tests

### 3.4 Likes Module

- [ ] Create `LikesModule`, `LikesController`, `LikesService`
- [ ] `POST /posts/:postId/like` — like a post (toggle)
- [ ] `DELETE /posts/:postId/like` — unlike a post
- [ ] `GET /posts/:postId/likes` — list users who liked
- [ ] Write tests

### 3.5 Bookmarks Module

- [ ] Create `BookmarksModule`, `BookmarksController`, `BookmarksService`
- [ ] `POST /posts/:postId/bookmark` — bookmark a post
- [ ] `DELETE /posts/:postId/bookmark` — remove bookmark
- [ ] `GET /bookmarks` — list user's bookmarks with pagination
- [ ] Write tests

### 3.6 Reactions Module

- [ ] Create `ReactionsModule`, `ReactionsController`, `ReactionsService`
- [ ] `POST /posts/:postId/reactions` — add reaction (type: emoji)
- [ ] `DELETE /posts/:postId/reactions` — remove reaction
- [ ] `GET /posts/:postId/reactions` — list reactions grouped by type
- [ ] Write tests

### 3.7 Polls Module

- [ ] Create `PollsModule`, `PollsController`, `PollsService`
- [ ] `POST /posts/:postId/poll` — create poll (question + options)
- [ ] `POST /polls/:pollId/vote` — submit vote
- [ ] `GET /polls/:pollId/results` — get poll results
- [ ] Prevent duplicate votes per user
- [ ] Write tests

### 3.8 Storage / File Upload Module

- [ ] Create `StorageModule`, `StorageController`, `StorageService`
- [ ] Configure Multer for file uploads (image types, size limits)
- [ ] `POST /upload` — upload file, return URL
- [ ] `DELETE /storage/:id` — delete uploaded file
- [ ] Integrate with Posts (attach images/videos to post creation)
- [ ] Add file type validation and virus scanning considerations
- [ ] Write tests

### 3.9 Notifications Module

- [ ] Create `NotificationsModule`, `NotificationsController`, `NotificationsService`
- [ ] `GET /notifications` — list user's notifications with pagination
- [ ] `PATCH /notifications/:id/read` — mark as read
- [ ] `POST /notifications/read-all` — mark all as read
- [ ] Create `NotificationsGateway` (WebSocket) for real-time push
- [ ] Trigger notifications on: like, comment, reaction, poll response
- [ ] Write tests

### 3.10 Roles & Authorization Module

- [ ] Create `RolesModule`, `RolesService`
- [ ] Create `RolesGuard` with `@Roles('admin', 'moderator')` decorator
- [ ] `GET /admin/roles` — list roles
- [ ] `POST /admin/roles/:userId` — assign role to user
- [ ] `DELETE /admin/roles/:userId/:roleId` — revoke role
- [ ] Add admin-only route protection across relevant endpoints
- [ ] Write tests

### 3.11 Moderation Module

- [ ] Create `ModerationModule`, `ModerationController`, `ModerationService`
- [ ] `POST /reports` — user submits a report
- [ ] `GET /admin/moderation` — list moderation queue (admin only)
- [ ] `PATCH /admin/moderation/:id` — approve/reject content
- [ ] Auto-populate moderation queue from reports
- [ ] Write tests

### 3.12 Analytics Module

- [ ] Create `AnalyticsModule`, `AnalyticsService`
- [ ] Create activity logging interceptor (auto-log user actions)
- [ ] `GET /admin/analytics/daily` — daily metrics (admin only)
- [ ] `GET /admin/analytics/users` — user activity logs (admin only)
- [ ] Cron job or scheduled task for daily metrics aggregation
- [ ] Write tests

---

## 4. WebSocket Gateway

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
| Auth system (OTP + WebAuthn + sessions)       | [x] Done        |
| Session store (PostgreSQL, no Redis)          | [x] Done        |
| Session guard                                 | [x] Done        |
| ESLint configuration                          | [x] Done        |
| Unit tests (130)                              | [x] Done        |
| E2E tests (11)                                | [x] Done        |
| Project documentation (6 files)               | [x] Done        |
| Users module                                  | [x] Done        |
| Posts module                                  | [x] Done        |
| Comments module                               | [x] Done        |
| Social features (likes, bookmarks, reactions) | [ ] Not started |
| Polls module                                  | [ ] Not started |
| File upload                                   | [ ] Not started |
| Notifications + WebSocket                     | [ ] Not started |
| Roles & authorization                         | [ ] Not started |
| Moderation                                    | [ ] Not started |
| Analytics                                     | [ ] Not started |
| Validation (class-validator)                  | [ ] Not started |
| Security hardening                            | [ ] Not started |
|                                               |                 |
|                                               |                 |
