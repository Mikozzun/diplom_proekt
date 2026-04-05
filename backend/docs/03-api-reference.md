# 03 — API Reference

Base URL: `https://frogger-backend.fly.dev/api`

All endpoints return JSON. Authenticated endpoints require either a session cookie (`credentials: 'include'`) or a `Bearer` JWT token.

## Response Format

All API responses follow this structure:

```json
// Success
{
  "success": true,
  "data": { ... }
}

// Success with pagination
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}

// Error
{
  "success": false,
  "error": "Error message"
}

// Validation error
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "fieldName": ["Error for this field"]
  }
}
```

## Pagination

Paginated endpoints accept query parameters:

| Param | Type | Default | Max | Description |
|-------|------|---------|-----|-------------|
| `page` | number | 1 | — | Page number |
| `limit` | number | 20 | 100 | Items per page |

Example: `GET /api/posts?page=2&limit=10`

## Rate Limiting

| Scope | Limit | Window |
|-------|-------|--------|
| Global (all endpoints) | 100 requests | 15 minutes |
| Auth endpoints | 20 requests | 15 minutes |

Rate limit headers are included in responses:
- `RateLimit-Limit`
- `RateLimit-Remaining`
- `RateLimit-Reset`

---

## Posts

### GET /api/posts

Get all posts with pagination.

**Auth:** Optional (enriches response with user-specific data like liked/bookmarked status)

**Query params:** `page`, `limit`

```bash
curl https://frogger-backend.fly.dev/api/posts?page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "content": "Hello world!",
      "imageUrl": null,
      "videoUrl": null,
      "userId": "1",
      "createdAt": "2026-04-05T10:00:00.000Z",
      "updatedAt": null,
      "user": {
        "id": "1",
        "name": "John Doe",
        "username": "johndoe",
        "image": null
      }
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 }
}
```

### POST /api/posts

Create a new post.

**Auth:** Required

**Body:**
```json
{
  "content": "My first post!",
  "imageUrl": "https://example.com/image.jpg",
  "videoUrl": "https://example.com/video.mp4"
}
```

All fields are optional, but at least one must be provided.

```typescript
const res = await fetch('https://frogger-backend.fly.dev/api/posts', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content: 'My first post!' }),
});
```

### GET /api/posts/feed

Get personalized feed for the authenticated user.

**Auth:** Required

**Query params:** `page`, `limit`

```typescript
const res = await fetch('https://frogger-backend.fly.dev/api/posts/feed', {
  credentials: 'include',
});
```

### GET /api/posts/:id

Get a single post by ID.

**Auth:** Optional

```bash
curl https://frogger-backend.fly.dev/api/posts/1
```

### PUT /api/posts/:id

Update a post (owner only).

**Auth:** Required (must be the post owner)

**Body:**
```json
{
  "content": "Updated content",
  "imageUrl": "https://example.com/new-image.jpg"
}
```

### DELETE /api/posts/:id

Delete a post (owner only).

**Auth:** Required (must be the post owner)

```typescript
await fetch('https://frogger-backend.fly.dev/api/posts/1', {
  method: 'DELETE',
  credentials: 'include',
});
```

---

## Comments

### GET /api/posts/:postId/comments

Get all comments for a post.

**Auth:** Not required

```bash
curl https://frogger-backend.fly.dev/api/posts/1/comments
```

### POST /api/posts/:postId/comments

Add a comment to a post.

**Auth:** Required

**Body:**
```json
{
  "content": "Great post!"
}
```

### PUT /api/comments/:id

Update a comment (owner only).

**Auth:** Required

**Body:**
```json
{
  "content": "Updated comment"
}
```

Content must be 1–5,000 characters.

### DELETE /api/comments/:id

Delete a comment (owner only).

**Auth:** Required

---

## Likes

### POST /api/posts/:postId/like

Toggle like on a post. Calling again removes the like.

**Auth:** Required

```typescript
await fetch('https://frogger-backend.fly.dev/api/posts/1/like', {
  method: 'POST',
  credentials: 'include',
});
```

---

## Bookmarks

### POST /api/posts/:postId/bookmark

Toggle bookmark on a post.

**Auth:** Required

### GET /api/bookmarks

Get all bookmarked posts for the authenticated user.

**Auth:** Required

```typescript
const res = await fetch('https://frogger-backend.fly.dev/api/bookmarks', {
  credentials: 'include',
});
```

---

## Reactions

### POST /api/posts/:postId/react

Add a reaction to a post.

**Auth:** Required

**Body:**
```json
{
  "reactionType": "👍"
}
```

### DELETE /api/posts/:postId/react

Remove a reaction from a post.

**Auth:** Required

**Body:**
```json
{
  "reactionType": "👍"
}
```

### GET /api/posts/:postId/reactions

Get all reactions for a post.

**Auth:** Not required

---

## Polls

### POST /api/posts/:postId/poll

Create a poll on a post.

**Auth:** Required

**Body:**
```json
{
  "question": "What's your favorite color?",
  "options": ["Red", "Blue", "Green"]
}
```

Options must be an array of 2–10 strings.

### POST /api/polls/:pollId/respond

Respond to a poll.

**Auth:** Required

**Body:**
```json
{
  "selectedOption": "Blue"
}
```

### GET /api/polls/:pollId/results

Get poll results.

**Auth:** Not required

---

## Users

### GET /api/users/me

Get the authenticated user's profile.

**Auth:** Required

```typescript
const res = await fetch('https://frogger-backend.fly.dev/api/users/me', {
  credentials: 'include',
});
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "name": "John Doe",
    "email": "user@example.com",
    "username": "johndoe",
    "displayUsername": "JohnDoe",
    "image": null,
    "profileImage": null,
    "phoneNumber": null,
    "createdAt": "2026-04-05T10:00:00.000Z"
  }
}
```

### PUT /api/users/me

Update profile.

**Auth:** Required

**Body:**
```json
{
  "username": "newusername",
  "profileImage": "https://example.com/avatar.jpg"
}
```

Username: 3–30 characters.

### DELETE /api/users/me

Delete account permanently.

**Auth:** Required

### GET /api/users/:id

Get public user profile.

**Auth:** Not required

---

## User Settings

### GET /api/users/me/settings

Get user settings.

**Auth:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "theme": "light",
    "notificationsEnabled": true
  }
}
```

### PUT /api/users/me/settings

Update settings.

**Auth:** Required

**Body:**
```json
{
  "theme": "dark",
  "notificationsEnabled": false
}
```

Theme must be `"light"` or `"dark"`.

---

## Sessions

### GET /api/users/me/sessions

List all active sessions for the authenticated user.

**Auth:** Required

### DELETE /api/users/me/sessions/:sessionId

Revoke a specific session (log out a device).

**Auth:** Required

---

## Notifications

### GET /api/notifications

Get all notifications.

**Auth:** Required

### GET /api/notifications/unread

Get unread notification count.

**Auth:** Required

**Response:**
```json
{
  "success": true,
  "data": { "count": 5 }
}
```

### PUT /api/notifications/read-all

Mark all notifications as read.

**Auth:** Required

### PUT /api/notifications/:id/read

Mark a specific notification as read.

**Auth:** Required

---

## Reports

### POST /api/reports

Submit a report.

**Auth:** Required

**Body:**
```json
{
  "reportType": "spam",
  "description": "This post contains spam content"
}
```

---

## Storage

### POST /api/storage

Upload a file.

**Auth:** Required

**Body:** `multipart/form-data` with a `file` field.

### GET /api/storage

List uploaded files for the authenticated user.

**Auth:** Required

### DELETE /api/storage/:id

Delete an uploaded file (owner only).

**Auth:** Required

---

## Passkeys

### POST /api/passkeys/register/start

Start passkey registration. Returns WebAuthn registration options.

**Auth:** Required

### POST /api/passkeys/register/finish

Complete passkey registration with the browser credential.

**Auth:** Required

### POST /api/passkeys/auth/start

Start passkey authentication. Returns WebAuthn authentication options.

**Auth:** Not required

### POST /api/passkeys/auth/finish

Complete passkey authentication with the browser assertion.

**Auth:** Not required

---

## Admin Endpoints

All admin endpoints require authentication **and** admin role.

### GET /api/admin/dashboard

Get dashboard metrics (user count, post count, etc.).

### GET /api/admin/users

List all users.

### POST /api/admin/users/:userId/role

Assign a role to a user.

### DELETE /api/admin/users/:userId/role

Remove a role from a user.

### POST /api/admin/users/:userId/promote

Promote a user to admin.

### POST /api/admin/users/:userId/ban

Ban a user.

### DELETE /api/admin/users/:userId

Delete a user.

### GET /api/admin/posts

List all posts.

### DELETE /api/admin/posts/:postId

Delete a post.

### POST /api/admin/users/batch-delete

Batch delete users.

**Body:**
```json
{
  "ids": ["1", "2", "3"]
}
```

### POST /api/admin/posts/batch-delete

Batch delete posts.

### GET /api/admin/moderation

Get moderation queue.

### PUT /api/admin/moderation/:id

Resolve moderation item (approve/reject).

### GET /api/admin/reports

Get all reports.

### GET /api/admin/metrics

Get system metrics.

---

## Health Check

### GET /health

**Auth:** Not required

```bash
curl https://frogger-backend.fly.dev/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-05T10:00:00.000Z"
}
```

---

## Error Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 201 | Created |
| 401 | Unauthorized — not authenticated |
| 403 | Forbidden — not authorized (e.g. not admin) |
| 404 | Not found |
| 422 | Validation failed — check `details` field |
| 429 | Rate limited — too many requests |
| 500 | Internal server error |
