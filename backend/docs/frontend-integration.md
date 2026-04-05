# Frontend Integration Guide

Step-by-step guide to connect a React (Vite) frontend to the Frogger backend.

**Backend URL:** `https://frogger-backend.fly.dev`

---

## 1. Create the Project

```bash
npm create vite@latest frogger-frontend -- --template react-ts
cd frogger-frontend
npm install
```

## 2. Install Dependencies

```bash
npm install better-auth axios react-router-dom
```

## 3. Files to Create

```
src/
├── lib/
│   ├── auth-client.ts      ← Better Auth client
│   └── api.ts              ← API helper (axios)
├── hooks/
│   └── use-session.ts      ← session hook wrapper
├── components/
│   ├── ProtectedRoute.tsx   ← route guard
│   ├── LoginForm.tsx        ← sign in form
│   └── SignUpForm.tsx       ← sign up form
├── App.tsx                  ← router setup
└── main.tsx
.env                         ← environment variable
```

---

## 4. Environment Variable

```bash
# .env
VITE_API_URL=http://localhost:5000
```

Production:

```bash
VITE_API_URL=https://frogger-backend.fly.dev
```

---

## 5. File Contents

### `src/lib/auth-client.ts`

```typescript
import { createAuthClient } from 'better-auth/react';
import {
  usernameClient,
  phoneNumberClient,
} from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL,
  plugins: [usernameClient(), phoneNumberClient()],
});

export const {
  signUp,
  signIn,
  signOut,
  useSession,
} = authClient;
```

### `src/lib/api.ts`

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true, // sends session cookie
  headers: { 'Content-Type': 'application/json' },
});

export default api;
```

### `src/hooks/use-session.ts`

```typescript
export { useSession } from '../lib/auth-client';
```

### `src/components/ProtectedRoute.tsx`

```tsx
import { Navigate } from 'react-router-dom';
import { useSession } from '../hooks/use-session';

export const ProtectedRoute = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { data: session, isPending } = useSession();

  if (isPending) return <div>Loading...</div>;
  if (!session) return <Navigate to="/login" replace />;

  return <>{children}</>;
};
```

### `src/components/SignUpForm.tsx`

```tsx
import { useState } from 'react';
import { signUp } from '../lib/auth-client';
import { useNavigate } from 'react-router-dom';

export const SignUpForm = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const form = new FormData(e.currentTarget);

    const { error } = await signUp.email({
      name: form.get('name') as string,
      email: form.get('email') as string,
      password: form.get('password') as string,
      username: form.get('username') as string,
    });

    if (error) {
      setError(error.message ?? 'Sign up failed');
      return;
    }
    navigate('/');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Name" required />
      <input name="username" placeholder="Username" required />
      <input name="email" type="email" placeholder="Email" required />
      <input
        name="password"
        type="password"
        placeholder="Password (8+ chars)"
        required
        minLength={8}
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit">Sign Up</button>
    </form>
  );
};
```

### `src/components/LoginForm.tsx`

```tsx
import { useState } from 'react';
import { signIn } from '../lib/auth-client';
import { useNavigate } from 'react-router-dom';

export const LoginForm = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const form = new FormData(e.currentTarget);

    const { error } = await signIn.email({
      email: form.get('email') as string,
      password: form.get('password') as string,
    });

    if (error) {
      setError(error.message ?? 'Login failed');
      return;
    }
    navigate('/');
  };

  const handleGitHub = () => {
    signIn.social({ provider: 'github' });
  };

  const handleGoogle = () => {
    signIn.social({ provider: 'google' });
  };

  return (
    <div>
      <form onSubmit={handleEmail}>
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Password" required />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Sign In</button>
      </form>

      <hr />
      <button onClick={handleGitHub}>Sign in with GitHub</button>
      <button onClick={handleGoogle}>Sign in with Google</button>
    </div>
  );
};
```

### `src/App.tsx`

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginForm } from './components/LoginForm';
import { SignUpForm } from './components/SignUpForm';

const Feed = () => {
  // see "Fetching Data" section below
  return <div>Feed page (protected)</div>;
};

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/signup" element={<SignUpForm />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Feed />
          </ProtectedRoute>
        }
      />
    </Routes>
  </BrowserRouter>
);

export default App;
```

---

## 6. Fetching Data

All API calls use `credentials: 'include'` (axios: `withCredentials: true`) so the session cookie is sent automatically.

### Posts

```typescript
import api from '../lib/api';

// Get feed
const { data } = await api.get('/posts/feed', {
  params: { page: 1, limit: 20 },
});
// data.data = Post[], data.meta = { page, limit, total, totalPages }

// Create post
await api.post('/posts', { content: 'Hello world!' });

// Delete post
await api.delete(`/posts/${postId}`);
```

### Comments

```typescript
// Get comments
const { data } = await api.get(`/posts/${postId}/comments`);

// Add comment
await api.post(`/posts/${postId}/comments`, { content: 'Nice!' });
```

### Likes & Bookmarks

```typescript
// Toggle like (call again to unlike)
await api.post(`/posts/${postId}/like`);

// Toggle bookmark
await api.post(`/posts/${postId}/bookmark`);

// Get my bookmarks
const { data } = await api.get('/bookmarks');
```

### Reactions

```typescript
// Add reaction
await api.post(`/posts/${postId}/react`, { reactionType: '👍' });

// Remove reaction
await api.delete(`/posts/${postId}/react`, {
  data: { reactionType: '👍' },
});
```

### Polls

```typescript
// Create poll on a post
await api.post(`/posts/${postId}/poll`, {
  question: 'Favorite color?',
  options: ['Red', 'Blue', 'Green'],
});

// Vote
await api.post(`/polls/${pollId}/respond`, {
  selectedOption: 'Blue',
});

// Get results
const { data } = await api.get(`/polls/${pollId}/results`);
```

### User Profile

```typescript
// Get my profile
const { data } = await api.get('/users/me');

// Update profile
await api.put('/users/me', { username: 'newname' });

// Get my settings
const { data } = await api.get('/users/me/settings');

// Update settings
await api.put('/users/me/settings', { theme: 'dark' });
```

### Notifications

```typescript
// Get all
const { data } = await api.get('/notifications');

// Unread count
const { data } = await api.get('/notifications/unread');
// data.data.count = 5

// Mark all read
await api.put('/notifications/read-all');

// Mark one read
await api.put(`/notifications/${id}/read`);
```

### Sign Out

```typescript
import { signOut } from '../lib/auth-client';

await signOut();
// session cookie is cleared, redirect to /login
```

---

## 7. API Response Shape

Every endpoint returns:

```typescript
// Success
{ success: true, data: T }

// Success with pagination
{ success: true, data: T[], meta: { page, limit, total, totalPages } }

// Error
{ success: false, error: string }

// Validation error
{ success: false, error: string, details: Record<string, string[]> }
```

### TypeScript types

```typescript
// src/types/api.ts

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  details?: Record<string, string[]>;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  username: string | null;
  displayUsername: string | null;
  image: string | null;
  profileImage: string | null;
  phoneNumber: string | null;
  createdAt: string;
}

interface Post {
  id: string;
  content: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string | null;
  user: {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
  };
}

interface Comment {
  id: string;
  content: string;
  userId: string;
  postId: string;
  createdAt: string;
  updatedAt: string | null;
  user: {
    id: string;
    name: string;
    username: string | null;
  };
}

interface Notification {
  id: string;
  message: string;
  type: string;
  readAt: string | null;
  createdAt: string;
}

interface UserSettings {
  theme: 'light' | 'dark';
  notificationsEnabled: boolean;
}
```

---

## 8. Backend Config Needed

Before the frontend works, these must be set on the backend:

### Environment variables (backend `.env` or Fly.io secrets)

```bash
CORS_ORIGIN="http://localhost:5173"          # Vite default port
FRONTEND_URL="http://localhost:5173"
```

Production:

```bash
CORS_ORIGIN="https://myapp.com"
FRONTEND_URL="https://myapp.com"
BETTER_AUTH_URL="https://frogger-backend.fly.dev"
```

### Trusted origins (backend `src/lib/auth.ts`)

Add your frontend URL to the `trustedOrigins` array:

```typescript
trustedOrigins: [
  process.env.BETTER_AUTH_URL || 'http://localhost:5000',
  'http://localhost:4000',
  'http://localhost:5173',  // ← add this for Vite dev
  'https://myapp.com',      // ← add this for production
],
```

---

## 9. Quick Reference

| Task | Code |
|------|------|
| Sign up | `signUp.email({ name, email, password, username })` |
| Sign in (email) | `signIn.email({ email, password })` |
| Sign in (username) | `signIn.username({ username, password })` |
| Sign in (GitHub) | `signIn.social({ provider: 'github' })` |
| Sign in (Google) | `signIn.social({ provider: 'google' })` |
| Sign out | `signOut()` |
| Get session | `useSession()` → `{ data, isPending, error }` |
| API call | `api.get('/posts')` / `api.post('/posts', body)` |
| Auth header | Not needed — cookies are sent via `withCredentials: true` |

**IDs are strings.** All entity IDs come as strings from the API (BigInt serialized). Compare with `===`, not `==`.

**Rate limits:** 100 requests / 15 min (global), 20 / 15 min (auth). Handle `429` responses gracefully.
